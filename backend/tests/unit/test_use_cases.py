import pytest
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock

from domain.entities import TurnAnalysis, UserProfile
from domain.value_objects import TranscriptionResult, AudioDiagnostics, WordTiming
from use_cases.transcribe_speech import TranscribeSpeechUseCase
from use_cases.evaluate_conversation import EvaluateConversationUseCase
from use_cases.translate_text import TranslateTextUseCase
from use_cases.catalog_queries import CatalogQueriesUseCase
from use_cases.settings_use_case import SettingsUseCase

@pytest.mark.asyncio
async def test_evaluate_conversation_use_case():
    mock_llm = MagicMock()
    mock_llm.evaluate_turn = AsyncMock(return_value=TurnAnalysis(
        reply_text="Technology is evolving rapidly! What tools do you use?",
        hint_text="I mostly use AI assistance in my day to day coding.",
        overall_score=88,
        ielts_band=7.0
    ))
    mock_tts = MagicMock()
    mock_tts.synthesize = AsyncMock(return_value="sarah_test_123.mp3")
    mock_user_repo = MagicMock()
    mock_user_repo.get_user.return_value = UserProfile(gemini_api_key="test_key")

    use_case = EvaluateConversationUseCase(
        llm_coach=mock_llm,
        tts_engine=mock_tts,
        user_repo=mock_user_repo
    )

    result = await use_case.execute(
        user_speech="I work in software engineering.",
        topic_title="Technology & AI",
        conversation_history=[],
        base_url="http://localhost:8765"
    )

    assert result.reply_text == "Technology is evolving rapidly! What tools do you use?"
    assert result.overall_score == 88
    assert result.audio_url == "http://localhost:8765/audio_cache/sarah_test_123.mp3"
    mock_llm.evaluate_turn.assert_awaited_once()
    mock_tts.synthesize.assert_awaited_once_with(result.reply_text)

@pytest.mark.asyncio
async def test_translate_text_use_case():
    mock_translator = MagicMock()
    mock_translator.translate = AsyncMock(return_value="Halo dunia")

    use_case = TranslateTextUseCase(translator=mock_translator)
    translated = await use_case.execute("Hello world", "id")

    assert translated == "Halo dunia"
    mock_translator.translate.assert_awaited_once_with("Hello world", "id")

def test_settings_use_case():
    mock_user_repo = MagicMock()
    mock_user_repo.get_user.return_value = UserProfile(gemini_api_key="AQ.Ab8RN6L4gB")

    settings_uc = SettingsUseCase(user_repo=mock_user_repo)
    status = settings_uc.get_api_key_status("default_user")

    assert status["has_key"] is True
    assert "..." in status["masked_key"]

def test_catalog_queries_use_case_fallback_when_empty():
    temp_empty_dir = Path("non_existent_directory_12345")
    use_case = CatalogQueriesUseCase(mock_data_dir=temp_empty_dir)
    assert use_case.get_topics() is None
    assert use_case.get_courses() is None
    assert use_case.get_default_analysis() is None

def test_evaluate_pronunciation_exact_match():
    from use_cases.evaluate_pronunciation import EvaluatePronunciationUseCase
    use_case = EvaluatePronunciationUseCase()
    transcription = TranscriptionResult(
        text="contagious",
        duration=1.0,
        wpm=60,
        words=[WordTiming(word="contagious", start=0.0, end=0.8, probability=0.96)]
    )
    result = use_case.execute(
        target_word="contagious",
        transcription=transcription,
        syllables=["kuhn", "tay", "juhs"],
        stressed_index=1
    )
    assert result.is_correct is True
    assert result.score >= 90
    assert result.accuracy_level == "Excellent"
    assert len(result.syllable_scores) == 3

def test_evaluate_pronunciation_mismatch():
    from use_cases.evaluate_pronunciation import EvaluatePronunciationUseCase
    use_case = EvaluatePronunciationUseCase()
    transcription = TranscriptionResult(
        text="container",
        duration=1.0,
        wpm=60,
        words=[WordTiming(word="container", start=0.0, end=0.8, probability=0.85)]
    )
    result = use_case.execute(
        target_word="contagious",
        transcription=transcription,
        syllables=["kuhn", "tay", "juhs"],
        stressed_index=1
    )
    assert result.is_correct is False
    assert result.score < 70
    assert result.accuracy_level == "Needs Practice"
