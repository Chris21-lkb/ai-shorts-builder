from fastapi import APIRouter, UploadFile, File, HTTPException
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