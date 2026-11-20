import os
import logging
from typing import List, Dict, Any, Optional
from domain.entities import TurnAnalysis
from ports.llm_port import ILLMCoach
from ports.tts_port import ITTSEngine
from ports.repository_port import IUserRepository

logger = logging.getLogger("stimuler.use_case.evaluate")

class EvaluateConversationUseCase:
    """
    Coordinates LLM evaluation (Gemini / Offline) and Sarah's voice synthesis.
    """

    def __init__(self, llm_coach: ILLMCoach, tts_engine: ITTSEngine, user_repo: IUserRepository):
        self.llm_coach = llm_coach
        self.tts_engine = tts_engine
        self.user_repo = user_repo

    async def execute(
        self,
        user_speech: str,
        topic_title: str,
        conversation_history: List[Dict[str, Any]],
        api_key: Optional[str] = None,
        base_url: str = "http://localhost:8765"
    ) -> TurnAnalysis:
        effective_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not effective_key:
            user = self.user_repo.get_user("default_user")
            if user and user.gemini_api_key:
                effective_key = user.gemini_api_key

        # 1. Evaluate speech and generate Sarah response
        analysis = await self.llm_coach.evaluate_turn(
            user_speech=user_speech,
            topic_title=topic_title,
            conversation_history=conversation_history,
            api_key=effective_key
        )

        # 2. Synthesize Sarah voice audio
        if analysis.reply_text:
            try:
                tts_filename = await self.tts_engine.synthesize(analysis.reply_text)
                analysis.audio_url = f"{base_url}/audio_cache/{tts_filename}"
            except Exception as e:
                logger.error("TTS synthesis error during turn evaluation: %s", e)
                analysis.audio_url = None

        return analysis
