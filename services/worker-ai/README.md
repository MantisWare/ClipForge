# ClipForge Worker AI

FastAPI service for transcription (Faster-Whisper) and AI clip scoring.

## Run locally

```bash
cd services/worker-ai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

Health check: `GET http://localhost:8002/health`

## Job modules (stubs)

- `app/jobs/transcribe.py` — Phase 3
- `app/jobs/score_clips.py` — Phase 4
