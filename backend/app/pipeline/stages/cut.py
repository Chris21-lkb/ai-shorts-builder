import json
from pathlib import Path
from app.utils.ffmpeg import run_ffmpeg


TOP_N = 5


def cut_top_clips(job_dir: Path):

    ranked_path = job_dir / "ranked.json"
    input_video = job_dir / "input.mp4"
    clips_dir = job_dir / "clips_raw"

    if not ranked_path.exists():
        raise FileNotFoundError("ranked.json not found")

    if not input_video.exists():
        raise FileNotFoundError("input.mp4 not found")

    clips_dir.mkdir(exist_ok=True)

    ranked = json.loads(ranked_path.read_text(encoding="utf-8"))
    selected = ranked[:TOP_N]

    outputs = []

    for i, c in enumerate(selected, start=1):

        start = c["start"]
        end = c["end"]

        out_path = clips_dir / f"clip_{i:02d}.mp4"

        cmd = [
            "ffmpeg",
            "-y",
            "-ss", str(start),
            "-to", str(end),
            "-i", str(input_video),
            "-c:v", "libx264",
            "-c:a", "aac",
            str(out_path)
        ]

        run_ffmpeg(cmd)

        outputs.append(str(out_path))

    return outputs