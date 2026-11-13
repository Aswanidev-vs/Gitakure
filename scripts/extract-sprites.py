#!/usr/bin/env python3
"""
Extract individual sprites from the AI-generated reference posters using
connected-component analysis with morphological merging.

Each poster is a composite scene on a dark background. We:
1. Build a foreground mask (bright pixels).
2. Dilate slightly to merge sprite parts.
3. Label connected components.
4. Crop each component's bounding box from the original.
5. Make the dark background transparent.
6. Save as an individual PNG.
"""

import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = "assests"
OUT = "public/assets/sprites"

# (filename, output_prefix, brightness_threshold, merge_dilation)
POSTERS = [
    ("Gitakure RPG Terrain Tileset Atlas.png",      "terrain",   45, 3),
    ("Gitakure Buildings & Interiors Tileset Atlas.png", "building", 45, 4),
    ("Gitakure Trees and Vegetation Tileset.png",   "tree",      40, 4),
    ("Gitakure Water & Environmental Tileset.png",  "water",     45, 3),
    ("Gitakure Wildlife Sprite Atlas.png",          "animal",    50, 3),
    ("Gitakure Pixel Character Sheets.png",         "char",      45, 4),
    ("Gitakure NPC Sprite Sheets.png",              "npc",       45, 4),
    ("Gitakure Farming Pixel Art Tileset.png",      "crop",      45, 3),
    ("Pixel Art Environmental Effects Sprite Sheet.png", "fx",    50, 3),
    ("Gitakure Pixel RPG UI Asset Sheet.png",       "ui",        45, 3),
    ("Gitakure Pixel Art Asset Atlas.png",          "prop",      45, 3),
]

MIN_AREA = 300   # pixels
MAX_AREA = 200000  # skip huge background blobs
PADDING = 2

os.makedirs(OUT, exist_ok=True)

total_extracted = 0
manifest = []

for fname, prefix, threshold, dilate in POSTERS:
    path = os.path.join(SRC, fname)
    if not os.path.exists(path):
        print(f"SKIP {fname} (not found)")
        continue

    img = Image.open(path).convert("RGB")
    arr = np.array(img)
    gray = arr.mean(axis=2)

    # Foreground mask: pixels brighter than threshold
    fg = gray > threshold

    # Dilate to merge sprite parts that are close together
    struct = np.ones((dilate * 2 + 1, dilate * 2 + 1))
    fg_dilated = ndimage.binary_dilation(fg, structure=struct, iterations=1)

    # Label connected components
    labels, num_features = ndimage.label(fg_dilated)

    if num_features == 0:
        print(f"  {fname}: no components found")
        continue

    # Get bounding boxes for each label
    slices = ndimage.find_objects(labels)

    count = 0
    for i, sl in enumerate(slices):
        if sl is None:
            continue
        y0, y1 = sl[0].start, sl[0].stop
        x0, x1 = sl[1].start, sl[1].stop
        h = y1 - y0
        w = x1 - x0
        area = w * h

        if area < MIN_AREA or area > MAX_AREA:
            continue

        # Skip if the component touches the image border (likely background)
        # (only skip if it's very large)
        if w > img.width * 0.8 or h > img.height * 0.8:
            continue

        # Crop with padding
        px0 = max(0, x0 - PADDING)
        py0 = max(0, y0 - PADDING)
        px1 = min(img.width, x1 + PADDING)
        py1 = min(img.height, y1 + PADDING)

        crop = arr[py0:py1, px0:px1].copy()

        # Make background transparent: pixels that were NOT in the foreground
        # mask (original, not dilated) become transparent
        fg_crop = fg[py0:py1, px0:px1]
        alpha = (fg_crop * 255).astype(np.uint8)

        # Feather edges slightly: also keep dilated-mask pixels at reduced alpha
        dil_crop = fg_dilated[py0:py1, px0:px1]
        edge = dil_crop & ~fg_crop
        alpha[edge] = 80

        rgba = np.dstack([crop, alpha])
        sprite = Image.fromarray(rgba, mode="RGBA")

        name = f"{prefix}_{count:03d}.png"
        sprite.save(os.path.join(OUT, name))
        manifest.append({
            "file": name,
            "source": fname,
            "x": px0, "y": py0, "w": px1 - px0, "h": py1 - py0,
            "area": int(area),
        })
        count += 1

    print(f"  {fname}: {count} sprites extracted")
    total_extracted += count

print(f"\nTotal: {total_extracted} sprites extracted into {OUT}")

# Write manifest
import json
with open("public/assets/sprites/manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)
print("Manifest written to public/assets/sprites/manifest.json")