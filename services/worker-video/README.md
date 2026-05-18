# ClipForge Worker Video

FastAPI service for video import, audio extraction, and FFmpeg rendering.

## Requirements

- Python 3.11+
- [FFmpeg](https://ffmpeg.org/) on PATH

## Run locally

```bash
cd services/worker-video
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Health check: `GET http://localhost:8001/health`

## Job modules (stubs)

- `app/jobs/import_video.py` — Phase 2
- `app/jobs/extract_audio.py` — Phase 3
- `app/jobs/render_clip.py` — Phase 5

Redis/BullMQ consumer wiring arrives in Phase 2.
