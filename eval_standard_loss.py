# Re-evaluate models with standard cross-entropy loss
import json, math
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.applications.efficientnet import preprocess_input as effnet_pre
from tensorflow.keras.applications.vgg16 import preprocess_input as vgg_pre
import tensorflow_datasets as tfds

IMG_SIZE   = 224
BATCH_SIZE = 32
AUTOTUNE   = tf.data.AUTOTUNE

def make_eval_ds(ds, preprocess_fn):
    def pipeline(image, label):
        image = tf.cast(image, tf.float32)
        image = tf.image.resize(image, [IMG_SIZE, IMG_SIZE])
        image = preprocess_fn(image)
        return image, label
    return ds.map(pipeline, num_parallel_calls=AUTOTUNE).batch(BATCH_SIZE).prefetch(AUTOTUNE)

print("Loading dataset...")
_, _, raw_test = tfds.load(
    "oxford_flowers102",
    split=["train", "validation", "test"],
    as_supervised=True, with_info=False, data_dir="data",
)

print("Loading EfficientNetB0 model...")
eff_model = keras.models.load_model("models/efficientnet_model.keras", compile=False)
eff_model.compile(optimizer="adam",
                  loss="sparse_categorical_crossentropy",
                  metrics=["accuracy"])
eff_res = eff_model.evaluate(make_eval_ds(raw_test, effnet_pre), verbose=0)
eff_acc  = round(float(eff_res[1]), 4)
eff_loss = round(float(eff_res[0]), 4)
print(f"  EfficientNetB0 -> Acc: {eff_acc*100:.2f}%  Loss (std CE): {eff_loss:.4f}")

print("Loading VGG16 model...")
vgg_model = keras.models.load_model("models/vgg16_model.keras", compile=False)
vgg_model.compile(optimizer="adam",
                  loss="sparse_categorical_crossentropy",
                  metrics=["accuracy"])
vgg_res = vgg_model.evaluate(make_eval_ds(raw_test, vgg_pre), verbose=0)
vgg_acc  = round(float(vgg_res[1]), 4)
vgg_loss = round(float(vgg_res[0]), 4)
print(f"  VGG16          -> Acc: {vgg_acc*100:.2f}%  Loss (std CE): {vgg_loss:.4f}")

with open("models/comparison_results.json", "r") as f:
    comp = json.load(f)

comp["EfficientNet"]["accuracy"] = eff_acc
comp["EfficientNet"]["loss"]     = eff_loss
comp["VGG16"]["accuracy"]        = vgg_acc
comp["VGG16"]["loss"]            = vgg_loss

with open("models/comparison_results.json", "w") as f:
    json.dump(comp, f, indent=2)

print("\n[OK] comparison_results.json updated with standard CE loss.")
print("\n" + "="*60)
print(f"  EfficientNetB0 : Acc={eff_acc*100:.2f}%  Loss={eff_loss:.4f}")
print(f"  VGG16          : Acc={vgg_acc*100:.2f}%  Loss={vgg_loss:.4f}")
winner = "EfficientNetB0" if eff_acc >= vgg_acc else "VGG16"
print(f"  Winner: {winner}")
print("="*60)
