#!/usr/bin/env python3
"""Reproduce the 14 silent Task 1 MP4s and matching WebP posters."""

from __future__ import annotations

import argparse
import json
import subprocess
import tempfile
import zipfile
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARCHIVE = PROJECT_ROOT.parents[1] / "attached_assets" / "VIDEOS_1789733068766.zip"
MANIFEST = PROJECT_ROOT / "src" / "content" / "fridge-media.json"
OUTPUT_DIR = PROJECT_ROOT / "src" / "assets" / "kitchen" / "inspections" / "videos"


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("archive", nargs="?", type=Path, default=DEFAULT_ARCHIVE)
    args = parser.parse_args()
    mappings = json.loads(MANIFEST.read_text(encoding="utf-8"))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(args.archive) as uploaded, tempfile.TemporaryDirectory() as temp:
        temp_dir = Path(temp)
        for states in mappings.values():
            for media in states.values():
                source = temp_dir / media["video"]
                source.write_bytes(uploaded.read(media["source"]))
                video = OUTPUT_DIR / media["video"]
                webm = OUTPUT_DIR / media["webm"]
                poster = OUTPUT_DIR / media["poster"]
                run(
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(source), "-map", "0:v:0", "-c:v", "copy",
                    "-an", "-movflags", "+faststart", str(video),
                )
                run(
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(video), "-map", "0:v:0", "-c:v", "libvpx-vp9",
                    "-crf", "28", "-b:v", "0", "-row-mt", "1",
                    "-threads", "2", "-deadline", "good", "-cpu-used", "4",
                    "-an", str(webm),
                )
                run(
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-ss", "2.5", "-i", str(source), "-frames:v", "1",
                    "-c:v", "libwebp", "-quality", "88",
                    "-compression_level", "6", str(poster),
                )


if __name__ == "__main__":
    main()