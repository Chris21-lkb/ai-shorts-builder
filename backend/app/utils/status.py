import json
from pathlib import Path
from datetime import datetime


def status_path(job_dir: Path) -> Path:
    return job_dir / "status.json"


def write_status(job_dir: Path, stage: str, state: str, progress: int, total: int):
    data = {
        "stage": stage,
        "state": state,
        "progress": progress,
        "total": total,
        "updated_at": datetime.utcnow().isoformat()
    }

    status_path(job_dir).write_text(
        json.dumps(data, indent=2),
        encoding="utf-8"
    )


def read_status(job_dir: Path):
    p = status_path(job_dir)
    if not p.exists():
        return {"state": "unknown"}

    return json.loads(p.read_text(encoding="utf-8"))