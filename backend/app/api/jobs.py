from fastapi import APIRouter, UploadFile, File, HTTPException
from app.pipeline.pipeline import run_ingest
from app.pipeline.pipeline import run_transcribe
from app.pipeline.pipeline import run_segment
from app.pipeline.pipeline import run_score
from app.pipeline.pipeline import run_cut
from app.pipeline.pipeline import run_captions
from app.pipeline.pipeline import run_vertical
from app.pipeline.pipeline import run_all

from app.utils.status import read_status

from fastapi import BackgroundTasks

from fastapi.responses import FileResponse




import shutil
from pathlib import Path
import uuid

router = APIRouter(prefix="/jobs", tags=["jobs"])


BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data" / "jobs"


def generate_job_id():
    return uuid.uuid4().hex


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    print("upload called")

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")

    if not file.filename.lower().endswith((".mp4", ".mov", ".mkv", ".avi")):
        raise HTTPException(status_code=400, detail="Unsupported file")

    job_id = generate_job_id()
    job_dir = DATA_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    input_path = job_dir / "input.mp4"

    print("Saving to:", input_path)

    with input_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print("file saved")

    return {
        "job_id": job_id,
        "saved": str(input_path)
    }

@router.post("/{job_id}/ingest")
def ingest_job(job_id: str):
    result = run_ingest(job_id)
    return result

@router.post("/{job_id}/transcribe")
def transcribe_job(job_id: str):
    return run_transcribe(job_id)

@router.post("/{job_id}/segment")
def segment_job(job_id: str):
    return run_segment(job_id)

@router.post("/{job_id}/score")
def score_job(job_id: str):
    return run_score(job_id)

@router.post("/{job_id}/cut")
def cut_job(job_id: str):
    return run_cut(job_id)

@router.post("/{job_id}/captions")
def captions_job(job_id: str):
    return run_captions(job_id)

@router.post("/{job_id}/vertical")
def vertical_job(job_id: str):
    return run_vertical(job_id)

@router.post("/{job_id}/run_all")
def run_all_job(job_id: str):
    return run_all(job_id)

@router.get("/{job_id}/status")
def job_status(job_id: str):

    base = Path(__file__).resolve().parents[3]
    job_dir = base / "data" / "jobs" / job_id

    return read_status(job_dir)

@router.post("/{job_id}/run_all_async")
def run_all_async(job_id: str, bg: BackgroundTasks):

    bg.add_task(run_all, job_id)

    return {
        "job_id": job_id,
        "state": "started",
        "mode": "background"
    }

@router.get("/{job_id}/clips")
def list_clips(job_id: str):

    base = Path(__file__).resolve().parents[3]
    clips_dir = base / "data" / "jobs" / job_id / "clips_vertical_final"

    if not clips_dir.exists():
        return {"clips": []}

    files = sorted(clips_dir.glob("*.mp4"))

    return {
        "clips": [f.name for f in files]
    }

@router.get("/{job_id}/clips/{filename}")
def get_clip(job_id: str, filename: str):

    base = Path(__file__).resolve().parents[3]
    path = base / "data" / "jobs" / job_id / "clips_vertical_final" / filename

    return FileResponse(path)