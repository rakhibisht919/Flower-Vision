# Flower recognition training — EfficientNetB0 two-phase

import os
import json
from pathlib import Path
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.applications.efficientnet import preprocess_input
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import tensorflow_datasets as tfds
import matplotlib.pyplot as plt
import numpy as np

# Config
IMG_SIZE = 224
BATCH_SIZE = 32
NUM_CLASSES = 102
AUTOTUNE = tf.data.AUTOTUNE

def augment_for_real_world(image, label):
   
    image = tf.image.random_flip_left_right(image)
    image = tf.image.random_flip_up_down(image)
    image = tf.image.random_brightness(image, max_delta=0.2)
    image = tf.image.random_contrast(image, lower=0.8, upper=1.2)
    image = tf.image.random_saturation(image, lower=0.8, upper=1.2)
    image = tf.clip_by_value(image, 0.0, 1.0)
    return image, label

def prepare_dataset(ds, is_training=True, augment=True):
    def preprocess_pipeline(image, label):
        image = tf.cast(image, tf.float32)
        image = tf.image.resize(image, [IMG_SIZE, IMG_SIZE])
        image = image / 255.0
        if is_training and augment:
            image, label = augment_for_real_world(image, label)
        image = tf.clip_by_value(image, 0.0, 1.0) * 255.0
        image = preprocess_input(image)
        return image, label
    
    ds = ds.map(preprocess_pipeline, num_parallel_calls=AUTOTUNE)
    if is_training:
        ds = ds.shuffle(1000)
    ds = ds.batch(BATCH_SIZE)
    ds = ds.prefetch(AUTOTUNE)
    return ds

def create_optimized_model():
    base_model = EfficientNetB0(
        include_top=False,
        weights='imagenet',
        input_shape=(IMG_SIZE, IMG_SIZE, 3)
    )
    base_model.trainable = False

    inputs = keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(1024, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(512, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(NUM_CLASSES, activation='softmax', name='classification')(x)
    model = keras.Model(inputs, outputs)
    return model, base_model

def plot_training_results(history, save_path='models/training_history.png'):
    acc = history['accuracy']
    val_acc = history['val_accuracy']
    loss = history['loss']
    val_loss = history['val_loss']
    epochs_range = range(1, len(acc) + 1)

    plt.figure(figsize=(16, 6))

    plt.subplot(1, 2, 1)
    plt.plot(epochs_range, acc, label='Training Accuracy', linewidth=2)
    plt.plot(epochs_range, val_acc, label='Validation Accuracy', linewidth=2)
    plt.title('Training & Validation Accuracy', fontsize=14)
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.legend(loc='lower right')
    plt.grid(True, alpha=0.3)

    plt.subplot(1, 2, 2)
    plt.plot(epochs_range, loss, label='Training Loss', linewidth=2)
    plt.plot(epochs_range, val_loss, label='Validation Loss', linewidth=2)
    plt.title('Training & Validation Loss', fontsize=14)
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend(loc='upper right')
    plt.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path)
    print(f"[OK] Accuracy/Loss charts saved to {save_path}")

def main():
    print("=" * 70)
    print("🚀 STARTING OPTIMIZED MODEL TRAINING")
    print("=" * 70)
    
    Path('models').mkdir(exist_ok=True)
    Path('data').mkdir(exist_ok=True)
    

    print("\n[Step 1] Loading Oxford 102 Flowers Dataset...")
    (train_ds, val_ds, test_ds), info = tfds.load(
        'oxford_flowers102',
        split=['train', 'validation', 'test'],
        as_supervised=True, 
        with_info=True,
        data_dir='data'
    )
    
    class_names = info.features['label'].names
    with open('data/class_names.txt', 'w') as f:
        for name in class_names: f.write(f"{name}\n")
    print(f"[OK] Training on {len(class_names)} flower types.")
    

    print("\n[Step 2] Processing images and applying augmentation...")
    train_ready = prepare_dataset(train_ds, is_training=True, augment=True)
    val_ready = prepare_dataset(val_ds, is_training=False, augment=False)
    test_ready = prepare_dataset(test_ds, is_training=False, augment=False)
    

    print("\n[Step 3] Building Optimized EfficientNetB0 Model...")
    model, base_model = create_optimized_model()
    
    print("\n[Step 4] Phase 1: training head only...")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    callbacks = [
        ModelCheckpoint('models/best.weights.h5', save_best_only=True, save_weights_only=True, monitor='val_accuracy'),
        EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    ]
    
    history1 = model.fit(
        train_ready, 
        validation_data=val_ready, 
        epochs=15, 
        callbacks=callbacks
    )
    
    print("\n[Step 5] Phase 2: fine-tuning top layers...")
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False
        
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    history2 = model.fit(
        train_ready, 
        validation_data=val_ready, 
        epochs=15, 
        callbacks=callbacks,
        initial_epoch=history1.epoch[-1]
    )
    

    print("\n[Step 6] Final evaluation on test set...")
    test_results = model.evaluate(test_ready)
    print(f"\n✅ FINAL ACCURACY ON TEST SET: {test_results[1]*100:.2f}%")
    
    combined_history = {k: history1.history[k] + history2.history[k] for k in history1.history.keys()}
    plot_training_results(combined_history)
    
    with open('models/training_history.csv', 'w') as f:
        f.write("epoch,accuracy,val_accuracy,loss,val_loss\n")
        for i in range(len(combined_history['accuracy'])):
            f.write(f"{i+1},{combined_history['accuracy'][i]},{combined_history['val_accuracy'][i]},{combined_history['loss'][i]},{combined_history['val_loss'][i]}\n")
            
    model.save_weights('models/flower_recognition.weights.h5')
    print("\n" + "=" * 70)
    print("✨ TRAINING COMPLETED! THE MODEL IS NOW OPTIMIZED.")
    print("=" * 70)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
