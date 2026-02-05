from pathlib import Path
from app.pipeline.stages.ingest import extract_audio
from app.pipeline.stages.transcribe import run_transcription



def run_ingest(job_id: str):
    base = Path(__file__).resolve().parents[3]   # ← FIXED
    job_dir = base / "data" / "jobs" / job_id

    print("📁 Looking for job_dir:", job_dir)

    if not job_dir.exists():
        raise FileNotFoundError(f"Job folder not found: {job_dir}")

    audio_path = extract_audio(job_dir)

    return {
        "job_id": job_id,
        "audio": str(audio_path)
    }

def run_transcribe(job_id: str):
    base = Path(__file__).resolve().parents[3]
    job_dir = base / "data" / "jobs" / job_id

    transcript_path = run_transcription(job_dir)

    return {
        "job_id": job_id,
        "transcript": str(transcript_path)
    }