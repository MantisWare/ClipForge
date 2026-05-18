from fastapi import FastAPI

from app.routers import health

app = FastAPI(
    title="ClipForge Worker Video",
    description="Video import, audio extraction, and FFmpeg rendering",
    version="0.1.0",
)

app.include_router(health.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "worker-video", "status": "ok"}
