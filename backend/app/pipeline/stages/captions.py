import json
from pathlib import Path
from app.utils.ffmpeg import run_ffmpeg



def format_ts(t: float):
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    ms = int((t - int(t)) * 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def build_srt(segments, start, end, out_path: Path):

    idx = 1
    lines = []

    for seg in segments:
        if seg["end"] < start or seg["start"] > end:
            continue

        s = max(seg["start"], start) - start
        e = min(seg["end"], end) - start

        lines.append(str(idx))
        lines.append(f"{format_ts(s)} --> {format_ts(e)}")
        lines.append(seg["text"])
        lines.append("")
        idx += 1

    out_path.write_text("\n".join(lines), encoding="utf-8")


# def burn_captions(job_dir: Path):

#     transcript = json.loads(
#         (job_dir / "transcript.json").read_text(encoding="utf-8")
#     )

#     ranked = json.loads(
#         (job_dir / "ranked.json").read_text(encoding="utf-8")
#     )

#     clips_dir = job_dir / "clips_raw"
#     out_dir = job_dir / "clips_captioned"
#     out_dir.mkdir(exist_ok=True)

#     outputs = []

#     for i, c in enumerate(ranked[:5], start=1):

#         start = c["start"]
#         end = c["end"]

#         clip_path = clips_dir / f"clip_{i:02d}.mp4"
#         srt_path = job_dir / f"clip_{i:02d}.srt"
#         out_path = out_dir / f"clip_{i:02d}_cap.mp4"

#         build_srt(transcript, start, end, srt_path)

#         cmd = [
#             "ffmpeg",
#             "-y",
#             "-i", str(clip_path),
#             "-vf", f"subtitles={srt_path}",
#             str(out_path)
#         ]

#         run_ffmpeg(cmd)
#         outputs.append(str(out_path))

#     return outputs

def burn_captions(job_dir: Path):
    transcript = json.loads(
        (job_dir / "transcript.json").read_text(encoding="utf-8")
    )
    
    ranked = json.loads(
        (job_dir / "ranked.json").read_text(encoding="utf-8")
    )
    
    clips_dir = job_dir / "clips_raw"
    out_dir = job_dir / "clips_captioned"
    out_dir.mkdir(exist_ok=True)
    
    outputs = []
    
    for i, c in enumerate(ranked[:5], start=1):
        start = c["start"]
        end = c["end"]
        clip_path = clips_dir / f"clip_{i:02d}.mp4"
        srt_path = job_dir / f"clip_{i:02d}.srt"
        out_path = out_dir / f"clip_{i:02d}_cap.mp4"
        
        build_srt(transcript, start, end, srt_path)
        
        # Properly escape the SRT path for FFmpeg filter
        # Replace backslashes with forward slashes and escape colons
        escaped_srt_path = str(srt_path).replace('\\', '/').replace(':', '\\:')
        
        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(clip_path),
            "-vf", f"subtitles='{escaped_srt_path}'",  # Quote the path
            str(out_path)
        ]
        
        run_ffmpeg(cmd)
        outputs.append(str(out_path))
    
    return outputs