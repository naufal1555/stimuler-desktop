from ports.translate_port import ITranslator

class TranslateTextUseCase:
    """
    Text translation use case.
    """

    def __init__(self, translator: ITranslator):
        self.translator = translator

    async def execute(self, text: str, target_lang: str = "id") -> str:
        return await self.translator.translate(text, target_lang)
