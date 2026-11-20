from dataclasses import dataclass, field
from typing import Optional, List

@dataclass(frozen=True)
class GrammarCorrection:
    original: str
    corrected: str
    reason: str

@dataclass(frozen=True)
class VocabularySuggestion:
    wrong_word: str
    right_word: str

@dataclass(frozen=True)
class MispronouncedWord:
    word: str
    score: int = 65

@dataclass(frozen=True)
class AudioDiagnostics:
    duration_seconds: float
    rms_volume: float
    peak_amplitude: float
    is_silent: bool
    is_valid_speech: bool

@dataclass(frozen=True)
class WordTiming:
    word: str
    start: float
    end: float
    probability: float

@dataclass(frozen=True)
class TranscriptionResult:
    text: str
    duration: float
    wpm: int
    words: List[WordTiming] = field(default_factory=list)
    status: str = "success"
    warning_message: Optional[str] = None
