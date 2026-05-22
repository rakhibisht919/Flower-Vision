import tensorflow as tf
import os
import numpy as np
from pathlib import Path

def download_flowers_dataset():
    
    print("Downloading Oxford 102 Flowers Dataset...")
    print("This dataset contains 102 different flower species!")
    
    os.makedirs('data', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    
    import tensorflow_datasets as tfds
    
    (train_ds, val_ds, test_ds), info = tfds.load(
        'oxford_flowers102',
        split=['train', 'validation', 'test'],
        shuffle_files=True,
        as_supervised=True,
        with_info=True,
        data_dir='data'
    )
    
    print(f"\nDataset Info:")
    print(f"Total classes: {info.features['label'].num_classes}")
    print(f"Training samples: {info.splits['train'].num_examples}")
    print(f"Validation samples: {info.splits['validation'].num_examples}")
    print(f"Test samples: {info.splits['test'].num_examples}")
    
    class_names = info.features['label'].names
    
    with open('data/class_names.txt', 'w') as f:
        for name in class_names:
            f.write(f"{name}\n")
    
    print(f"\nClass names saved to data/class_names.txt")
    print(f"Sample classes: {class_names[:10]}")
    
    return train_ds, val_ds, test_ds, class_names

if __name__ == "__main__":
    try:
        download_flowers_dataset()
        print("\n✓ Dataset downloaded successfully!")
    except Exception as e:
        print(f"\nError: {e}")
        print("\nInstalling tensorflow-datasets...")
        os.system("pip install tensorflow-datasets")
        print("\nPlease run this script again.")
