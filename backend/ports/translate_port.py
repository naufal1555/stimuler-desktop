from typing import Protocol

class ITranslator(Protocol):
    async def translate(self, text: str, target_lang: str = "id") -> str:
        """Translates text into target language."""
        ...
