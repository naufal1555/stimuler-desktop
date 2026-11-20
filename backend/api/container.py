from pathlib import Path
from typing import Optional

from adapters.persistence.sqlite_repository import SQLiteRepository
from adapters.stt.whisper_adapter import WhisperAdapter
from adapters.llm.offline_coach_adapter import OfflineCoachAdapter
from adapters.llm.gemini_adapter import GeminiCoachAdapter
from adapters.tts.edge_tts_adapter import EdgeTTSAdapter
from adapters.translation.google_translate_adapter import GoogleTranslateAdapter

from use_cases.transcribe_speech import TranscribeSpeechUseCase
from use_cases.evaluate_conversation import EvaluateConversationUseCase
from use_cases.synthesize_voice import SynthesizeVoiceUseCase
from use_cases.translate_text import TranslateTextUseCase
from use_cases.catalog_queries import CatalogQueriesUseCase
from use_cases.settings_use_case import SettingsUseCase

class Container:
    """
    Dependency Injection Container for Stimuler Clean Architecture.
    Wires Ports, Adapters, and Use Cases together with zero circular dependencies.
    """

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = Path(base_dir) if base_dir else Path(__file__).resolve().parent.parent
        self.audio_cache_dir = self.base_dir / "audio_cache"
        self.audio_cache_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.base_dir / "stimuler.db"
        self.mock_data_dir = self.base_dir.parent / "extracted_assets" / "mock_data"

        # 1. Repositories
        self.repo = SQLiteRepository(self.db_path)

        # 2. External Service Adapters
        self.whisper_adapter = WhisperAdapter(model_size="small.en", compute_type="int8", cpu_threads=4)
        self.offline_coach = OfflineCoachAdapter()
        self.gemini_coach = GeminiCoachAdapter(fallback_coach=self.offline_coach)
        self.edge_tts = EdgeTTSAdapter(output_dir=self.audio_cache_dir)
        self.google_translate = GoogleTranslateAdapter()

        # 3. Use Cases
        self.transcribe_speech_uc = TranscribeSpeechUseCase(stt_engine=self.whisper_adapter)
        self.evaluate_conversation_uc = EvaluateConversationUseCase(
            llm_coach=self.gemini_coach,
            tts_engine=self.edge_tts,
            user_repo=self.repo
        )
        self.synthesize_voice_uc = SynthesizeVoiceUseCase(tts_engine=self.edge_tts)
        self.translate_text_uc = TranslateTextUseCase(translator=self.google_translate)
        self.catalog_queries_uc = CatalogQueriesUseCase(mock_data_dir=self.mock_data_dir)
        self.settings_uc = SettingsUseCase(user_repo=self.repo)

# Global container instance
container = Container()
