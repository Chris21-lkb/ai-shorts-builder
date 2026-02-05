import json
from pathlib import Path
from app.utils.ffmpeg import run_ffmpeg



def format_ts(t: float):
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    ms = int((t - int(t)) * 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

### original one

# def build_srt(segments, start, end, out_path: Path):

#     idx = 1
#     lines = []

#     for seg in segments:
#         if seg["end"] < start or seg["start"] > end:
#             continue

#         s = max(seg["start"], start) - start
#         e = min(seg["end"], end) - start

#         lines.append(str(idx))
#         lines.append(f"{format_ts(s)} --> {format_ts(e)}")
#         lines.append(seg["text"])
#         lines.append("")
#         idx += 1

#     out_path.write_text("\n".join(lines), encoding="utf-8")




# --------------------------------------------------------------------------#
def build_srt(segments, start, end, out_path: Path, max_words=4):
    idx = 1
    lines = []

    for seg in segments:
        # 1. Skip segments entirely outside the clip range
        if seg["end"] < start or seg["start"] > end:
            continue

        # 2. Calculate the relative start and end times for this segment
        s_seg = max(seg["start"], start) - start
        e_seg = min(seg["end"], end) - start
        duration = e_seg - s_seg

        # 3. Split the segment text into individual words
        words = seg["text"].strip().split()
        
        if not words:
            continue

        # 4. Group words into chunks of 'max_words' (e.g., 4 words at a time)
        for i in range(0, len(words), max_words):
            chunk = words[i : i + max_words]
            chunk_text = " ".join(chunk)

            # 5. Estimate timing for this chunk
            # We divide the total segment duration by the number of chunks
            num_chunks = (len(words) + max_words - 1) // max_words
            chunk_duration = duration / num_chunks
            
            c_start = s_seg + (i // max_words) * chunk_duration
            c_end = c_start + chunk_duration

            # 6. Add to SRT lines
            lines.append(str(idx))
            lines.append(f"{format_ts(c_start)} --> {format_ts(c_end)}")
            lines.append(chunk_text.upper()) # Uppercase is usually better for Shorts
            lines.append("")
            idx += 1

    # 7. Write the file
    out_path.write_text("\n".join(lines), encoding="utf-8")
# ---------------------------------------------------------------------------------------------#





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