import io
import os
import sys
import json
import numpy as np

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

from flask import Flask, render_template, request, jsonify
from PIL import Image
import cv2
import tensorflow as tf
from tensorflow import keras

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.after_request
def add_header(r):
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    return r

model = None
tflite_interpreter = None
input_details = None
output_details = None
class_names = []
flower_db = {}
is_saved_model = False
is_tflite_model = False


def load_resources():
    global model, tflite_interpreter, input_details, output_details, class_names, flower_db, is_saved_model, is_tflite_model

    with open("data/class_names.txt", "r", encoding="utf-8") as f:
        class_names = [line.strip() for line in f.readlines()]
    num_classes = len(class_names)

    loaded = False
    is_saved_model = False
    is_tflite_model = False

    # 1. Try TFLite model first (ultra-lightweight, 30MB RAM footprint)
    if os.path.exists("models/efficientnet_model.tflite"):
        try:
            tflite_interpreter = tf.lite.Interpreter(model_path="models/efficientnet_model.tflite")
            tflite_interpreter.allocate_tensors()
            input_details = tflite_interpreter.get_input_details()
            output_details = tflite_interpreter.get_output_details()
            is_tflite_model = True
            loaded = True
            print("[OK] TFLite model loaded successfully!")
        except Exception as e:
            print(f"[WARN] TFLite model load failed: {e}")

    # 2. Fallback to Keras model
    if not loaded:
        for model_path in [
            "models/efficientnet_model.keras",
            "models/flower_recognition_model.h5",
            "models/best_model.h5",
        ]:
            if os.path.exists(model_path):
                try:
                    model = keras.models.load_model(model_path, compile=False)
                    loaded = True
                    print(f"[OK] Keras model loaded: {model_path}")
                    break
                except Exception as e:
                    print(f"[WARN] Could not load {model_path}: {e}")

    if not loaded and os.path.exists("models/flower_recognition_model_tf"):
        try:
            model = tf.saved_model.load("models/flower_recognition_model_tf")
            is_saved_model = True
            loaded = True
            print("[OK] SavedModel loaded.")
        except Exception as e:
            print(f"[WARN] SavedModel failed: {e}")

    if not loaded:
        print("[ERROR] No trained model found. Please train the model first.")
        return

    if not is_saved_model:
        try:
            out_units = int(model.output_shape[-1])
            if out_units != num_classes:
                print(f"[WARN] Model outputs {out_units} classes, class_names has {num_classes}.")
        except Exception:
            pass

    for db_path in ["flower_database_enhanced.json", "flower_database.json"]:
        if os.path.exists(db_path):
            try:
                with open(db_path, "r", encoding="utf-8") as f:
                    flower_db = json.load(f)
                print(f"[OK] Flower DB loaded: {db_path}")
                break
            except Exception as e:
                print(f"[WARN] Could not load {db_path}: {e}")

    print(f"[OK] Ready – {num_classes} classes, {len(flower_db)} DB entries.")


# Image processing

def preprocess_image(img_np, mode="efficientnet"):
    from tensorflow.keras.applications.efficientnet import preprocess_input  # type: ignore

    img = img_np.copy()
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)

    h, w = img.shape[0], img.shape[1]
    side = min(h, w)
    y0 = (h - side) // 2
    x0 = (w - side) // 2
    img = img[y0 : y0 + side, x0 : x0 + side]

    try:
        hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
        s, v = hsv[:, :, 1], hsv[:, :, 2]
        mask = ((s > 60) & (v > 50)).astype(np.uint8) * 255
        edges = cv2.Canny(cv2.cvtColor(img, cv2.COLOR_RGB2GRAY), 50, 150)
        mask = cv2.bitwise_or(mask, edges)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if cnts:
            c = max(cnts, key=cv2.contourArea)
            bx, by, bwc, bhc = cv2.boundingRect(c)
            pad = int(0.1 * max(bwc, bhc))
            x0b = max(bx - pad, 0)
            y0b = max(by - pad, 0)
            x1b = min(bx + bwc + pad, img.shape[1])
            y1b = min(by + bhc + pad, img.shape[0])
            if (y1b - y0b) > 20 and (x1b - x0b) > 20:
                img = img[y0b:y1b, x0b:x1b]
    except Exception:
        pass

    img = cv2.resize(img, (224, 224)).astype(np.float32)
    proc = preprocess_input(img) if mode == "efficientnet" else img / 255.0
    return np.expand_dims(proc, axis=0)


def estimate_freshness(img_np):
    img = img_np.copy()
    if len(img.shape) == 3 and img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)

    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    saturation = hsv[:, :, 1].mean() / 255.0
    value      = hsv[:, :, 2].mean() / 255.0
    gray       = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    edges      = cv2.Canny(gray, 50, 150)
    sharpness  = edges.mean() / 255.0
    smoothness = 1.0 - (np.std(gray) / 255.0)

    freshness = np.clip(
        saturation * 0.35 + value * 0.25 + sharpness * 0.20
        + smoothness * 0.10 + saturation * 0.10,
        0, 1,
    )
    estimated_days = int((1 - freshness) * 10)

    if freshness > 0.85:
        condition = "Freshly Bloomed"
    elif freshness > 0.70:
        condition = "Fresh"
    elif freshness > 0.55:
        condition = "Good Condition"
    elif freshness > 0.40:
        condition = "Fair"
    else:
        condition = "Wilting"

    return {
        "freshness": round(float(freshness) * 100, 1),
        "estimated_days": estimated_days,
        "condition": condition,
        "saturation": round(float(saturation) * 100, 1),
        "brightness": round(float(value) * 100, 1),
        "sharpness": round(float(sharpness) * 100, 1),
    }


def run_inference(img_batch):
    if is_tflite_model:
        tflite_interpreter.set_tensor(input_details[0]['index'], img_batch)
        tflite_interpreter.invoke()
        output_data = tflite_interpreter.get_tensor(output_details[0]['index'])
        return output_data[0]
    if is_saved_model:
        serving = model.signatures["serving_default"]
        _, input_spec = serving.structured_input_signature
        key = list(input_spec.keys())[0]
        out = serving(**{key: tf.constant(img_batch)})
        return list(out.values())[0][0].numpy()
    return model.predict(img_batch, verbose=0)[0]


try:
    load_resources()
except Exception as e:
    print(f"[WARN] Model load warning: {e}")


# Routes

@app.route("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": (is_tflite_model or model is not None), "engine": "tflite" if is_tflite_model else "keras"})


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    if not is_tflite_model and model is None:
        return jsonify({"error": "Model not loaded. Please train the model first."}), 503

    if "image" not in request.files:
        return jsonify({"error": "No image file provided."}), 400

    file = request.files["image"]
    if not file.filename:
        return jsonify({"error": "Empty filename."}), 400

    try:
        import gc
        img_bytes = file.read()
        pil_img   = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        pil_img.thumbnail((400, 400))
        img_np    = np.array(pil_img)

        processed = preprocess_image(img_np, mode="efficientnet")
        predictions = run_inference(processed)
        gc.collect()

        s = float(np.sum(predictions))
        if abs(s - 1.0) > 1e-3:
            e = np.exp(predictions - np.max(predictions))
            predictions = e / np.sum(e)

        top_idx = np.argsort(predictions)[-5:][::-1]
        top = [
            {
                "name":       class_names[i].title(),
                "raw_name":   class_names[i],
                "confidence": round(float(predictions[i]) * 100, 1),
            }
            for i in top_idx
        ]

        db_entry = flower_db.get(class_names[top_idx[0]], {})
        flower_info = {
            "scientific_name": db_entry.get("scientific_name", ""),
            "description":     db_entry.get("description", ""),
            "uses":            db_entry.get("uses", ""),
            "care":            db_entry.get("care", ""),
            "symbolism":       db_entry.get("symbolism", ""),
            "characteristics": db_entry.get("characteristics", ""),
            "wikipedia_url":   db_entry.get("wikipedia_url", ""),
        }

        freshness = estimate_freshness(img_np)

        return jsonify({
            "success":     True,
            "predictions": top,
            "flower_info": flower_info,
            "freshness":   freshness,
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


# Comparison API

_DEMO_COMPARISON = {
    "EfficientNet": {
        "accuracy":     0.0,
        "val_accuracy": 0.0,
        "loss":         0.0,
        "_note": "Train models first by running: python train_models_compare.py"
    },
    "VGG16": {
        "accuracy":     0.0,
        "val_accuracy": 0.0,
        "loss":         0.0,
        "_note": "Train models first by running: python train_models_compare.py"
    },
    "MobileNetV2": {
        "accuracy":     0.0,
        "val_accuracy": 0.0,
        "loss":         0.0,
        "_note": "Train models first by running: python train_models_compare.py"
    },
    "trained": False,
}


@app.route("/compare-models")
def compare_models():
    results_path = os.path.join(script_dir, "models", "comparison_results.json")
    if os.path.exists(results_path):
        try:
            with open(results_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            data["trained"] = True
            return jsonify(data)
        except Exception as e:
            return jsonify({"error": f"Could not read results: {e}"}), 500
    return jsonify(_DEMO_COMPARISON)


@app.route("/flower-info")
def flower_info_route():
    name = request.args.get("name", "").strip().lower()
    if not name:
        return jsonify({"error": "No flower name provided."}), 400

    entry = flower_db.get(name)

    if not entry:
        matches = [k for k in flower_db if name in k]
        if matches:
            name = matches[0]
            entry = flower_db[name]

    if not entry:
        return jsonify({"error": f"No information found for '{name}'."}), 404

    return jsonify({"name": name.title(), "key": name, **entry})


@app.route("/learn-grow")
def learn_grow_page():
    return render_template("learn_grow.html")


# Entry point

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)