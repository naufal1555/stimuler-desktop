from typing import Protocol, List, Dict, Any, Optional
from domain.entities import TurnAnalysis

class ILLMCoach(Protocol):
    async def evaluate_turn(
        self,
        user_speech: str,
        topic_title: str,
        conversation_history: List[Dict[str, Any]],
        api_key: Optional[str] = None
    ) -> TurnAnalysis:
        """Evaluates speech turn and generates contextual tutor response."""
        ...
