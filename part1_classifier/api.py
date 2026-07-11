"""FastAPI routes for Part 1 — prompt classification & description."""

from __future__ import annotations

from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from part1_classifier.classifier import classify_input
from part1_classifier.describer import describe_prompt
from part1_classifier.models import AnalyzeResponse, InputType

app = FastAPI(
    title="Fleek Curated — Part 1 Classifier",
    description="Classify text vs image prompts and describe clothing customisation intent for joinfleek.com",
    version="0.1.0",
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
    return {"status": "ok", "service": "fleek-part1-classifier"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_prompt(
    text: Optional[str] = Form(default=None),
    image: Optional[UploadFile] = File(default=None),
    image_url: Optional[str] = Form(default=None),
) -> AnalyzeResponse:
    """
    Analyze customer input from the Fleek upsell flow.

    Send either:
    - `text` — written prompt
    - `image` — uploaded reference photo
    - both — image plus caption/context
    """
    image_bytes: bytes | None = None
    content_type: str | None = None

    if image is not None:
        image_bytes = await image.read()
        content_type = image.content_type

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
