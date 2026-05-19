from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.jobs.transcribe import run

router = APIRouter(prefix="/v1", tags=["transcribe"])


class TranscribeRequest(BaseModel):
    signedUrl: str = Field(min_length=1)
    storageKey: str | None = None
    model: str | None = None
    device: str | None = None


@router.post("/transcribe")
def transcribe(body: TranscribeRequest) -> dict[str, Any]:
    try:
        return run(
            {
                "signedUrl": body.signedUrl,
                "storageKey": body.storageKey,
                "model": body.model,
                "device": body.device,
            }
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
