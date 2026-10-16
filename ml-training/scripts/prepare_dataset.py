"""
CivicMind AI - Civic Issue Image Dataset Preparation Script
Generates a structured, reproducible 6-class civic issue dataset partitioned into
Train (70%), Validation (15%), and Test (15%) splits with zero data leakage.
"""

import os
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

CLASSES = [
    "pothole_road_damage",
    "garbage_accumulation",
    "waterlogging_flooding",
    "damaged_infrastructure",
    "fallen_tree_obstruction",
    "other_uncertain"
]

SPLITS = {
    "train": 70,
    "val": 15,
    "test": 15
}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

def create_base_asphalt():
    """Create an asphalt pavement background texture."""
    width, height = 256, 256
    # Gray asphalt with grain
    base_color = random.randint(55, 75)
    noise = np.random.randint(-15, 15, (height, width, 3), dtype=np.int16)
    img_arr = np.clip(base_color + noise, 0, 255).astype(np.uint8)
    return Image.fromarray(img_arr)

def draw_pothole(img):
    """Draw a dark irregular crater with rough asphalt edges and depth gradient."""
    draw = ImageDraw.Draw(img)
    cx, cy = random.randint(90, 166), random.randint(90, 166)
    rx, ry = random.randint(35, 70), random.randint(25, 55)
    
    # Outer dark edge
    points = []
    num_pts = 16
    for i in range(num_pts):
        angle = 2 * np.pi * i / num_pts
        r = random.uniform(0.7, 1.25)
        px = cx + rx * r * np.cos(angle)
        py = cy + ry * r * np.sin(angle)
        points.append((px, py))
    
    draw.polygon(points, fill=(28, 25, 24), outline=(15, 14, 12))
    # Inner shadow
    inner_pts = [(cx + (x - cx) * 0.6, cy + (y - cy) * 0.6) for x, y in points]
    draw.polygon(inner_pts, fill=(12, 10, 10))
    # Cracks radiating outward
    for _ in range(4):
        sx, sy = random.choice(points)
        for _ in range(3):
            ex = sx + random.randint(-25, 25)
            ey = sy + random.randint(-25, 25)
            draw.line([(sx, sy), (ex, ey)], fill=(15, 15, 15), width=2)
            sx, sy = ex, ey
    return img.filter(ImageFilter.GaussianBlur(radius=0.7))

def draw_garbage(img):
    """Draw colorful discarded plastic, bags, cans, and waste mounds."""
    draw = ImageDraw.Draw(img)
    colors = [
        (220, 38, 38),   # Red plastic
        (37, 99, 235),   # Blue bag
        (234, 179, 8),   # Yellow wrapper
        (243, 244, 246), # White styrofoam
        (75, 85, 99),    # Metal tin
        (22, 101, 52),   # Green bottle
        (217, 119, 6),   # Cardboard
    ]
    # Cluster of litter objects
    cx, cy = random.randint(80, 170), random.randint(80, 170)
    for _ in range(random.randint(18, 32)):
        ox = cx + random.randint(-65, 65)
        oy = cy + random.randint(-65, 65)
        shape_type = random.choice(["rect", "circle", "polygon"])
        color = random.choice(colors)
        if shape_type == "rect":
            w, h = random.randint(10, 28), random.randint(8, 24)
            draw.rectangle([ox, oy, ox + w, oy + h], fill=color, outline=(20, 20, 20))
        elif shape_type == "circle":
            r = random.randint(6, 16)
            draw.ellipse([ox - r, oy - r, ox + r, oy + r], fill=color, outline=(20, 20, 20))
        else:
            poly = [(ox + random.randint(-15, 15), oy + random.randint(-15, 15)) for _ in range(4)]
            draw.polygon(poly, fill=color, outline=(20, 20, 20))
    return img

def draw_waterlogging(img):
    """Draw water puddle reflections with murky blue-brown standing water and ripple rings."""
    draw = ImageDraw.Draw(img)
    cx, cy = random.randint(80, 170), random.randint(80, 170)
    rx, ry = random.randint(55, 95), random.randint(35, 65)
    
    # Large standing water pool
    water_color = (random.randint(40, 60), random.randint(70, 95), random.randint(95, 125))
    draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=water_color, outline=(30, 50, 70))
    
    # Sky / street reflection highlight
    draw.ellipse([cx - int(rx * 0.6), cy - int(ry * 0.4), cx + int(rx * 0.5), cy + int(ry * 0.3)], fill=(75, 115, 145))
    
    # Concentric wave ripples
    for radius in [15, 30, 45]:
        draw.arc([cx - radius, cy - int(radius * 0.5), cx + radius, cy + int(radius * 0.5)], 0, 360, fill=(160, 190, 215), width=2)
    return img.filter(ImageFilter.GaussianBlur(radius=1.0))

def draw_infrastructure(img):
    """Draw broken concrete curb, shattered metal guardrail, or uncovered manhole."""
    draw = ImageDraw.Draw(img)
    sub = random.choice(["curb", "post", "manhole"])
    if sub == "curb":
        # Fractured sidewalk curb
        draw.rectangle([20, 180, 236, 230], fill=(160, 160, 160), outline=(80, 80, 80))
        # Deep crack
        draw.polygon([(90, 180), (105, 180), (120, 230), (85, 230)], fill=(30, 30, 30))
        draw.line([(100, 180), (140, 140)], fill=(20, 20, 20), width=3)
    elif sub == "post":
        # Bent metallic streetlight / utility pole
        draw.line([(128, 250), (145, 130), (195, 40)], fill=(120, 125, 130), width=12)
        draw.line([(145, 130), (170, 160)], fill=(180, 50, 50), width=6)  # Warning hazard tape
    else:
        # Open circular manhole chamber
        cx, cy = 128, 128
        draw.ellipse([cx - 45, cy - 45, cx + 45, cy + 45], fill=(15, 15, 15), outline=(90, 90, 90), width=8)
        draw.ellipse([cx - 30, cy - 30, cx + 30, cy + 30], fill=(5, 5, 5))
    return img

def draw_fallen_tree(img):
    """Draw a fallen tree trunk, boughs, and foliage obstruction across roadway."""
    draw = ImageDraw.Draw(img)
    # Brown woody trunk laying horizontally / diagonally
    x1, y1 = random.randint(10, 40), random.randint(100, 180)
    x2, y2 = random.randint(200, 245), random.randint(80, 160)
    draw.line([(x1, y1), (x2, y2)], fill=(88, 53, 24), width=random.randint(18, 30))
    # Secondary branches
    draw.line([(x1 + 60, y1 - 10), (x1 + 90, y1 - 60)], fill=(75, 45, 20), width=8)
    draw.line([(x2 - 50, y2 + 10), (x2 - 30, y2 + 50)], fill=(75, 45, 20), width=8)
    
    # Green leaf foliage clusters
    for _ in range(random.randint(15, 25)):
        fx = random.randint(min(x1, x2), max(x1, x2)) + random.randint(-30, 30)
        fy = random.randint(min(y1, y2), max(y1, y2)) + random.randint(-40, 40)
        r = random.randint(10, 24)
        leaf_color = (random.randint(20, 50), random.randint(100, 160), random.randint(20, 60))
        draw.ellipse([fx - r, fy - r, fx + r, fy + r], fill=leaf_color)
    return img

def draw_other_uncertain(img):
    """Draw clean asphalt, clear pavement, standard lane lines, or ambiguous background."""
    draw = ImageDraw.Draw(img)
    var = random.choice(["lane_marking", "clean_road", "crosswalk"])
    if var == "lane_marking":
        # Solid white or yellow lane line
        color = random.choice([(245, 245, 245), (234, 179, 8)])
        draw.rectangle([120, 0, 136, 256], fill=color)
    elif var == "crosswalk":
        # White zebra stripes
        for y in range(20, 240, 45):
            draw.rectangle([40, y, 216, y + 25], fill=(240, 240, 240))
    # Otherwise just clean pristine road texture
    return img

GENERATORS = {
    "pothole_road_damage": draw_pothole,
    "garbage_accumulation": draw_garbage,
    "waterlogging_flooding": draw_waterlogging,
    "damaged_infrastructure": draw_infrastructure,
    "fallen_tree_obstruction": draw_fallen_tree,
    "other_uncertain": draw_other_uncertain
}

def generate_dataset():
    total_samples = 0
    for split_name, count in SPLITS.items():
        for category in CLASSES:
            target_dir = os.path.join(DATA_DIR, split_name, category)
            os.makedirs(target_dir, exist_ok=True)
            gen_func = GENERATORS[category]
            
            for idx in range(count):
                base_img = create_base_asphalt()
                final_img = gen_func(base_img)
                file_name = f"{category}_{split_name}_{idx:04d}.jpg"
                final_img.save(os.path.join(target_dir, file_name), quality=90)
                total_samples += 1
                
    print(f"Successfully generated {total_samples} images across {len(CLASSES)} classes in {DATA_DIR}.")

if __name__ == "__main__":
    generate_dataset()
