import time
import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from pydantic import BaseModel

from api.container import container
from domain.entities import TurnAnalysis
from domain.value_objects import TranscriptionResult, WordTiming

logger = logging.getLogger("stimuler.router.conversation")

router = APIRouter(prefix="/api", tags=["conversation"])

class EvaluateRequest(BaseModel):
    user_speech: str
    topic_title: str
    conversation_history: List[Dict[str, Any]] = []
    api_key: Optional[str] = None

class PronunciationScoreRequest(BaseModel):
    target_word: str
    transcribed_text: str
    words: List[Dict[str, Any]] = []
    syllables: Optional[List[str]] = None
    stressed_index: int = 0

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

@router.post("/pronunciation/score")
def score_pronunciation(req: PronunciationScoreRequest):
    words = [
        WordTiming(
            word=w.get("word", ""),
            start=float(w.get("start", 0.0)),
            end=float(w.get("end", 0.0)),
            probability=float(w.get("probability", 0.5))
        )
        for w in req.words
    ]
    transcription = TranscriptionResult(
        text=req.transcribed_text,
        duration=1.0,
        wpm=60,
        words=words
    )

    assessment = container.evaluate_pronunciation_uc.execute(
        target_word=req.target_word,
        transcription=transcription,
        syllables=req.syllables,
        stressed_index=req.stressed_index
    )

    return {
        "status": "success",
        "data": {
            "target_word": assessment.target_word,
            "transcribed_word": assessment.transcribed_word,
            "score": assessment.score,
            "is_correct": assessment.is_correct,
            "accuracy_level": assessment.accuracy_level,
            "confidence": assessment.confidence,
            "syllables": [
                {
                    "syllable": s.syllable,
                    "score": s.score,
                    "is_stressed": s.is_stressed
                }
                for s in assessment.syllable_scores
            ],
            "feedback": assessment.feedback
        }
    }

@router.post("/pronunciation/evaluate")
async def evaluate_pronunciation_audio(
    file: UploadFile = File(...),
    target_word: str = Form(...),
    syllables: Optional[str] = Form(None),
    stressed_index: int = Form(0)
):
    raw_bytes = await file.read()
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Empty audio payload")

    is_webm = raw_bytes.startswith(b"\x1a\x45\xdf\xa3") or "webm" in (file.content_type or "")
    ext = ".webm" if is_webm else ".wav"
    filename = f"pron_{int(time.time() * 1000)}{ext}"
    temp_audio = container.audio_cache_dir / filename

    with open(temp_audio, "wb") as f:
        f.write(raw_bytes)

    transcription: TranscriptionResult = container.transcribe_speech_uc.execute(temp_audio)

    parsed_syllables = None
    if syllables:
        try:
            parsed_syllables = json.loads(syllables)
        except Exception:
            parsed_syllables = [s.strip() for s in syllables.split(",") if s.strip()]

    assessment = container.evaluate_pronunciation_uc.execute(
        target_word=target_word,
        transcription=transcription,
        syllables=parsed_syllables,
        stressed_index=stressed_index
    )

    return {
        "status": "success",
        "data": {
            "target_word": assessment.target_word,
            "transcribed_word": assessment.transcribed_word,
            "score": assessment.score,
            "is_correct": assessment.is_correct,
            "accuracy_level": assessment.accuracy_level,
            "confidence": assessment.confidence,
            "syllables": [
                {
                    "syllable": s.syllable,
                    "score": s.score,
                    "is_stressed": s.is_stressed
                }
                for s in assessment.syllable_scores
            ],
            "feedback": assessment.feedback
        }
    }
