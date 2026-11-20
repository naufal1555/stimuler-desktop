from typing import Optional
from ports.tts_port import ITTSEngine

class SynthesizeVoiceUseCase:
    """
    Direct text-to-speech synthesis use case.
    """

    def __init__(self, tts_engine: ITTSEngine):
        self.tts_engine = tts_engine

    async def execute(self, text: str, voice: Optional[str] = None, base_url: str = "http://localhost:8765") -> str:
        filename = await self.tts_engine.synthesize(text, voice)
        return f"{base_url}/audio_cache/{filename}"
