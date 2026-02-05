from pathlib import Path
from app.utils.ffmpeg import run_ffmpeg


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


def convert_vertical(job_dir: Path):

    in_dir = job_dir / "clips_captioned"
    out_dir = job_dir / "clips_vertical"
    out_dir.mkdir(exist_ok=True)

    outputs = []

    for clip_path in sorted(in_dir.glob("*.mp4")):

        out_path = out_dir / clip_path.name.replace("_cap", "_vert")

        vf = (
            "scale=1080:1920:force_original_aspect_ratio=increase,"
            "boxblur=20:10,"
            "crop=1080:1920,"
            "overlay=(W-w)/2:(H-h)/2"
        )

        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(clip_path),

            # background blur + centered foreground
            "-filter_complex",
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,"
            "boxblur=20:10,crop=1080:1920[bg];"
            "[0:v]scale=1080:-2[fg];"
            "[bg][fg]overlay=(W-w)/2:(H-h)/2",

            "-c:v", "libx264",
            "-c:a", "aac",
            str(out_path)
        ]

        run_ffmpeg(cmd)
        outputs.append(str(out_path))

    return outputs