from pathlib import Path

def get_uploads_dir() -> Path:
    # This assumes the app is run from the project root
    return Path("uploads")
