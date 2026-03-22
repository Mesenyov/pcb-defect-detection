# 🔍 Siamese Neural Network-Based Adaptive Approach for Open-Set Defect Detection in PCBs

![Project Status](https://img.shields.io/badge/status-active-green)
![Python](https://img.shields.io/badge/python-3.8%2B-blue)
![Framework](https://img.shields.io/badge/framework-PyTorch%20%7C%20FastAPI-red)
![License](https://img.shields.io/badge/license-MIT-grey)

Official repository for the paper: **"Siamese Neural Network-Based Adaptive Approach for Open-Set Defect Detection and Classification in Printed Circuit Boards"**.

This project provides an automated visual quality inspection (AOI) framework for Printed Circuit Boards (PCBs). It is specifically designed to detect manufacturing defects by comparing test images with a defect-free "Golden Template".

**Key Feature:** Unlike traditional object detectors limited to a closed-set paradigm, this system is capable of detecting **Out-of-Distribution (OOD) anomalies** (previously unknown defect types) without requiring complete model retraining, leveraging few-shot metric learning and dynamic thresholding.

---

## 📊 Experimental Results (OOD Dataset)

The proposed framework was comprehensively evaluated against state-of-the-art closed-set object detectors (YOLOv8 family) and an open-world detector (ORE) on an Out-of-Distribution dataset containing fundamentally novel anomalies.

| Model / Method | Params (M) | Inference Speed (FPS) | Det Recall | Cls F1-Score |
| :--- | :--- | :--- | :--- | :--- |
| YOLOv8 Small | 11.14 | 16.7 | 0.2192 | 0.0917 |
| YOLOv8 Medium | 25.86 | 21.8 | 0.2466 | 0.0901 |
| YOLOv8 Large | 43.63 | 33.9 | 0.2192 | 0.1091 |
| YOLOv8 X-Large | 68.16 | **50.6** | 0.1507 | 0.0792 |
| ORE (CVPR 2021) | ~41.0 | 5.4 | 0.4030 | 0.2778 |
| **Proposed Method** | **~7.5** | 12.6 | **0.9552** 🏆 | **0.6187** 🏆 |

> **Note:** We also evaluated unsupervised memory-bank methods (e.g., PatchCore). However, due to the high morphological complexity of PCB conductive traces, it yielded an excessive number of false positives (Object-level F1-score < 0.01) and was excluded from the final comparative table. 

---

## 🛠 Architecture

The framework decouples the tasks of anomaly localization and metric classification into two sequential stages:

### Stage 1: Anomaly Localization (Siamese U-Net)
Responsible for identifying any structural deviations from the golden template.
*   **Backbone:** Lightweight **MobileNetV3-Large** (pre-trained on ImageNet).
*   **Mechanism:** A Siamese network architecture with shared weights that computes absolute feature differences across three hierarchical scales.
*   **Loss Function:** A composite loss combining `BCEWithLogitsLoss` and `DiceLoss` to mitigate severe class imbalance.

### Stage 2: Metric Classification (ProtoNet)
Responsible for classifying the localized defect or rejecting it as a novel anomaly.
*   **Backbone:** **EfficientNet-B0** feature extractor.
*   **Metric Learning:** Optimized using the **ArcFace** loss function to ensure highly compact and well-separated defect clusters on a hypersphere.
*   **Inference:** Classification is performed based on the cosine distance to class prototypes. A dynamic thresholding strategy ($3\sigma$ rule) is applied to identify and label OOD defects as `Unknown`.

---

## 🚀 Installation and Usage

### Prerequisites
*   Python 3.8+
*   Git LFS installed (required for downloading model weights)

### 1. Clone the repository
```bash
git clone https://github.com/Mesenyov/pcb-defect-detection.git
cd pcb-defect-detection

# Pull pre-trained weights (Important!)
git lfs pull
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Web Service
```bash
python main.py
```
The FastAPI application will be accessible at: `http://localhost:8000`

---

## 📂 Repository Structure

```text
.
├── app/
│   ├── models.py        # Siamese U-Net and EfficientNet architectures
│   ├── inspector.py     # End-to-end inference pipeline
│   ├── utils.py         # Helper functions (image alignment, visualization)
│   └── config.py        # Path configurations
├── weights/             # Pre-trained model weights (.pth) via Git LFS
├── templates/           # Web interface HTML templates
├── static/              # CSS and JS assets
├── PCB_Golden_Templates/# Base reference images (Golden boards)
└── main.py              # FastAPI entry point
```

---

## 👥 Authors

*   **Alexey Mesenyov** - ML Engineer (Model architecture design, ArcFace metric learning, Backend development)
*   **Andrey Efremenko** - ML Engineer (Data preparation, Siamese U-Net training, Frontend integration)
*   **Igor Glukhikh** - Scientific Advisor (Project supervision, methodological guidance, paper review)

---

## 📝 Citation

If you find this code useful for your research, please consider citing our paper:

```bibtex
@article{efremenko2026siamese,
  title={Siamese Neural Network-Based Adaptive Approach for Open-Set Defect Detection and Classification in Printed Circuit Boards},
  author={Efremenko, Andrey and Mesenyov, Alexey and Glukhikh, Igor},
  journal={Springer (Pending Publication)},
  year={2026}
}
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```
