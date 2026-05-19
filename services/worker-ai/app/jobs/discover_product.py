"""LLM-based Amazon product discovery from clip context."""

from __future__ import annotations

import json
import os
from typing import Any

from openai import OpenAI

SYSTEM_PROMPT = """You help short-form video creators pick ONE relevant affiliate product.

Given a clip transcript, hook, and title, suggest a product viewers might want to buy that fits the content.

Return JSON only with keys:
- searchQuery (string, 3-8 words for retailer search)
- productTitle (string, shopper-friendly product name, max 120 chars)
- rationale (string, 1-2 sentences why it fits the clip)
- placementHint (string, optional word/phrase from transcript to time the overlay)
- suggestedCategory (string, optional short category label)
- productCategory (string, one of: tech, lifestyle, general)

Rules:
- Prefer practical products clearly related to the topic (gear, tools, books, accessories).
- Use productCategory "tech" for gadgets/electronics/gaming; "lifestyle" for gifts/craft/home aesthetic; else "general".
- Do not suggest illegal, medical claims, or adult content.
- searchQuery must be specific enough for search (not generic "product").
- No markdown."""


def _build_user_prompt(payload: dict[str, Any]) -> str:
    lines = [
        f"Clip title: {payload.get('suggestedTitle', '')}",
        f"Hook: {payload.get('suggestedHook', '')}",
        f"Caption: {payload.get('suggestedCaption', '')}",
        f"Hashtags: {', '.join(payload.get('suggestedHashtags') or [])}",
        "",
        "Transcript excerpt:",
        str(payload.get("transcriptExcerpt", "")),
    ]
    segments = payload.get("transcriptSegments")
    if isinstance(segments, list) and len(segments) > 0:
        lines.append("")
        lines.append("Timed segments (ms):")
        for seg in segments[:12]:
            if isinstance(seg, dict):
                lines.append(
                    f"- {seg.get('startMs', 0)}-{seg.get('endMs', 0)}: {seg.get('text', '')}"
                )
    return "\n".join(lines)


def _heuristic_fallback(payload: dict[str, Any]) -> dict[str, Any]:
    excerpt = str(payload.get("transcriptExcerpt", "")).strip()
    hook = str(payload.get("suggestedHook", "")).strip()
    title = str(payload.get("suggestedTitle", "")).strip()
    seed = hook if hook != "" else (title if title != "" else excerpt[:80])
    words = [w for w in seed.replace("#", " ").split() if len(w) > 3][:6]
    search_query = " ".join(words) if len(words) > 0 else "creator essentials kit"
    return {
        "searchQuery": search_query,
        "productTitle": f"Related: {search_query.title()}",
        "rationale": "Heuristic product match (OPENAI_API_KEY not set).",
        "placementHint": words[0] if len(words) > 0 else None,
        "suggestedCategory": "general",
        "heuristicOnly": True,
    }


def run(payload: dict[str, Any]) -> dict[str, Any]:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if api_key == "":
        return _heuristic_fallback(payload)

    base_url = os.environ.get("OPENAI_BASE_URL", "").strip()
    model = str(payload.get("model") or os.environ.get("OPENAI_MODEL", "gpt-4o-mini"))

    client = (
        OpenAI(api_key=api_key, base_url=base_url)
        if base_url != ""
        else OpenAI(api_key=api_key)
    )

    response = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(payload)},
        ],
        temperature=0.5,
    )

    content = response.choices[0].message.content
    if content is None:
        raise ValueError("Empty response from OpenAI")

    parsed = json.loads(content)
    required = ["searchQuery", "productTitle", "rationale"]
    for key in required:
        if key not in parsed or not str(parsed[key]).strip():
            raise ValueError(f"Missing {key} in LLM response")

    return parsed
