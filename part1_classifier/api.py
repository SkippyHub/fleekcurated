"""FastAPI routes — Part 1 classifier + Part 2 integration."""

from __future__ import annotations

from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from part1_classifier.catalogue import list_products
from part1_classifier.classifier import classify_input
from part1_classifier.describer import describe_prompt
from part1_classifier.models import AnalyzeResponse, InputType
from part2_customizer.curate_pipeline import curate
from part2_customizer.models import CurateResponse

app = FastAPI(
    title="Fleek Curated",
    description="Classify prompts and customise Fleek products for joinfleek.com",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "fleek-curated"}


@app.get("/products")
def products() -> dict:
    """Mock Fleek catalogue — used by Part 2 and the Next.js product picker."""
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


@app.post("/curate", response_model=CurateResponse)
async def curate_prompt(
    product_id: str = Form(...),
    text: Optional[str] = Form(default=None),
    image: Optional[UploadFile] = File(default=None),
    image_url: Optional[str] = Form(default=None),
) -> CurateResponse:
    """Part 1 classify + describe, then Part 2 customise + product lookup."""
    image_bytes, content_type = await _read_image(image)

    try:
        return curate(
            product_id=product_id,
            text=text,
            image_bytes=image_bytes,
            image_url=image_url,
            content_type=content_type,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


async def _read_image(image: Optional[UploadFile]) -> tuple[bytes | None, str | None]:
    if image is None:
        return None, None
    return await image.read(), image.content_type
