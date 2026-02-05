import uuid
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data" / "jobs"


def generate_job_id() -> str:
    return uuid.uuid4().hex


def create_job_folder(job_id: str) -> Path:
    job_path = DATA_DIR / job_id
    job_path.mkdir(parents=True, exist_ok=True)
    return job_path