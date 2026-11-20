from typing import Protocol
import numpy as np
from domain.value_objects import TranscriptionResult

class ISTTEngine(Protocol):
    def transcribe(self, audio_array: np.ndarray, duration: float) -> TranscriptionResult:
        """Transcribes 16kHz mono audio array to structured transcription result."""
        ...
