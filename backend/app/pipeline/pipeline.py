from pathlib import Path
from app.pipeline.stages.ingest import extract_audio
from app.pipeline.stages.transcribe import run_transcription
from app.pipeline.stages.segment import build_segments
from app.pipeline.stages.score import run_scoring
from app.pipeline.stages.cut import cut_top_clips
from app.pipeline.stages.captions import burn_captions
from app.pipeline.stages.vertical import convert_vertical
from app.utils.status import write_status





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

def run_segment(job_id: str):
    base = Path(__file__).resolve().parents[3]
    job_dir = base / "data" / "jobs" / job_id

    out = build_segments(job_dir)

    return {
        "job_id": job_id,
        "candidates": str(out)
    }

def run_score(job_id: str):
    base = Path(__file__).resolve().parents[3]
    job_dir = base / "data" / "jobs" / job_id

    out = run_scoring(job_dir)

    return {
        "job_id": job_id,
        "ranked": str(out)
    }

def run_cut(job_id: str):
    base = Path(__file__).resolve().parents[3]
    job_dir = base / "data" / "jobs" / job_id

    clips = cut_top_clips(job_dir)

    return {
        "job_id": job_id,
        "clips": clips
    }

def run_captions(job_id: str):
    base = Path(__file__).resolve().parents[3]
    job_dir = base / "data" / "jobs" / job_id

    outputs = burn_captions(job_dir)

    return {
        "job_id": job_id,
        "captioned_clips": outputs
    }

def run_vertical(job_id: str):
    base = Path(__file__).resolve().parents[3]
    job_dir = base / "data" / "jobs" / job_id

    outputs = convert_vertical(job_dir)

    return {
        "job_id": job_id,
        "vertical_clips": outputs
    }

def run_all(job_id: str):

    base = Path(__file__).resolve().parents[3]
    job_dir = base / "data" / "jobs" / job_id

    stages = [
        ("ingest", run_ingest),
        ("transcribe", run_transcribe),
        ("segment", run_segment),
        ("score", run_score),
        ("cut", run_cut),
        ("vertical", run_vertical),
    ]

    total = len(stages)
    results = {}

    print("\n🚀 RUN ALL PIPELINE START\n")

    for i, (name, fn) in enumerate(stages, start=1):

        write_status(job_dir, name, "running", i-1, total)

        try:
            results[name] = fn(job_id)
            write_status(job_dir, name, "done", i, total)
            print(f"✅ {name} done")

        except Exception as e:
            write_status(job_dir, name, "failed", i-1, total)
            print(f"❌ {name} failed")
            raise

    write_status(job_dir, "complete", "done", total, total)

    print("\n🏁 RUN ALL PIPELINE COMPLETE\n")

    return {
        "job_id": job_id,
        "outputs": results
    }