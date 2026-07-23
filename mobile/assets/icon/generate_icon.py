#!/usr/bin/env python3
"""
Boon Scanner App Icon Generator
================================
Generates a 1024×1024 source icon with biohazard + scanner theme,
then resizes it to all Android mipmap densities.

Usage:
    python generate_icon.py
    python generate_icon.py --size 1024   # custom source size

Output:
    - android/app/src/main/res/mipmap-*/ic_launcher.png
    - android/app/src/main/res/mipmap-*/ic_launcher_round.png
"""

import os
import sys
import math

from PIL import Image, ImageDraw

# ── Colour palette ─────────────────────────────────────────────────────────
BG_DARK      = (3, 7, 18)       # #030712 — app scaffold background
BG_GRADIENT  = (17, 24, 39)     # #111827 — surface
PRIMARY      = (5, 150, 105)    # #059669 — emerald green
PRIMARY_LIGHT= (52, 211, 153)   # #34D399 — light green
ACCENT       = (255, 255, 255)  # white
DIM          = (100, 116, 139)  # #64748B — muted grey

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
PROJ_DIR = os.path.normpath(os.path.join(SRC_DIR, "..", ".."))
OUT_DIR = os.path.join(PROJ_DIR, "android", "app", "src", "main", "res")

# Android mipmap densities and their sizes
DENSITIES = {
    "mipmap-mdpi":     48,
    "mipmap-hdpi":     72,
    "mipmap-xhdpi":    96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}


def draw_biohazard(draw, cx, cy, r, color):
    """Draw a simplified biohazard symbol centered at (cx, cy) with radius r."""
    # Three circles (the biohazard "leaves")
    for angle in [0, 120, 240]:
        rad = math.radians(angle - 90)
        lx = cx + r * 0.35 * math.cos(rad)
        ly = cy + r * 0.35 * math.sin(rad)
        draw.ellipse(
            [lx - r * 0.30, ly - r * 0.30, lx + r * 0.30, ly + r * 0.30],
            fill=color,
        )
    # Center circle
    draw.ellipse(
        [cx - r * 0.18, cy - r * 0.18, cx + r * 0.18, cy + r * 0.18],
        fill=BG_DARK,
    )
    draw.ellipse(
        [cx - r * 0.12, cy - r * 0.12, cx + r * 0.12, cy + r * 0.12],
        fill=color,
    )


def draw_scan_frame(draw, cx, cy, w, h, color):
    """Draw a QR/camera scan frame (four corner brackets)."""
    l = 0.30  # corner length fraction
    t = 4     # thickness
    # Top-left
    draw.line([cx - w * l, cy - h * l + t, cx - w * l, cy - h * l], fill=color, width=t)
    draw.line([cx - w * l, cy - h * l, cx - w * l + t, cy - h * l], fill=color, width=t)
    # Top-right
    draw.line([cx + w * l - t, cy - h * l, cx + w * l, cy - h * l], fill=color, width=t)
    draw.line([cx + w * l, cy - h * l, cx + w * l, cy - h * l + t], fill=color, width=t)
    # Bottom-left
    draw.line([cx - w * l, cy + h * l - t, cx - w * l, cy + h * l], fill=color, width=t)
    draw.line([cx - w * l, cy + h * l, cx - w * l + t, cy + h * l], fill=color, width=t)
    # Bottom-right
    draw.line([cx + w * l - t, cy + h * l, cx + w * l, cy + h * l], fill=color, width=t)
    draw.line([cx + w * l, cy + h * l - t, cx + w * l, cy + h * l], fill=color, width=t)


def create_icon(size):
    """Create a 1024×1024 app icon with biohazard + scanner overlay."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # ── 1. Rounded rectangle background ─────────────────────────────────
    pad = size * 0.05
    radius = size * 0.12
    bg_box = [pad, pad, size - pad, size - pad]
    draw.rounded_rectangle(bg_box, radius=radius, fill=BG_DARK)

    # Inner subtle gradient effect (lighter center)
    inner_pad = size * 0.02
    inner_box = [
        pad + inner_pad,
        pad + inner_pad,
        size - pad - inner_pad,
        size - pad - inner_pad,
    ]
    draw.rounded_rectangle(inner_box, radius=radius * 0.8, fill=BG_GRADIENT)

    # ── 2. Biohazard symbol ─────────────────────────────────────────────
    cx, cy = size // 2, int(size * 0.42)
    bio_r = int(size * 0.20)
    draw_biohazard(draw, cx, cy, bio_r, PRIMARY_LIGHT)

    # ── 3. Scan frame (corner brackets) ─────────────────────────────────
    frame_w = int(size * 0.55)
    frame_h = int(size * 0.55)
    draw_scan_frame(draw, cx, cy, frame_w, frame_h, PRIMARY)

    # ── 4. Scan line (horizontal line across the middle) ────────────────
    scan_y = cy
    scan_w = int(size * 0.35)
    draw.line(
        [cx - scan_w, scan_y, cx + scan_w, scan_y],
        fill=(*PRIMARY, 180),
        width=max(2, size // 128),
    )

    # ── 5. Small dots on scan line ends ─────────────────────────────────
    dot_r = max(2, size // 80)
    for dx in [-scan_w, scan_w]:
        draw.ellipse(
            [cx + dx - dot_r, scan_y - dot_r, cx + dx + dot_r, scan_y + dot_r],
            fill=PRIMARY_LIGHT,
        )

    return img


def save_mipmaps(img):
    """Resize the source icon to all mipmap densities and save."""
    for density, px in DENSITIES.items():
        resized = img.resize((px, px), Image.LANCZOS)
        out_dir = os.path.join(OUT_DIR, density)
        os.makedirs(out_dir, exist_ok=True)

        path = os.path.join(out_dir, "ic_launcher.png")
        resized.save(path, "PNG")
        print(f"  ✓ {density}  ({px}×{px})  →  ic_launcher.png")

        # Round icon (same image — adaptive icon will use it)
        round_path = os.path.join(out_dir, "ic_launcher_round.png")
        resized.save(round_path, "PNG")
        print(f"  ✓ {density}  ({px}×{px})  →  ic_launcher_round.png")


def main():
    size = 1024
    if len(sys.argv) > 2 and sys.argv[1] == "--size":
        size = int(sys.argv[2])

    sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1)

    print("--- Boon Scanner Icon Generator ---")
    print("Source size: %dx%d" % (size, size))
    print()

    img = create_icon(size)

    # Save source
    src_path = os.path.join(SRC_DIR, "ic_launcher_source.png")
    img.save(src_path, "PNG")
    print("Source icon saved: %s" % src_path)
    print()

    # Generate mipmaps
    print("Generating mipmap PNGs...")
    save_mipmaps(img)

    print()
    print("Done! All icons generated.")


if __name__ == "__main__":
    main()
