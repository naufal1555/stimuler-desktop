import numpy as np
from typing import Optional
from domain.value_objects import TranscriptionResult, WordTiming
from ports.stt_port import ISTTEngine

class FasterWhisperSTTAdapter(ISTTEngine):
    """
    Faster-Whisper adapter using small.en (244M params) with int8 CPU quantization,
    greedy decoding, and domain-targeted hotwords biasing.
    """

    def __init__(self, model_size: str = "small.en", compute_type: str = "int8", cpu_threads: int = 4):
        self._model_size = model_size
        self._compute_type = compute_type
        self._cpu_threads = cpu_threads
        self._model = None
        self._default_hotwords = (
            "Godfather, Claude, ChatGPT, Stimuler, Duolingo, Netflix, IELTS, "
            "English, vocabulary, pronunciation, grammar, speaking"
        )

    @property
    def model(self):
        if self._model is None:
            self._load_model()
        return self._model

    def warm_up(self) -> None:
        """Pre-loads model into memory on server boot."""
        _ = self.model

    def _load_model(self):
        try:
            from faster_whisper import WhisperModel
            self._model = WhisperModel(
                self._model_size,
                device="cpu",
                compute_type=self._compute_type,
                cpu_threads=self._cpu_threads
            )
            print(f"FasterWhisperSTTAdapter loaded '{self._model_size}' with {self._compute_type}")
        except Exception as e:
            print(f"FasterWhisper failed to load '{self._model_size}', falling back to 'base.en': {e}")
            from faster_whisper import WhisperModel
            self._model = WhisperModel("base.en", device="cpu", compute_type="int8", cpu_threads=self._cpu_threads)

    def transcribe(self, audio_array: np.ndarray, duration: float) -> TranscriptionResult:
        model = self.model

        try:
            # Greedy decoding (beam_size=1) with anti-repetition and hotwords
            segments, info = model.transcribe(
                audio_array,
                beam_size=1,
                condition_on_previous_text=False,
                repetition_penalty=1.2,
                no_repeat_ngram_size=3,
                word_timestamps=True,
                hotwords=self._default_hotwords
            )

            words = []
            text_parts = []
            for seg in segments:
                clean_text = seg.text.strip()
                if clean_text:
                    text_parts.append(clean_text)
                if seg.words:
                    for w in seg.words:
                        words.append(WordTiming(
                            word=w.word.strip(),
                            start=w.start,
                            end=w.end,
                            probability=w.probability
                        ))

            full_text = " ".join(text_parts).strip()
            wpm = int(len(words) / (duration / 60.0)) if duration > 0 and len(words) > 0 else 120

            if full_text:
                return TranscriptionResult(
                    text=full_text,
                    duration=duration,
                    wpm=wpm,
                    words=words,
                    status="success"
                )
        except Exception as e:
            print(f"Whisper inference error in adapter: {e}")

        return TranscriptionResult(
            text="(Audio could not be transcribed clearly. Please speak closer to the microphone)",
            duration=duration,
            wpm=0,
            words=[],
            status="warning",
            warning_message="Whisper inference failed"
        )

# Alias for clean naming
WhisperAdapter = FasterWhisperSTTAdapter
