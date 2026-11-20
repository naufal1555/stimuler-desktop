import time
import logging
from pathlib import Path
from typing import Optional
import edge_tts
from ports.tts_port import ITTSEngine

logger = logging.getLogger("stimuler.edge_tts_adapter")

class EdgeTTSAdapter(ITTSEngine):
    """
    Adapter integrating Microsoft Edge TTS for natural, neural speech synthesis.
    Default voice is 'en-US-JennyNeural' (Sarah).
    """

    def __init__(self, output_dir: Path, default_voice: str = "en-US-JennyNeural"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.default_voice = default_voice

    async def synthesize(self, text: str, voice: Optional[str] = None) -> str:
        clean_text = text.strip()
        if not clean_text:
            raise ValueError("TTS text cannot be empty.")

        target_voice = voice or self.default_voice
        filename = f"sarah_{int(time.time() * 1000)}.mp3"
        target_path = self.output_dir / filename

        try:
            communicate = edge_tts.Communicate(clean_text, target_voice)
            await communicate.save(str(target_path))
            return filename
        except Exception as e:
            logger.error("Edge TTS synthesis failed for '%s': %s", clean_text[:30], e)
            raise e
