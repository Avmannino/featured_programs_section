#!/usr/bin/env python3
"""
Builds the web-optimized background videos and logo images used by the
featured programs grid.

    python3 scripts/optimize_media.py

Needs ffmpeg/ffprobe on PATH and Pillow. The originals in public/videos and
public/images are never modified (other pages may link to them); outputs go to
public/videos/optimized and public/images/optimized.

Background videos
-----------------
Most cards used to blur and color-grade their video with a CSS filter on every
frame. That work is now baked into the files, which also lets the blurred
videos drop to 360p with no visible difference: the blur already removes the
fine detail a higher resolution would carry.

BLUR is the Gaussian standard deviation as a fraction of the video's height.
The old CSS blur was in CSS pixels on a card whose height changes by
breakpoint, so these fractions reproduce it on 1440px+ desktops (cards
~575-595px tall) and on phones (~305-370px tall):

    9px desktop / 5px mobile CSS blur       -> 0.0154
    15px desktop / 9px mobile (birthday)    -> 0.026

The CSS also applied saturate(0.88) contrast(0.96) to every video. For the
blurred videos that is baked in as COLOR_LUT; in YUV it is a luma contrast
around mid-grey plus chroma scaled by 0.96 * 0.88.
"""

import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
VIDEO_DIR = ROOT / "public" / "videos"
IMAGE_DIR = ROOT / "public" / "images"

BLURRED_HEIGHT = 360

VIDEOS = [
    # (file, blur as a fraction of height, or None to keep the picture as-is)
    ("learn-to-play-skate.mp4", 0.0154),
    ("open-hockey.mp4", 0.0154),
    ("birthday.mp4", 0.026),
    ("adult-hockey-classes.mp4", 0.0154),
    ("public-skate.mp4", 0.0154),
    # Shown sharp, so its picture is copied untouched. Remuxing only drops the
    # unused audio track and moves the index to the front of the file so
    # playback can start before the whole file has downloaded. Its
    # saturate/contrast filter stays in CSS.
    ("cosmic-skate.mp4", None),
]

COLOR_LUT = (
    "lutyuv="
    "y='(val-16)*0.96+16+219*0.02':"
    "u='(val-128)*0.8448+128':"
    "v='(val-128)*0.8448+128'"
)

# Logos are shown at most ~105 CSS px; 320px covers 3x screens.
LOGO_MAX_SIZE = 320

LOGOS = [
    "wings-logo.png",
    "wings-arena-logo-alt.png",
    "wings-arena-white-alt.png",
    "wings-arena-blue-alt.png",
]


def run(command):
    subprocess.run(command, check=True)


def probe_size(path):
    output = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height", "-of", "csv=p=0",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    width, height = (int(value) for value in output.strip().split(","))
    return width, height


def bake_blurred_video(source, target, blur):
    width, height = probe_size(source)
    sigma = blur * height

    # Mirror-pad before blurring so the frame edges blur into real picture
    # instead of black, then crop the padding back off.
    pad = math.ceil(sigma * 3)
    out_width = round(BLURRED_HEIGHT * width / height / 2) * 2

    filters = ",".join([
        COLOR_LUT,
        "format=yuv444p16le",
        f"pad=iw+{2 * pad}:ih+{2 * pad}:{pad}:{pad}",
        f"fillborders=left={pad}:right={pad}:top={pad}:bottom={pad}:mode=mirror",
        f"gblur=sigma={sigma:.3f}:steps=6",
        f"crop=iw-{2 * pad}:ih-{2 * pad}:{pad}:{pad}",
        f"scale={out_width}:{BLURRED_HEIGHT}:flags=lanczos",
        "format=yuv420p",
    ])

    run([
        "ffmpeg", "-y", "-v", "error", "-i", str(source),
        "-map", "0:v:0", "-vf", filters,
        "-c:v", "libx264", "-preset", "veryslow", "-crf", "16",
        "-x264-params", "aq-mode=3",
        "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709",
        "-color_trc", "bt709", "-color_range", "tv",
        "-vsync", "passthrough", "-an", "-movflags", "+faststart",
        str(target),
    ])


def remux_video(source, target):
    run([
        "ffmpeg", "-y", "-v", "error", "-i", str(source),
        "-map", "0:v:0", "-c", "copy", "-an", "-movflags", "+faststart",
        str(target),
    ])


def resize_logo(source, target):
    image = Image.open(source).convert("RGBA")
    scale = LOGO_MAX_SIZE / max(image.size)

    if scale < 1:
        size = tuple(round(side * scale) for side in image.size)
        # Resample with premultiplied alpha so transparent edges don't pick
        # up dark fringes.
        image = image.convert("RGBa").resize(size, Image.LANCZOS).convert("RGBA")

    image.save(target, "WEBP", lossless=True, quality=100, method=6)


def main():
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("ffmpeg and ffprobe must be on PATH")

    video_out = VIDEO_DIR / "optimized"
    image_out = IMAGE_DIR / "optimized"
    video_out.mkdir(exist_ok=True)
    image_out.mkdir(exist_ok=True)

    for name, blur in VIDEOS:
        source, target = VIDEO_DIR / name, video_out / name
        print(f"video  {name}")

        if blur is None:
            remux_video(source, target)
        else:
            bake_blurred_video(source, target, blur)

    for name in LOGOS:
        target = image_out / Path(name).with_suffix(".webp").name
        print(f"image  {name}")
        resize_logo(IMAGE_DIR / name, target)


if __name__ == "__main__":
    main()
