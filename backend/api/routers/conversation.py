import time
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from pydantic import BaseModel

from api.container import container
from domain.entities import TurnAnalysis
from domain.value_objects import TranscriptionResult

logger = logging.getLogger("stimuler.router.conversation")

router = APIRouter(prefix="/api", tags=["conversation"])

class EvaluateRequest(BaseModel):
    user_speech: str
    topic_title: str
    conversation_history: List[Dict[str, Any]] = []
    api_key: Optional[str] = None

@router.post("/transcribe")
async def transcribe_audio(request: Request, file: UploadFile = File(...)):
    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Empty audio payload")

    is_webm = raw_bytes.startswith(b"\x1a\x45\xdf\xa3") or "webm" in (file.content_type or "")
    ext = ".webm" if is_webm else ".wav"
    filename = f"upload_{int(time.time() * 1000)}{ext}"
    temp_audio = container.audio_cache_dir / filename

    with open(temp_audio, "wb") as f:
        f.write(raw_bytes)

    base_url = f"{request.base_url.scheme}://{request.base_url.netloc}".rstrip("/")
    audio_url = f"{base_url}/audio_cache/{filename}"

    result: TranscriptionResult = container.transcribe_speech_uc.execute(temp_audio)

    words_payload = [
        {
            "word": w.word,
            "start": w.start,
            "end": w.end,
            "probability": w.probability
        }
        for w in result.words
    ]

    return {
        "status": result.status,
        "text": result.text,
        "duration": result.duration,
        "wpm": result.wpm,
        "words": words_payload,
        "audio_url": audio_url
    }

@router.post("/evaluate")
async def evaluate_turn(request: Request, req: EvaluateRequest):
    base_url = f"{request.base_url.scheme}://{request.base_url.netloc}".rstrip("/")

    analysis: TurnAnalysis = await container.evaluate_conversation_uc.execute(
        user_speech=req.user_speech,
        topic_title=req.topic_title,
        conversation_history=req.conversation_history,
        api_key=req.api_key,
        base_url=base_url
    )

    data = {
        "reply_text": analysis.reply_text,
        "hint_text": analysis.hint_text,
        "overall_score": analysis.overall_score,
        "ielts_band": analysis.ielts_band,
        "grammar_corrections": [
            {
                "original": c.original,
                "corrected": c.corrected,
                "reason": c.reason
            }
            for c in analysis.grammar_corrections
        ],
        "vocabulary_suggestions": [
            {
                "wrong_word": v.wrong_word,
                "right_word": v.right_word
            }
            for v in analysis.vocabulary_suggestions
        ],
        "improved_speech": analysis.improved_speech,
        "mispronounced_words": analysis.mispronounced_words,
        "audio_url": analysis.audio_url
    }

    return {"status": "success", "data": data}
