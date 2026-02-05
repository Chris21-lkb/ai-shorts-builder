from pathlib import Path
from app.utils.ffmpeg import run_ffmpeg

def extract_audio(job_dir: Path):
    input_video = job_dir / "input.mp4"
    audio_path = job_dir / "audio.wav"

    if not input_video.exists():
        raise FileNotFoundError('input.mp4 not found')
    
    cmd = [
        "ffmpeg",
        "-y",
        "-i", str(input_video),
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        str(audio_path)
    ]

    run_ffmpeg(cmd)

    return audio_path