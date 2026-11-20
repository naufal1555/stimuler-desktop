from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from api.container import container

router = APIRouter(prefix="/api", tags=["media"])

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-US-JennyNeural"

class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "id"

@router.post("/tts")
async def text_to_speech(request: Request, req: TTSRequest):
    base_url = f"{request.base_url.scheme}://{request.base_url.netloc}".rstrip("/")
    try:
        audio_url = await container.synthesize_voice_uc.execute(
            text=req.text,
            voice=req.voice,
            base_url=base_url
        )
        return {"status": "success", "audio_url": audio_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS Generation failed: {str(e)}")

@router.post("/translate")
async def translate_text(req: TranslateRequest):
    try:
        translated = await container.translate_text_uc.execute(req.text, req.target_lang)
        return {"status": "success", "translated_text": translated}
    except Exception as e:
        return {"status": "error", "translated_text": req.text}
