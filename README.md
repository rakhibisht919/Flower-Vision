# 🌸 FlowerVision — Advanced Flower Recognition System

> Identify **102 flower species** in seconds using deep learning, computer vision & a beautiful web interface.

![Python](https://img.shields.io/badge/Python-3.8%2B-3776AB?style=flat-square&logo=python&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15%2B-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Web%20App-000000?style=flat-square&logo=flask&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-4.8%2B-5C3EE8?style=flat-square&logo=opencv&logoColor=white)
![Accuracy](https://img.shields.io/badge/Accuracy-85--95%25-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

**FlowerVision** is a full-stack deep learning web app that identifies **102 different flower species** from a single uploaded photo. It is built on **EfficientNetB3** transfer learning (trained on the Oxford 102 Flowers Dataset) and served through a clean **Flask** web interface. Beyond classification, it estimates flower freshness from image analysis alone and provides a rich botanical information panel for every species.

🔗 **Live locally at:** `http://127.0.0.1:5001` after setup

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **102-Class Recognition** | EfficientNetB3 + transfer learning on Oxford 102 Flowers Dataset |
| ⚡ **Sub-second Inference** | Top-5 predictions with confidence scores |
| 🌿 **Freshness Estimation** | Analyses colour, brightness & edge sharpness to estimate flower age |
| 📚 **Botanical Database** | Scientific names, descriptions, uses, care tips & symbolism |
| 🔬 **Model Comparison** | EfficientNet vs VGG16 vs MobileNetV2 accuracy dashboard |
| 📸 **Smart Auto-Crop** | Automatic flower-region detection before inference |
| 🌱 **Learn & Grow Page** | Educational guide to growing flowers |
| 🌐 **Web Interface** | Flask-powered — runs in any browser, no GUI library needed |

---

## 🗂️ Project Structure

```
Flower-Vision/
│
├── app.py                        # Flask web server & prediction API
├── train_model.py                # EfficientNetB3 training script
├── train_models_compare.py       # Multi-model comparison trainer
├── download_dataset.py           # Oxford 102 dataset downloader
├── enhance_db.py                 # Botanical database enhancement
├── eval_standard_loss.py         # Model evaluation utilities
├── flower_database.json          # Botanical info for all 102 species
├── requirements.txt              # Python dependencies
│
├── templates/
│   ├── index.html                # Main web interface
│   └── learn_grow.html           # Flower-growing educational guide
│
├── static/
│   ├── css/                      # Stylesheets
│   ├── js/                       # Frontend JavaScript
│   ├── images/                   # Static image assets
│   └── animations/               # UI animations
│
├── data/                         # Auto-created on first run
│   ├── class_names.txt           # 102 flower class labels
│   └── oxford_flowers102/        # Downloaded dataset (not in repo)
│
└── models/                       # Auto-created after training
    ├── efficientnet_model.keras   # Primary trained model
    ├── best_model.h5              # Best checkpoint
    ├── training_history.json      # Training metrics log
    └── comparison_results.json    # Multi-model comparison results
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Deep Learning | TensorFlow / Keras | ≥ 2.15.0 |
| Model Architecture | EfficientNetB3 (ImageNet pretrained) | — |
| Web Framework | Flask | Latest |
| Image Processing | OpenCV + Pillow | ≥ 4.8.0 / ≥ 10.0 |
| Data & ML Utils | NumPy, Pandas, Scikit-learn | Latest |
| Visualization | Matplotlib, Seaborn | ≥ 3.8.0 |
| Dataset API | TensorFlow Datasets | ≥ 4.9.2 |
| Frontend | HTML, CSS, JavaScript | — |

---

## 🚀 Getting Started

### Prerequisites

- Python **3.8 or higher**
- pip package manager
- 4 GB RAM minimum (8 GB recommended for training)
- GPU optional but recommended for training speed

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/rakhibisht919/Flower-Vision.git
cd Flower-Vision
```

**2. Create a virtual environment (recommended)**

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

**3. Install dependencies**

```bash
pip install -r requirements.txt
```

**4. Download the dataset**

```bash
python download_dataset.py
```

> Downloads the Oxford 102 Flowers Dataset (~330 MB). Only needed once.

**5. Train the model**

```bash
python train_model.py
```

> Training takes 1–3 hours depending on hardware. GPU is strongly recommended.
>
> - Phase 1 — Top layers only (~20 epochs, lr = 0.001)
> - Phase 2 — Fine-tuning (~30 epochs, lr = 0.0001)
> - Expected accuracy: 85–95% on test set

**6. Run the web app**

```bash
python app.py
```

Open your browser and go to **http://127.0.0.1:5001**

---

## 🎯 How to Use

**Step 1 — Upload** an image using the "Choose Image" button (JPG, PNG, BMP, GIF supported)

**Step 2 — Identify** the flower by clicking "Identify Flower" for instant AI classification

**Step 3 — Explore** the full result panel:
- Predicted species name + confidence percentage
- Top-5 alternative predictions with confidence bars
- Scientific name, description, uses, care tips & symbolism
- Freshness score with condition rating and estimated age in days

**Step 4 — Compare models** on the Model Comparison page (after running `train_models_compare.py`)

### Tips for Best Results

- Focus on the flower, not just leaves or background
- Use natural, well-lit images
- Close-up shots yield the highest confidence
- Clear, in-focus images outperform blurry ones

---

## 🧠 Model Architecture

```
Input Image (any resolution)
       │
       ▼
  Smart Auto-Crop  (contour + colour mask detection)
       │
       ▼
  Resize → 224 × 224
       │
       ▼
  EfficientNetB3 Backbone  (pretrained on ImageNet)
       │
       ▼
  Global Average Pooling
       │
       ▼
  Dense(512, ReLU) → BatchNorm → Dropout(0.5)
       │
       ▼
  Dense(256, ReLU) → BatchNorm → Dropout(0.3)
       │
       ▼
  Dense(102, Softmax)   ←   102 flower classes
```

### Training Configuration

| Parameter | Value |
|---|---|
| Batch Size | 32 |
| Epochs | 50 (early stopping, patience = 10) |
| Optimizer | Adam |
| Phase 1 Learning Rate | 0.001 |
| Phase 2 Learning Rate | 0.0001 |
| Loss Function | Sparse Categorical Crossentropy |
| Dataset Split | 1,020 train / 1,020 val / 6,149 test |

### Data Augmentation

| Technique | Purpose |
|---|---|
| Random Brightness / Contrast | Different lighting conditions |
| Random Saturation / Hue | Colour variation robustness |
| Random Rotation | 360° orientation invariance |
| Random Flip (H & V) | Pose invariance |
| Random Zoom / Crop | Scale invariance |
| Gaussian Noise | Camera noise simulation |

---

## 📊 Performance Metrics

| Metric | Expected Range |
|---|---|
| Training Accuracy | 90 – 95% |
| Validation Accuracy | 85 – 92% |
| Test Accuracy | 85 – 90% |
| Top-5 Accuracy | 95 – 98% |
| Inference Time | < 1 second per image |

---

## 🌿 Freshness Estimation

Flower freshness is estimated from image analysis alone — no sensor required.

| Signal | Weight | What It Indicates |
|---|---|---|
| Colour Saturation | 45% | Vibrant colours = fresh petals |
| Brightness | 25% | Dark patches = wilting |
| Edge Sharpness | 20% | Crisp edges = healthy petals |
| Texture Smoothness | 10% | Smooth texture = fresh bloom |

**Condition ratings:** `Freshly Bloomed` → `Fresh` → `Good Condition` → `Fair` → `Wilting`

---

## 🌺 Supported Species (102 Total)

<details>
<summary>Click to expand species list</summary>

| Category | Examples |
|---|---|
| Classic Garden | Rose, Tulip, Daffodil, Sunflower, Carnation, Petunia, Marigold |
| Orchids | Moon Orchid, Cattleya Orchid, Pocket Orchid |
| Lilies | Tiger Lily, Fire Lily, Water Lily |
| Exotic | Bird of Paradise, Lotus, Passion Flower, Protea |
| Wildflowers | Dandelion, Buttercup, Poppy, Primula |
| Specialty | Anthurium, Snapdragon, Foxglove, Balloon Flower |

See [`data/class_names.txt`](data/class_names.txt) for all 102 species.

</details>

---

## 🚨 Troubleshooting

<details>
<summary><strong>Model Not Found / "Model not loaded" error</strong></summary>

Run the training script first:
```bash
python train_model.py
```

</details>

<details>
<summary><strong>Dataset download fails</strong></summary>

1. Check your internet connection
2. Run `pip install tensorflow-datasets` separately
3. Retry: `python download_dataset.py`

</details>

<details>
<summary><strong>Low prediction accuracy</strong></summary>

- Ensure the flower is clearly visible and in focus
- Try a closer or better-lit photo
- Confirm the species is one of the 102 supported classes

</details>

<details>
<summary><strong>Training is slow (No GPU)</strong></summary>

```bash
pip install tensorflow-gpu
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

</details>

<details>
<summary><strong>Port 5001 already in use</strong></summary>

Change the port at the bottom of `app.py`:
```python
app.run(host="0.0.0.0", port=5002, debug=False)
```

</details>

---

## 🔬 Environment Variables

| Variable | Example | Description |
|---|---|---|
| `FLASK_ENV` | `development` | Enable Flask debug mode |
| `TF_CPP_MIN_LOG_LEVEL` | `2` | Suppress TensorFlow verbose logs |
| `CUDA_VISIBLE_DEVICES` | `0` | Select GPU device index |
| `TF_FORCE_GPU_ALLOW_GROWTH` | `true` | Prevent GPU memory over-allocation |
| `PYTHONPATH` | `/path/to/project` | Add project root to Python path |

---

## 📝 License

This project is released for educational and research purposes.

- **Oxford 102 Flowers Dataset** — Research use (VGG, University of Oxford)
- **TensorFlow / Keras** — Apache 2.0 License
- **Flask** — BSD License
- **OpenCV** — Apache 2.0 License

---

## 🙏 Credits & Acknowledgements

| Contribution | Source |
|---|---|
| Dataset | [Oxford 102 Category Flower Dataset](https://www.robots.ox.ac.uk/~vgg/data/flowers/102/) — Visual Geometry Group, University of Oxford |
| Base Model | [EfficientNet](https://arxiv.org/abs/1905.11946) — Google Research (Tan & Le, 2019) |
| Framework | [TensorFlow](https://www.tensorflow.org/) & [Keras](https://keras.io/) |
| Web Server | [Flask](https://flask.palletsprojects.com/) |

---

## 👤 Author

**Rakhi Bisht**
GitHub: [@rakhibisht919](https://github.com/rakhibisht919)

---

*Made with ❤️ and 🌸 — Star ⭐ this repo if you found it useful!*