"""
FormPilot icon generator.

Produces PNG icons at 16, 32, 48, and 128px for the Chrome extension.
Design: indigo-500 (#6366f1) rounded-square background + white lightning bolt.
Run once from the repo root: python generate_icons.py
"""

import math
import os
from PIL import Image, ImageDraw

OUT_DIR = os.path.join("extension", "public", "icons")
SIZES = [16, 32, 48, 128]

# Brand colours
BG_COLOR    = (99, 102, 241)   # indigo-500 #6366f1
ACCENT_LOW  = (139, 92, 246)   # violet-500 #8b5cf6 (gradient end)
WHITE       = (255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)


def rounded_rect_mask(size: int, radius_frac: float) -> Image.Image:
    """Return an RGBA image that is white inside a rounded square, transparent outside."""
    radius = int(size * radius_frac)
    mask = Image.new("RGBA", (size, size), TRANSPARENT)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=(255, 255, 255, 255))
    return mask


def draw_gradient_bg(size: int) -> Image.Image:
    """
    Draw a diagonal linear gradient from BG_COLOR (top-left) to ACCENT_LOW (bottom-right).
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pixels = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            r = int(BG_COLOR[0] + (ACCENT_LOW[0] - BG_COLOR[0]) * t)
            g = int(BG_COLOR[1] + (ACCENT_LOW[1] - BG_COLOR[1]) * t)
            b = int(BG_COLOR[2] + (ACCENT_LOW[2] - BG_COLOR[2]) * t)
            pixels[x, y] = (r, g, b, 255)
    return img


def lightning_bolt_points(size: int):
    """
    Compute polygon points for a lightning bolt centred in a `size` × `size` box.

    The bolt occupies roughly 55% of the canvas width and 70% of the height,
    centred with slight left bias (the classic ⚡ shape).
    """
    pad  = size * 0.18   # outer padding
    w    = size - 2 * pad
    h    = size - 2 * pad
    cx   = size / 2
    cy   = size / 2

    # Normalised bolt polygon (0..1 unit square)
    # Classic lightning bolt: top-right tip → mid-left → centre knuckle → bottom-left tip
    raw = [
        (0.62, 0.0),   # top-right tip
        (0.30, 0.52),  # top of the crossbar (mid-left)
        (0.52, 0.52),  # inner knuckle top
        (0.38, 1.0),   # bottom-left tip
        (0.70, 0.48),  # bottom of the crossbar (mid-right)
        (0.48, 0.48),  # inner knuckle bottom
    ]

    # Scale + centre
    pts = []
    for (nx, ny) in raw:
        x = pad + nx * w
        y = pad + ny * h
        pts.append((x, y))
    return pts


def make_icon(size: int) -> Image.Image:
    scale = 4  # super-sample factor for anti-aliasing
    big   = size * scale

    # ── Background ──────────────────────────────────────────────────────────
    bg = draw_gradient_bg(big)

    # Apply rounded-square mask
    radius_frac = 0.22 if size >= 48 else 0.20
    mask = rounded_rect_mask(big, radius_frac)
    bg.putalpha(mask.split()[3])

    # ── Lightning bolt ────────────────────────────────────────────────────────
    bolt = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bolt)

    pts = lightning_bolt_points(big)

    # White bolt with slight drop-shadow for depth
    shadow_offset = max(1, big // 64)
    shadow_pts = [(x + shadow_offset, y + shadow_offset) for (x, y) in pts]
    draw.polygon(shadow_pts, fill=(0, 0, 0, 60))
    draw.polygon(pts, fill=(255, 255, 255, 245))

    # Composite bolt over background
    composite = Image.alpha_composite(bg, bolt)

    # ── Downscale with LANCZOS for crisp anti-aliasing ───────────────────────
    return composite.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for size in SIZES:
        icon = make_icon(size)
        path = os.path.join(OUT_DIR, f"icon{size}.png")
        icon.save(path, "PNG", optimize=True)
        print(f"  OK  {path}  ({size}x{size}px)")
    print("\nAll icons generated successfully.")


if __name__ == "__main__":
    main()
