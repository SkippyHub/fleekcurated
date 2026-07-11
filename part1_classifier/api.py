"""FastAPI routes — Part 1 classifier + Part 2 Gemini alterations."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from part1_classifier.catalogue import list_products
from part1_classifier.classifier import classify_input
from part1_classifier.describer import describe_prompt
from part1_classifier.models import AnalyzeResponse, InputType
from part2_customizer.curate_pipeline import curate
from part2_customizer.models import CurateResponse, CustomizeResponse, EstimateResponse, OrderResponse
from part2_customizer.pipeline import customize_only
from part2_customizer.pricing import create_mock_order, estimate_order

load_dotenv()

ROOT = Path(__file__).resolve().parents[1]
GENERATED_DIR = ROOT / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Fleek Curated",
    description="Classify prompts and customise Fleek products for joinfleek.com",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")


def _base_url() -> str:
    return "http://localhost:8000"


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "fleek-curated"}


@app.get("/products")
def products() -> dict:
    items = list_products()
    return {"products": [p.model_dump() for p in items]}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_prompt(
    text: Optional[str] = Form(default=None),
    image: Optional[UploadFile] = File(default=None),
    image_url: Optional[str] = Form(default=None),
) -> AnalyzeResponse:
    image_bytes, content_type = await _read_image(image)

    try:
        classification = classify_input(
            text=text,
            image_bytes=image_bytes,
            content_type=content_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    description = describe_prompt(
        classification.input_type,
        text=text,
        image_bytes=image_bytes if classification.input_type == InputType.IMAGE else None,
        image_url=image_url,
    )

    return AnalyzeResponse(classification=classification, description=description)


@app.post("/estimate", response_model=EstimateResponse)
async def estimate_order_endpoint(
    product_id: str = Form(...),
    customization_prompt: str = Form(...),
    promo_code: Optional[str] = Form(default=None),
    include_preview: bool = Form(default=True),
) -> EstimateResponse:
    """Mock pricing — bundle + AI alteration cost estimate."""
    try:
        estimate = estimate_order(
            product_id=product_id,
            customization_prompt=customization_prompt.strip(),
            promo_code=promo_code,
            include_preview=include_preview,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return EstimateResponse(product_id=product_id, estimate=estimate)


@app.post("/orders/mock", response_model=OrderResponse)
async def place_mock_order(
    product_id: str = Form(...),
    customization_prompt: str = Form(...),
    promo_code: Optional[str] = Form(default=None),
    include_preview: bool = Form(default=True),
) -> OrderResponse:
    """Place a mock order — returns estimate + checkout redirect to Fleek."""
    try:
        order = create_mock_order(
            product_id=product_id,
            customization_prompt=customization_prompt.strip(),
            promo_code=promo_code,
            include_preview=include_preview,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return OrderResponse(order=order)


@app.post("/customize", response_model=CustomizeResponse)
async def customize_product_endpoint(
    product_id: str = Form(...),
    customization_prompt: str = Form(...),
    clothing_item: Optional[str] = Form(default=None),
    image: Optional[UploadFile] = File(default=None),
) -> CustomizeResponse:
    """
    Part 2 — Gemini Banana clothing alteration.

    Send product_id + customization_prompt. Optional image overrides catalogue photo.
    """
    image_bytes, _ = await _read_image(image)

    try:
        return customize_only(
            product_id=product_id,
            customization_prompt=customization_prompt.strip(),
            image_bytes=image_bytes,
            clothing_item=clothing_item,
            base_url=_base_url(),
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/curate", response_model=CurateResponse)
async def curate_prompt(
    product_id: str = Form(...),
    text: Optional[str] = Form(default=None),
    customization_prompt: Optional[str] = Form(default=None),
    image: Optional[UploadFile] = File(default=None),
    image_url: Optional[str] = Form(default=None),
) -> CurateResponse:
    """Part 1 classify + describe, then Part 2 Gemini customise + product lookup."""
    image_bytes, content_type = await _read_image(image)

    try:
        return curate(
            product_id=product_id,
            text=text,
            customization_prompt=customization_prompt,
            image_bytes=image_bytes,
            image_url=image_url,
            content_type=content_type,
            base_url=_base_url(),
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


async def _read_image(image: Optional[UploadFile]) -> tuple[bytes | None, str | None]:
    if image is None:
        return None, None
    return await image.read(), image.content_type
