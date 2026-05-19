from fastapi import FastAPI

from app.routers import health, score_clips, transcribe

app = FastAPI(
    title="ClipForge Worker AI",
    description="Transcription, clip scoring, and metadata generation",
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(transcribe.router)
app.include_router(score_clips.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "worker-ai", "status": "ok"}
