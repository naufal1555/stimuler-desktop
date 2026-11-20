import json
import logging
from typing import List, Dict, Any, Optional
from domain.entities import TurnAnalysis
from domain.value_objects import GrammarCorrection, VocabularySuggestion
from ports.llm_port import ILLMCoach

logger = logging.getLogger("stimuler.gemini_adapter")

class GeminiCoachAdapter(ILLMCoach):
    """
    Adapter integrating Google Gemini API via the official google-genai SDK.
    Enforces strict grounding, zero brand/app hallucinations, and graceful
    fallback to the offline conversational coach if the API is offline or unconfigured.
    """

    def __init__(self, fallback_coach: Optional[ILLMCoach] = None):
        self.fallback_coach = fallback_coach
        self.models_to_try = [
            "gemini-flash-lite-latest",
            "gemini-3.8-flash",
            "gemini-flash-latest",
            "gemma-4-31b-it"
        ]

    async def evaluate_turn(
        self,
        user_speech: str,
        topic_title: str,
        conversation_history: List[Dict[str, Any]],
        api_key: Optional[str] = None
    ) -> TurnAnalysis:
        speech = user_speech.strip()

        if api_key:
            try:
                # Format recent conversation history chronologically
                history_lines = []
                for m in conversation_history[-8:]:
                    sender = "Sarah" if m.get("from") == "bot" else "User"
                    txt = m.get("content", {}).get("text", "")
                    if txt:
                        history_lines.append(f"{sender}: {txt}")
                dialogue_context = "\n".join(history_lines) if history_lines else "No previous messages."

                system_instruction = (
                    "You are Sarah, an encouraging, highly intelligent English speaking tutor on Stimuler.\n"
                    "Your objective:\n"
                    "1. Read the dialogue history and the latest user speech carefully.\n"
                    "2. STRICT GROUNDING & ZERO HALLUCINATION:\n"
                    "   - Base your response EXCLUSIVELY on what the user said and what was discussed in the dialogue history.\n"
                    "   - NEVER assume, hallucinate, or insert unmentioned apps, tools, brands, or facts (e.g. if the user says 'Claude', talk about Claude AI; NEVER say 'Duolingo' or any other unmentioned app!).\n"
                    "   - If the user refers to AI tools (ChatGPT, Claude, Gemini, Stimuler) or cultural works (Godfather, movies), recognize the context accurately.\n"
                    "3. Directly answer or acknowledge what the user said with warmth and conversational naturalness.\n"
                    "4. Ask ONE engaging follow-up question that logically advances the conversation.\n"
                    "5. Provide constructive grammar corrections and vocabulary upgrades based on the user's actual speech.\n"
                    "Return ONLY a valid JSON object matching this schema:\n"
                    "{\n"
                    '  "reply_text": "Your natural 2-3 sentence response to the user",\n'
                    '  "hint_text": "A natural sentence the user could say next",\n'
                    '  "overall_score": 85,\n'
                    '  "ielts_band": 6.5,\n'
                    '  "grammar_corrections": [\n'
                    '    {"original": "exact error", "corrected": "corrected phrase", "reason": "concise explanation"}\n'
                    '  ],\n'
                    '  "vocabulary_suggestions": [\n'
                    '    {"wrong_word": "basic word", "right_word": "higher CEFR alternative"}\n'
                    '  ],\n'
                    '  "improved_speech": "Natural native phrasing of the user speech",\n'
                    '  "mispronounced_words": ["word1"]\n'
                    "}"
                )

                prompt_user = (
                    f"{system_instruction}\n\n"
                    f"Topic: {topic_title}\n"
                    f"Recent Conversation History:\n{dialogue_context}\n\n"
                    f"Latest User Speech: \"{speech}\"\n"
                    "Respond contextually as Sarah in JSON."
                )

                from google import genai
                from google.genai import types

                client = genai.Client(api_key=api_key)
                eval_data = None

                for model_name in self.models_to_try:
                    try:
                        resp = client.models.generate_content(
                            model=model_name,
                            contents=prompt_user,
                            config=types.GenerateContentConfig(
                                response_mime_type="application/json",
                                temperature=0.35
                            )
                        )
                        if resp and resp.text:
                            eval_data = json.loads(resp.text)
                            break
                    except Exception as me:
                        logger.warning("Model %s generation failed: %s", model_name, me)

                if eval_data and "reply_text" in eval_data:
                    corrections = [
                        GrammarCorrection(
                            original=c.get("original", ""),
                            corrected=c.get("corrected", ""),
                            reason=c.get("reason", "")
                        )
                        for c in eval_data.get("grammar_corrections", [])
                    ]
                    suggestions = [
                        VocabularySuggestion(
                            wrong_word=v.get("wrong_word", ""),
                            right_word=v.get("right_word", "")
                        )
                        for v in eval_data.get("vocabulary_suggestions", [])
                    ]
                    return TurnAnalysis(
                        reply_text=eval_data.get("reply_text", "That is an interesting thought!"),
                        hint_text=eval_data.get("hint_text", "Could you elaborate more?"),
                        overall_score=int(eval_data.get("overall_score", 80)),
                        ielts_band=float(eval_data.get("ielts_band", 6.5)),
                        grammar_corrections=corrections,
                        vocabulary_suggestions=suggestions,
                        improved_speech=eval_data.get("improved_speech", f"Personally, {speech}"),
                        mispronounced_words=eval_data.get("mispronounced_words", [])
                    )
            except Exception as e:
                logger.error("Gemini API invocation error: %s", e)

        # Fallback to offline coach
        if self.fallback_coach:
            return await self.fallback_coach.evaluate_turn(
                user_speech=user_speech,
                topic_title=topic_title,
                conversation_history=conversation_history,
                api_key=api_key
            )

        raise RuntimeError("LLM evaluation failed and no fallback coach configured.")
