import pytest
from domain.value_objects import (
    GrammarCorrection,
    VocabularySuggestion,
    MispronouncedWord,
    AudioDiagnostics,
    WordTiming,
    TranscriptionResult
)
from domain.entities import (
    TurnAnalysis,
    UserProfile,
    SessionRecord,
    MistakeRecord
)

def test_grammar_correction_immutability():
    gc = GrammarCorrection(original="I am agree", corrected="I agree", reason="Agree is a verb.")
    assert gc.original == "I am agree"
    assert gc.corrected == "I agree"
    assert gc.reason == "Agree is a verb."
    with pytest.raises(Exception):
        gc.original = "Something else"

def test_vocabulary_suggestion():
    vs = VocabularySuggestion(wrong_word="good", right_word="exceptional")
    assert vs.wrong_word == "good"
    assert vs.right_word == "exceptional"

def test_audio_diagnostics():
    diag = AudioDiagnostics(
        duration_seconds=3.5,
        rms_volume=0.045,
        peak_amplitude=0.82,
        is_silent=False,
        is_valid_speech=True
    )
    assert diag.duration_seconds == 3.5
    assert not diag.is_silent
    assert diag.is_valid_speech

def test_transcription_result():
    timing = WordTiming(word="hello", start=0.0, end=0.45, probability=0.98)
    res = TranscriptionResult(
        text="hello",
        duration=1.2,
        wpm=50,
        words=[timing],
        status="success"
    )
    assert res.text == "hello"
    assert len(res.words) == 1
    assert res.words[0].probability == 0.98

def test_turn_analysis_entity():
    analysis = TurnAnalysis(
        reply_text="That sounds interesting!",
        hint_text="Tell me more about your journey.",
        overall_score=85,
        ielts_band=6.5,
        improved_speech="Personally, that sounds interesting."
    )
    assert analysis.reply_text == "That sounds interesting!"
    assert analysis.overall_score == 85
    assert analysis.ielts_band == 6.5
    assert analysis.grammar_corrections == []

def test_user_profile_defaults():
    user = UserProfile()
    assert user.id == "default_user"
    assert user.name == "Learner"
    assert user.streak_count == 1
    assert user.engine_mode == "hybrid"
