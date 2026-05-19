"""Heuristic + LLM clip scoring."""

from __future__ import annotations

import json
import os
from typing import Any

from openai import OpenAI

SYSTEM_PROMPT = """You are an expert short-form video editor.

Analyze transcript segments from long-form videos and score whether each would work as a standalone 30–60 second short.

Return a JSON object with key "scores" containing an array. Each item must include:
- windowId (string, must match input)
- overallScore, hookScore, standaloneScore, retentionScore (0-100)
- platformFit: { youtubeShorts, tiktok, instagramReels } (0-100 each)
- suggestedStartAdjustmentMs, suggestedEndAdjustmentMs (integers, typically -2000 to 2000)
- suggestedHook, suggestedTitle, suggestedCaption (strings)
- suggestedHashtags (array of strings, 3-8 items)
- reasonSelected (string, 1-2 sentences)
- warnings (array of strings, can be empty)

Be strict with JSON only. No markdown."""


def _build_user_prompt(windows: list[dict[str, Any]]) -> str:
    lines = ["Score these clip windows:\n"]
    for w in windows:
        lines.append(
            f'--- windowId: {w["id"]} ---\n'
            f'Duration: {w.get("durationSeconds", 0):.0f}s\n'
            f'Transcript:\n{w.get("transcriptExcerpt", "")}\n'
        )
    return "\n".join(lines)


def _heuristic_fallback(windows: list[dict[str, Any]]) -> dict[str, Any]:
    scores: list[dict[str, Any]] = []
    for w in windows:
        excerpt = str(w.get("transcriptExcerpt", ""))
        first_line = excerpt.split(".")[0].strip() or excerpt[:80]
        title = first_line[:60] if len(first_line) > 0 else "Clip idea"
        scores.append(
            {
                "windowId": w["id"],
                "overallScore": 55,
                "hookScore": 50,
                "standaloneScore": 55,
                "retentionScore": 50,
                "platformFit": {
                    "youtubeShorts": 60,
                    "tiktok": 60,
                    "instagramReels": 60,
                },
                "suggestedStartAdjustmentMs": 0,
                "suggestedEndAdjustmentMs": 0,
                "suggestedHook": title,
                "suggestedTitle": title,
                "suggestedCaption": excerpt[:200],
                "suggestedHashtags": ["shorts", "clip", "viral"],
                "reasonSelected": "Heuristic-only scoring (OPENAI_API_KEY not set).",
                "warnings": [],
            }
        )
    return {"scores": scores, "heuristicOnly": True}


def run(payload: dict[str, Any]) -> dict[str, Any]:
    windows = payload.get("windows")
    if not isinstance(windows, list) or len(windows) == 0:
        raise ValueError("windows array is required")

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if api_key == "":
        return _heuristic_fallback(windows)

    model = str(payload.get("model") or os.environ.get("OPENAI_MODEL", "gpt-4o-mini"))
    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(windows)},
        ],
        temperature=0.4,
    )

    content = response.choices[0].message.content
    if content is None:
        raise ValueError("Empty response from OpenAI")

    parsed = json.loads(content)
    scores = parsed.get("scores", parsed)
    if not isinstance(scores, list):
        raise ValueError("Expected scores array in LLM response")

    return {"scores": scores, "heuristicOnly": False}
