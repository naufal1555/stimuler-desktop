from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from .value_objects import GrammarCorrection, VocabularySuggestion, MispronouncedWord

@dataclass
class TurnAnalysis:
    reply_text: str
    hint_text: str
    overall_score: int
    ielts_band: float
    grammar_corrections: List[GrammarCorrection] = field(default_factory=list)
    vocabulary_suggestions: List[VocabularySuggestion] = field(default_factory=list)
    improved_speech: str = ""
    mispronounced_words: List[str] = field(default_factory=list)
    audio_url: Optional[str] = None

@dataclass
class UserProfile:
    id: str = "default_user"
    name: str = "Learner"
    streak_count: int = 1
    last_practice_date: Optional[str] = None
    gemini_api_key: Optional[str] = None
    engine_mode: str = "hybrid"

@dataclass
class SessionRecord:
    id: str
    topic_id: int
    topic_title: str
    overall_score: int
    ielts_band: float
    duration_seconds: int
    words_spoken: int
    created_at: Optional[str] = None

@dataclass
class MistakeRecord:
    id: Optional[int]
    type: str
    target_item: str
    detail: str
    mastered: bool = False
    created_at: Optional[str] = None
