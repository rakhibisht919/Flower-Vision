<h1 align="center">
  🌸 FlowerVision — Advanced Flower Recognition System
</h1>

<p align="center">
  <em>Identify 102 flower species in seconds using deep learning & computer vision</em>
</p>

<p align="center">
  <a href="#-demo">
    <img src="https://img.shields.io/badge/Live%20Demo-Try%20It-brightgreen?style=for-the-badge&logo=flask" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/Python-3.8%2B-blue?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/TensorFlow-2.15%2B-orange?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow">
  <img src="https://img.shields.io/badge/Flask-Web%20App-black?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Accuracy-85--95%25-success?style=for-the-badge" alt="Accuracy">
</p>

---

## 📖 Overview

**FlowerVision** is a full-stack deep learning web application that can identify **102 different flower species** from a single photo. Built with **EfficientNetB3** transfer learning and served through a **Flask** web interface, it delivers sub-second predictions with rich botanical information, freshness estimation, and model comparison tools.

> Trained on the **Oxford 102 Flowers Dataset** — one of the most comprehensive flower image datasets available for academic research.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **102-Class Recognition** | Identifies 102 flower species using EfficientNetB3 + transfer learning |
| ⚡ **Instant Predictions** | Sub-second inference with top-5 confidence scores |
| 🌿 **Freshness Estimation** | Analyzes color saturation, brightness & edge sharpness to estimate flower age |
| 📚 **Botanical Database** | Scientific names, descriptions, uses, care tips & symbolism for every species |
| 🔬 **Model Comparison** | Compare EfficientNet, VGG16 & MobileNetV2 side-by-side |
| 🌱 **Learn & Grow Page** | Educational guide to growing flowers |
| 📸 **Smart Cropping** | Automatic flower-region detection for better accuracy |
| 🌐 **Web Interface** | Beautiful Flask web app — no GUI library needed |

---

## 🖥️ Demo

```
Upload a flower image → Get instant identification → Explore botanical info
```

The web app runs locally at `http://127.0.0.1:5001` and provides:
- **Main Prediction** with confidence percentage
- **Top-5 Alternatives** with confidence bars
- **Flower Info Panel**: scientific name, description, uses, care, symbolism
- **Freshness Score**: condition rating (Fresh → Wilting) with estimated age
- **Model Comparison Dashboard**: accuracy metrics across 3 architectures

---

## 🗂️ Project Structure

```
FlowerVision/
│
├── 📄 app.py                        # Flask web server & prediction API
├── 🧠 train_model.py                # EfficientNetB3 training script
├── 📊 train_models_compare.py       # Multi-model comparison trainer
├── ⬇️  download_dataset.py          # Oxford 102 dataset downloader
├── 🗃️  flower_database.json         # Botanical info for all 102 species
├── 📋 requirements.txt              # Python dependencies
├── 🔬 eval_standard_loss.py         # Model evaluation utilities
├── 💾 enhance_db.py                 # Database enhancement scripts
│
├── 📁 templates/
│   ├── index.html                   # Main web interface
│   └── learn_grow.html              # Educational flower-growing guide
│
├── 📁 static/
│   ├── css/                         # Stylesheets
│   ├── js/                          # Frontend JavaScript
│   ├── images/                      # Static assets
│   └── animations/                  # UI animations
│
├── 📁 data/                         # Dataset directory (auto-created)
│   ├── class_names.txt              # 102 flower class labels
│   └── oxford_flowers102/           # Downloaded dataset images
│
└── 📁 models/                       # Trained model files (auto-created)
    ├── efficientnet_model.keras      # Primary model
    ├── flower_recognition_model.h5   # Backup Keras model
    ├── best_model.h5                 # Best checkpoint
    ├── training_history.json         # Training metrics
    ├── training_history.png          # Accuracy/loss charts
    └── comparison_results.json       # Multi-model comparison results
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Deep Learning** | TensorFlow / Keras | ≥ 2.15.0 |
| **Architecture** | EfficientNetB3 (ImageNet pretrained) | — |
| **Web Framework** | Flask | Latest |
| **Image Processing** | OpenCV + Pillow | ≥ 4.8.0 / ≥ 10.0 |
| **Data Science** | NumPy, Pandas, Scikit-learn | Latest |
| **Visualization** | Matplotlib, Seaborn | ≥ 3.8.0 |
| **Dataset** | TensorFlow Datasets (Oxford 102) | ≥ 4.9.2 |
| **Frontend** | HTML, CSS, JavaScript | — |

---

## 🚀 Getting Started

### Prerequisites

- Python **3.8 or higher**
- pip package manager
- At least **4 GB RAM** (8 GB recommended for training)
- GPU optional but recommended for training

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/rakhibisht919/Special-message.git
cd Special-message
```

**2. (Recommended) Create a virtual environment**

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

> ⏳ Downloads the Oxford 102 Flowers Dataset (~330 MB). First run only.

**5. Train the model**

```bash
python train_model.py
```

> ⏱️ Training takes **1–3 hours** depending on hardware. A GPU will significantly speed this up.

**Training phases:**
- **Phase 1** — Top layers only (~20 epochs, lr = 0.001)
- **Phase 2** — Fine-tuning (~30 epochs, lr = 0.0001)

**6. Run the web app**

```bash
python app.py
```

Then open your browser and go to **[http://127.0.0.1:5001](http://127.0.0.1:5001)**

---

## 🎯 How to Use

1. **Upload** — Click "Choose Image" and select any flower photo (JPG, PNG, BMP, GIF)
2. **Identify** — Click "Identify Flower" for instant AI-powered classification
3. **Explore** — Browse the full botanical profile, freshness score, and alternative predictions
4. **Compare** — Visit the Model Comparison page to see EfficientNet vs VGG16 vs MobileNetV2

### Tips for Best Results
- 🌺 Focus on the flower, not just the leaves or background
- 💡 Use images with good, natural lighting
- 📐 Ensure the flower is clearly visible and in focus
- 🔍 Close-up shots generally yield higher confidence

---

## 🌺 Supported Flower Species (102 Total)

<details>
<summary>Click to expand the full species list</summary>

Includes (but not limited to):

| Category | Examples |
|---|---|
| **Classic Garden** | Rose, Tulip, Daffodil, Sunflower, Carnation, Petunia, Marigold |
| **Orchids** | Moon Orchid, Cattleya, Pocket Orchid |
| **Lilies** | Tiger Lily, Fire Lily, Water Lily |
| **Exotic** | Bird of Paradise, Lotus, Passion Flower, Protea |
| **Wildflowers** | Dandelion, Buttercup, Poppy, Primula |
| **Specialty** | Anthurium, Snapdragon, Foxglove, Balloon Flower |

See [`data/class_names.txt`](data/class_names.txt) for the complete list of all 102 species.

</details>

---

## 🧠 Model Architecture

```
Input Image (any size)
       │
       ▼
Smart Auto-Crop (contour detection)
       │
       ▼
Resize to 224×224
       │
       ▼
EfficientNetB3 Backbone (ImageNet weights, frozen Phase 1)
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
Dense(102, Softmax)  ←  102 flower classes
```

### Data Augmentation Applied During Training

| Augmentation | Details |
|---|---|
| Random Brightness/Contrast | Simulates different lighting |
| Random Saturation/Hue | Colour variation robustness |
| Random Rotation | 360° orientation invariance |
| Random Flip | Horizontal & vertical |
| Random Zoom/Crop | Scale invariance |
| Gaussian Noise | Camera noise simulation |

### Training Configuration

| Parameter | Value |
|---|---|
| Batch Size | 32 |
| Epochs | 50 (early stopping, patience=10) |
| Optimizer | Adam |
| Phase 1 LR | 0.001 |
| Phase 2 LR | 0.0001 |
| Loss Function | Sparse Categorical Crossentropy |
| Dataset Split | 1020 train / 1020 val / 6149 test |

---

## 📊 Performance Metrics

| Metric | Expected Range |
|---|---|
| Training Accuracy | 90 – 95% |
| Validation Accuracy | 85 – 92% |
| Test Accuracy | 85 – 90% |
| Top-5 Accuracy | 95 – 98% |
| Inference Time | < 1 second |

---

## 🌿 Freshness Estimation

The system estimates flower freshness from image analysis alone (no sensor required):

| Signal | Weight | Meaning |
|---|---|---|
| Color Saturation | 45% | Vibrant colours = fresh |
| Brightness | 25% | Dark patches = wilting |
| Edge Sharpness | 20% | Crisp edges = healthy petals |
| Texture Smoothness | 10% | Smooth texture = fresh |

**Condition ratings:** `Freshly Bloomed` → `Fresh` → `Good Condition` → `Fair` → `Wilting`

---

## 🚨 Troubleshooting

<details>
<summary><strong>Model Not Found Error</strong></summary>

**Problem:** App shows "Model not loaded."  
**Solution:** Run `python train_model.py` to train the model first.

</details>

<details>
<summary><strong>Dataset Download Fails</strong></summary>

**Problem:** Timeout or network error during download.  
**Solution:**
1. Check your internet connection
2. Run `pip install tensorflow-datasets` separately
3. Retry `python download_dataset.py`

</details>

<details>
<summary><strong>Low Prediction Accuracy</strong></summary>

**Problem:** Predictions seem wrong or have low confidence.  
**Solution:**
- Ensure the flower is clearly visible and in focus
- Try a closer or better-lit photo
- Confirm the species is in the 102 supported classes

</details>

<details>
<summary><strong>Training is Slow (No GPU)</strong></summary>

**Solution:**
```bash
# Install CUDA + cuDNN for your GPU, then:
pip install tensorflow-gpu
# Verify GPU is detected:
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

</details>

<details>
<summary><strong>Port Already in Use</strong></summary>

**Problem:** `Address already in use` on port 5001.  
**Solution:** Change the port at the bottom of `app.py`:
```python
app.run(host="0.0.0.0", port=5002, debug=False)
```

</details>

---

## 🔬 Environment Variables

| Variable | Example | Description |
|---|---|---|
| `FLASK_ENV` | `development` | Enable Flask debug mode |
| `FLASK_PORT` | `5001` | Override default port |
| `TF_CPP_MIN_LOG_LEVEL` | `2` | Suppress TF verbose logs |
| `CUDA_VISIBLE_DEVICES` | `0` | Select GPU device index |
| `TF_FORCE_GPU_ALLOW_GROWTH` | `true` | Prevent GPU memory hoarding |
| `PYTHONPATH` | `/path/to/project` | Add project to Python path |

---

## 🤝 Contributing

Contributions are welcome! Ideas for future improvements:

- 🌍 Multi-language support for flower names
- 📱 Progressive Web App (PWA) / mobile version
- 🦠 Plant disease detection alongside species recognition
- 🔄 Real-time camera stream classification
- 🌸 Flowering season predictions by region
- 📦 Docker containerization for easy deployment

---

## 📝 License

This project is released for educational and research purposes.

- **Oxford 102 Flowers Dataset** — Research use (Visual Geometry Group, Oxford)
- **TensorFlow / Keras** — Apache 2.0 License
- **Flask** — BSD License
- **OpenCV** — Apache 2.0 License

---

## 🙏 Credits & Acknowledgements

| Contribution | Source |
|---|---|
| Dataset | [Oxford 102 Category Flower Dataset](https://www.robots.ox.ac.uk/~vgg/data/flowers/102/) — VGG, University of Oxford |
| Base Model | [EfficientNet](https://arxiv.org/abs/1905.11946) — Google Research (Tan & Le, 2019) |
| Framework | [TensorFlow](https://www.tensorflow.org/) & [Keras](https://keras.io/) |
| Web Server | [Flask](https://flask.palletsprojects.com/) |

---

## 👤 Author

**Rakhi Bisht**  
🔗 GitHub: [@rakhibisht919](https://github.com/rakhibisht919)

---

<p align="center">
  Made with ❤️ and 🌸 &nbsp;·&nbsp; Star ⭐ this repo if you found it useful!
</p>
#   F l o w e r - V i s i o n  
 