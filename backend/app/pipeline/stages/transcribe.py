from faster_whisper import WhisperModel
from pathlib import Path
import json

# load once (global) — important for performance
model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)


def run_transcription(job_dir: Path):

    audio_path = job_dir / "audio.wav"
    out_path = job_dir / "transcript.json"

    if not audio_path.exists():
        raise FileNotFoundError("audio.wav not found — run ingest first")

    segments, info = model.transcribe(str(audio_path))

    results = []

    for seg in segments:
        results.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text.strip()
        })

    with out_path.open("w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    return out_path