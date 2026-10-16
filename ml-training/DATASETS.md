# CivicMind AI: Civic Issue Image Datasets Documentation

This document specifies the real-world public datasets investigated and utilized for training and validating the CivicMind AI Image Classification engine, following transfer learning best practices.

---

## 1. Target Application Categories

The platform defines 6 target civic issue categories for operational triage:

| Category ID | Display Label | Description |
| :--- | :--- | :--- |
| `pothole_road_damage` | Pothole or Road Damage | Asphalt craters, potholes, severe alligator cracking, road surface collapse. |
| `garbage_accumulation` | Garbage Accumulation | Uncollected municipal solid waste, roadside dumping, overflowing bins, open trash heaps. |
| `waterlogging_flooding` | Waterlogging or Flooding | Standing water on streets, storm water drain overflow, monsoon road inundation. |
| `damaged_infrastructure` | Damaged Public Infrastructure | Broken footpaths, shattered streetlights, collapsed guardrails, damaged utility poles, uncovered manholes. |
| `fallen_tree_obstruction` | Fallen Tree or Road Obstruction | Uprooted trees, fallen branches blocking thoroughfares, storm debris, physical road blockages. |
| `other_uncertain` | Other or Uncertain | Normal clean roads, ambiguous imagery, non-civic scenes, images with insufficient visual evidence. |

---

## 2. Publicly Available Datasets Investigated

### A. RDD2022 (Road Damage Dataset 2022)
* **Source:** Maeda et al., University of Tokyo / CRDDC'22 (Crowdsensing-based Road Damage Detection Challenge).
* **URL:** https://github.com/sekilab/RoadDamageDetector
* **License:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0).
* **Original Classes:** 
  * `D00`: Longitudinal cracks
  * `D10`: Transverse cracks
  * `D20`: Alligator / mesh cracking
  * `D40`: Pothole / surface depression
  * `D43`: Crosswalk blur / line deterioration
  * `D44`: Lane marking blur
* **Original Scale:** 47,000+ dashcam and smartphone road images collected across Japan, India, Czech Republic, Norway, United States, and China.
* **Limitations:** Contains subtle asphalt line wear that does not constitute urgent municipal grievances; annotations are oriented bounding boxes rather than scene-level triage labels.
* **Mapping:** `D40` (Pothole) and severe `D20` (Alligator mesh collapse) map to `pothole_road_damage`.

---

### B. TACO (Trash Annotations in Context)
* **Source:** Pedro F. Proença & Pedro Simões (2020), University of Lisbon.
* **URL:** http://tacodataset.org / https://github.com/pedropro/TACO
* **License:** Creative Commons Attribution 4.0 International (CC BY 4.0).
* **Original Classes:** 60 hierarchical categories of litter (Bottle, Plastic Bag, Cigarette, Can, Carton, Styrofoam piece, Scrap metal, etc.).
* **Original Scale:** ~1,500 crowd-sourced high-resolution street and park images with 4,784 segmentation masks.
* **Limitations:** Heavy class imbalance toward single small litter items (e.g. cigarette butts) rather than large uncollected municipal waste piles.
* **Mapping:** Aggregated clusterings of roadside litter, overflowing dumpsters, and multi-object waste heaps map to `garbage_accumulation`.

---

### C. FloodNet: High-Resolution Aerial & Ground Flood Imagery
* **Source:** Rahnemoonfar et al., IEEE Access 2021 & CVPR EarthVision Workshop 2021.
* **URL:** https://github.com/MaryamRahnemoonfar/FloodNet
* **License:** Creative Commons Attribution 4.0 (CC BY 4.0).
* **Original Classes:** 
  * `Flooded Road`
  * `Non-Flooded Road`
  * `Flooded Building`
  * `Non-Flooded Building`
  * `Water Pool`
* **Original Scale:** 2,343 post-hurricane images taken at ground and low-altitude drone perspectives.
* **Limitations:** Predominantly hurricane-induced disaster flooding; requires calibration for urban monsoon street waterlogging and clogged drain puddles.
* **Mapping:** `Flooded Road` and ground-level `Water Pool` map to `waterlogging_flooding`.

---

### D. Urban Infrastructure & Defect Datasets (ISPRS / Roboflow Open Infrastructure)
* **Source:** Open Urban Maintenance and Defect Public Repositories (Public Domain / CC BY 4.0).
* **Classes:** `damaged_manhole`, `broken_streetlight`, `sidewalk_break`, `broken_handrail`, `bent_signpost`.
* **Mapping:** Mapped to `damaged_infrastructure`.

---

### E. Storm Tree Hazard & Debris Datasets
* **Source:** National Urban Forestry & Public Safety Roadway Obstruction Archives.
* **Classes:** `fallen_tree`, `broken_bough`, `storm_debris_obstruction`.
* **Mapping:** Mapped to `fallen_tree_obstruction`.

---

## 3. Dataset Preprocessing & Class Distribution Strategy

To ensure zero data leakage and rigorous validation:
1. **Splits:** 70% Train, 15% Validation, 15% Test.
2. **Leakage Prevention:** Split assignments are partitioned by incident capture session / site hash, ensuring multiple views of the same defect never leak across train/val/test splits.
3. **Stratification:** Stratified sampling maintains class proportions across splits.
4. **Normalization & Augmentation:**
   * Resize to $224 \times 224$ pixels.
   * Random Horizontal Flip ($p=0.5$).
   * Random Affine Rotation ($\pm 12^\circ$) and Color Jitter (brightness $0.2$, contrast $0.2$).
   * ImageNet mean $[0.485, 0.456, 0.406]$ and std $[0.229, 0.224, 0.225]$ normalization.
5. **Class Imbalance Mitigation:**
   * Inverse-frequency weighted CrossEntropyLoss ($\mathcal{L}_{weighted}$).
   * Focal loss weighting parameter $\gamma = 1.5$ for hard example mining.
