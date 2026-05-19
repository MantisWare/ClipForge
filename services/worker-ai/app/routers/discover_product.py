from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.jobs.discover_product import run

router = APIRouter(prefix="/v1", tags=["affiliate"])


class TranscriptSegmentInput(BaseModel):
    startMs: int
    endMs: int
    text: str


class DiscoverProductRequest(BaseModel):
    suggestedTitle: str | None = None
    suggestedHook: str | None = None
    suggestedCaption: str | None = None
    suggestedHashtags: list[str] = Field(default_factory=list)
    transcriptExcerpt: str = ""
    transcriptSegments: list[TranscriptSegmentInput] = Field(default_factory=list)
    model: str | None = None


@router.post("/discover-amazon-product")
def discover_amazon_product(body: DiscoverProductRequest) -> dict[str, Any]:
    try:
        return run(body.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
