"""Faster-Whisper transcription."""

from __future__ import annotations

import os
import tempfile
from functools import lru_cache
from typing import Any

import httpx
from faster_whisper import WhisperModel

_model: WhisperModel | None = None
_model_key: str | None = None


def _get_model(model_name: str, device: str) -> WhisperModel:
    global _model, _model_key
    key = f"{model_name}:{device}"
    if _model is None or _model_key != key:
        compute_type = "int8" if device == "cpu" else "float16"
        _model = WhisperModel(model_name, device=device, compute_type=compute_type)
        _model_key = key
    return _model


def _download_audio(signed_url: str, dest_path: str) -> None:
    with httpx.Client(timeout=600.0, follow_redirects=True) as client:
        with client.stream("GET", signed_url) as response:
            response.raise_for_status()
            with open(dest_path, "wb") as f:
                for chunk in response.iter_bytes():
                    f.write(chunk)


def _segment_to_ms(seconds: float | None) -> int:
    if seconds is None:
        return 0
    return int(round(seconds * 1000))


def run(payload: dict[str, Any]) -> dict[str, Any]:
    signed_url = payload.get("signedUrl")
    if not isinstance(signed_url, str) or signed_url == "":
        raise ValueError("signedUrl is required")

    model_name = str(payload.get("model") or os.environ.get("WHISPER_MODEL", "base"))
    device = str(payload.get("device") or os.environ.get("WHISPER_DEVICE", "cpu"))
    if device == "auto":
        device = "cpu"

    with tempfile.TemporaryDirectory() as tmp:
        audio_path = os.path.join(tmp, "audio.wav")
        _download_audio(signed_url, audio_path)

        model = _get_model(model_name, device)
        segments_iter, info = model.transcribe(
            audio_path,
            word_timestamps=True,
            vad_filter=True,
        )

        segments: list[dict[str, Any]] = []
        for seg in segments_iter:
            words: list[dict[str, Any]] = []
            if seg.words is not None:
                for w in seg.words:
                    words.append(
                        {
                            "word": w.word.strip(),
                            "startMs": _segment_to_ms(w.start),
                            "endMs": _segment_to_ms(w.end),
                            "confidence": getattr(w, "probability", None),
                        }
                    )

            segments.append(
                {
                    "startMs": _segment_to_ms(seg.start),
                    "endMs": _segment_to_ms(seg.end),
                    "text": seg.text.strip(),
                    "confidence": getattr(seg, "avg_logprob", None),
                    "words": words,
                }
            )

        language = info.language if info.language is not None else "en"

        return {
            "language": language,
            "segments": segments,
        }
