from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.jobs.score_clips import run

router = APIRouter(prefix="/v1", tags=["score-clips"])


class ScoreWindowInput(BaseModel):
    id: str = Field(min_length=1)
    startMs: int
    endMs: int
    durationSeconds: float
    transcriptExcerpt: str = Field(min_length=1)


class ScoreClipsRequest(BaseModel):
    windows: list[ScoreWindowInput]
    model: str | None = None


@router.post("/score-clips")
def score_clips(body: ScoreClipsRequest) -> dict[str, Any]:
    try:
        return run(
            {
                "windows": [w.model_dump() for w in body.windows],
                "model": body.model,
            }
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
