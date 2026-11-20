import logging
import httpx
from ports.translate_port import ITranslator

logger = logging.getLogger("stimuler.google_translate_adapter")

class GoogleTranslateAdapter(ITranslator):
    """
    Adapter implementing ITranslator using Google Translate RPC API.
    Translates text to target language (default 'id' / Indonesian).
    """

    async def translate(self, text: str, target_lang: str = "id") -> str:
        clean_text = text.strip()
        if not clean_text:
            return ""

        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": "auto",
            "tl": target_lang,
            "dt": "t",
            "q": clean_text
        }

        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(url, params=params, timeout=6.0)
                if res.status_code == 200:
                    data = res.json()
                    translated = "".join([sentence[0] for sentence in data[0] if sentence[0]])
                    return translated
                else:
                    logger.warning("Google translate returned status %s", res.status_code)
                    return clean_text
        except Exception as e:
            logger.error("Translation exception: %s", e)
            return clean_text
