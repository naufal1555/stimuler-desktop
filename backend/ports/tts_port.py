from typing import Protocol, Optional
from pathlib import Path

class ITTSEngine(Protocol):
    async def synthesize(self, text: str, voice: Optional[str] = None) -> str:
        """Synthesizes text to speech audio and returns generated filename."""
        ...
