from pathlib import Path
from app.utils.ffmpeg import run_ffmpeg
import json



from app.pipeline.stages.captions import build_srt




# def convert_vertical(job_dir: Path):

#     in_dir = job_dir / "clips_captioned"
#     out_dir = job_dir / "clips_vertical"
#     out_dir.mkdir(exist_ok=True)

#     outputs = []

#     for clip_path in sorted(in_dir.glob("*.mp4")):

#         out_path = out_dir / clip_path.name.replace("_cap", "_vert")

#         cmd = [
#             "ffmpeg",
#             "-y",
#             "-i", str(clip_path),

#             # scale to height 1920, keep aspect
#             "-vf",
#             "scale=-2:1920,crop=1080:1920",

#             "-c:v", "libx264",
#             "-c:a", "aac",
#             str(out_path)
#         ]

#         run_ffmpeg(cmd)
#         outputs.append(str(out_path))

#     return outputs


# def convert_vertical(job_dir: Path):

#     in_dir = job_dir / "clips_captioned"
#     out_dir = job_dir / "clips_vertical"
#     out_dir.mkdir(exist_ok=True)

#     outputs = []

#     for clip_path in sorted(in_dir.glob("*.mp4")):

#         out_path = out_dir / clip_path.name.replace("_cap", "_vert")

#         vf = (
#             "scale=1080:1920:force_original_aspect_ratio=increase,"
#             "boxblur=20:10,"
#             "crop=1080:1920,"
#             "overlay=(W-w)/2:(H-h)/2"
#         )

#         cmd = [
#             "ffmpeg",
#             "-y",
#             "-i", str(clip_path),

#             # background blur + centered foreground
#             "-filter_complex",
#             "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,"
#             "boxblur=20:10,crop=1080:1920[bg];"
#             "[0:v]scale=1080:-2[fg];"
#             "[bg][fg]overlay=(W-w)/2:(H-h)/2",

#             "-c:v", "libx264",
#             "-c:a", "aac",
#             str(out_path)
#         ]

#         run_ffmpeg(cmd)
#         outputs.append(str(out_path))

#     return outputs

#################################################
# def convert_vertical(job_dir: Path):
#     # Use RAW clips as input, not the captioned ones!
#     in_dir = job_dir / "clips_raw" 
#     out_dir = job_dir / "clips_vertical_full"
#     out_dir.mkdir(exist_ok=True)

#     outputs = []

#     for clip_path in sorted(in_dir.glob("*.mp4")):
#         out_path = out_dir / clip_path.name

#         # This filter zooms in until the height is 1920 
#         # and then crops the width to 1080.
#         vf_filter = "scale=-1:1920,crop=1080:1920"

#         cmd = [
#             "ffmpeg", "-y",
#             "-i", str(clip_path),
#             "-vf", vf_filter,
#             "-c:v", "libx264",
#             "-crf", "18",
#             "-c:a", "aac",
#             str(out_path)
#         ]

#         run_ffmpeg(cmd)
#         outputs.append(str(out_path))

#     return outputs
    ########################################################################

def convert_vertical(job_dir: Path):
    clips_dir = job_dir / "clips_raw"
    out_dir = job_dir / "clips_vertical_final"
    out_dir.mkdir(exist_ok=True)

    transcript = json.loads((job_dir / "transcript.json").read_text(encoding="utf-8"))
    ranked = json.loads((job_dir / "ranked.json").read_text(encoding="utf-8"))

    outputs = []

    for i, c in enumerate(ranked[:5], start=1):
        start, end = c["start"], c["end"]
        in_path = clips_dir / f"clip_{i:02d}.mp4"
        srt_path = job_dir / f"clip_{i:02d}.srt"
        out_path = out_dir / f"clip_{i:02d}_short.mp4"

        # 1. Generate SRT
        build_srt(transcript, start, end, srt_path)

        # 2. Prepare path for Windows
        escaped_srt = str(srt_path).replace('\\', '/').replace(':', '\\:')

        # 3. Apply the "Small & Bottom" style
        vf_filter = (
            f"scale=-1:1920,crop=1080:1920,"
            f"subtitles='{escaped_srt}':force_style='Alignment=2,FontSize=12,MarginV=60,PrimaryColour=&H00FFFFFF,OutlineWeight=1'"
        )

        cmd = [
            "ffmpeg", "-y",
            "-i", str(in_path),
            "-vf", vf_filter,
            "-c:v", "libx264",
            "-crf", "18",
            "-preset", "fast",
            "-c:a", "aac",
            str(out_path)
        ]

        run_ffmpeg(cmd)
        outputs.append(str(out_path))

    return outputs