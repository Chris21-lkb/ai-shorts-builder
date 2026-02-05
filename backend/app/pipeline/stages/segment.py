import json
from pathlib import Path


MIN_LEN = 20      # seconds
TARGET_LEN = 45
MAX_LEN = 60
PAUSE_GAP = 1.5   # seconds


def build_segments(job_dir: Path):

    transcript_path = job_dir / "transcript.json"
    out_path = job_dir / "candidates.json"

    if not transcript_path.exists():
        raise FileNotFoundError("transcript.json not found")

    data = json.loads(transcript_path.read_text(encoding="utf-8"))

    candidates = []

    cur_start = None
    cur_end = None
    texts = []

    for seg in data:

        s = seg["start"]
        e = seg["end"]
        t = seg["text"]

        if cur_start is None:
            cur_start = s
            cur_end = e
            texts = [t]
            continue

        gap = s - cur_end
        new_len = e - cur_start

        should_split = (
            gap >= PAUSE_GAP or
            new_len >= MAX_LEN or
            (new_len >= TARGET_LEN and gap > 0.5)
        )

        if should_split:
            duration = cur_end - cur_start

            if duration >= MIN_LEN:
                candidates.append({
                    "start": cur_start,
                    "end": cur_end,
                    "duration": duration,
                    "text": " ".join(texts)
                })

            cur_start = s
            texts = [t]
        else:
            texts.append(t)

        cur_end = e

    # flush last
    if cur_start is not None:
        duration = cur_end - cur_start
        if duration >= MIN_LEN:
            candidates.append({
                "start": cur_start,
                "end": cur_end,
                "duration": duration,
                "text": " ".join(texts)
            })

    out_path.write_text(json.dumps(candidates, indent=2), encoding="utf-8")

    return out_path