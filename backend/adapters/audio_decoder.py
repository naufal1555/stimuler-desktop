import av
import numpy as np
from pathlib import Path
from typing import Tuple
from domain.value_objects import AudioDiagnostics

class AudioDecoder:
    """Decodes and normalizes arbitrary audio formats (WebM/Opus, WAV) using PyAV."""

    @staticmethod
    def decode_to_numpy(file_path: Path, sampling_rate: int = 16000) -> Tuple[np.ndarray, AudioDiagnostics]:
        try:
            container = av.open(str(file_path), mode="r")
            resampler = av.AudioResampler(format="s16", layout="mono", rate=sampling_rate)
            raw_frames = []
            for frame in container.decode(audio=0):
                for resampled_frame in resampler.resample(frame):
                    raw_frames.append(resampled_frame.to_ndarray())
            container.close()

            if not raw_frames:
                empty = np.zeros(sampling_rate, dtype=np.float32)
                return empty, AudioDiagnostics(0.0, 0.0, 0.0, is_silent=True, is_valid_speech=False)

            audio = np.concatenate(raw_frames, axis=1).flatten().astype(np.float32) / 32768.0

            duration = round(len(audio) / float(sampling_rate), 2)
            peak = float(np.max(np.abs(audio))) if len(audio) > 0 else 0.0
            rms = float(np.sqrt(np.mean(audio**2))) if len(audio) > 0 else 0.0

            # Gating against silence / mic background noise
            is_silent = duration < 0.4 or (rms < 0.008 and peak < 0.05)
            is_valid_speech = not is_silent

            # Peak normalization: boost audio to optimal Whisper dynamic range
            if peak > 0.01:
                audio = audio / peak * 0.95

            diag = AudioDiagnostics(
                duration_seconds=duration,
                rms_volume=rms,
                peak_amplitude=peak,
                is_silent=is_silent,
                is_valid_speech=is_valid_speech
            )
            return audio, diag
        except Exception as e:
            print(f"AudioDecoder error on {file_path}: {e}")
            empty = np.zeros(sampling_rate, dtype=np.float32)
            return empty, AudioDiagnostics(0.0, 0.0, 0.0, is_silent=True, is_valid_speech=False)
