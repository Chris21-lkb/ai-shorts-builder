import subprocess

def run_ffmpeg(cmd: list[str]):
    print("Running ffmep", " ".join(cmd))

    result = subprocess.run(
        cmd,
        stdout = subprocess.PIPE,
        stderr = subprocess.STDOUT,
        text = True
    )

    print (result.stdout)

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed:\n{result.stdout}")