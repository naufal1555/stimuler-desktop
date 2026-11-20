import logging
from pathlib import Path
from domain.value_objects import TranscriptionResult
from ports.stt_port import ISTTEngine
from adapters.audio_decoder import AudioDecoder

logger = logging.getLogger("stimuler.use_case.transcribe")

class TranscribeSpeechUseCase:
    """
    Orchestrates audio decoding, silence gating, and speech-to-text transcription.
    """

    def __init__(self, stt_engine: ISTTEngine):
        self.stt_engine = stt_engine

    def execute(self, audio_file_path: Path) -> TranscriptionResult:
        audio_array, diag = AudioDecoder.decode_to_numpy(audio_file_path)

        if diag.is_silent or not diag.is_valid_speech:
            logger.info("Audio skipped due to silence/noise gate (duration=%.2fs, peak=%.3f, rms=%.4f)",
                        diag.duration_seconds, diag.peak_amplitude, diag.rms_volume)
            return TranscriptionResult(
                text="(Audio too quiet. Please speak closer to microphone)",
                duration=diag.duration_seconds,
                wpm=0,
                words=[],
                status="warning",
                warning_message="Audio quiet or no distinct speech detected."
            )

        transcription = self.stt_engine.transcribe(audio_array, duration=diag.duration_seconds)
        return transcription
