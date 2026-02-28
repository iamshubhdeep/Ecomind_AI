"""
EcoMind AI – Train Waste Classifier
Fine-tunes MobileNetV2 on the Garbage Classification V2 dataset (10 classes).

Usage:
    python train_model.py

Output:
    models/waste_classifier_v2.keras
"""

import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

# ── Config ──────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data", "archive", "standardized_256")
MODEL_OUT = os.path.join(os.path.dirname(__file__), "models", "waste_classifier_v2.keras")
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 15
SEED = 42

# ── Dataset ─────────────────────────────────────────────
print("📂 Loading dataset from:", DATA_DIR)

train_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="training",
    seed=SEED,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="categorical",
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="validation",
    seed=SEED,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    label_mode="categorical",
)

class_names = train_ds.class_names
NUM_CLASSES = len(class_names)
print(f"✅ Found {NUM_CLASSES} classes: {class_names}")

# ── Performance prefetch ────────────────────────────────
AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

# ── Data Augmentation ───────────────────────────────────
data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.15),
    layers.RandomZoom(0.1),
    layers.RandomContrast(0.1),
], name="data_augmentation")

# ── Model ───────────────────────────────────────────────
print("🏗️  Building MobileNetV2 model...")

# MobileNetV2 base (frozen initially)
base_model = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(*IMG_SIZE, 3),
)
base_model.trainable = False

# Build full model
inputs = layers.Input(shape=(*IMG_SIZE, 3))
x = data_augmentation(inputs)
x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.3)(x)
x = layers.Dense(256, activation="relu")(x)
x = layers.Dropout(0.3)(x)
outputs = layers.Dense(NUM_CLASSES, activation="softmax")(x)

model = Model(inputs, outputs)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

model.summary()

# ── Phase 1: Train head only ───────────────────────────
print("\n🚀 Phase 1: Training classification head (base frozen)...")

callbacks = [
    EarlyStopping(monitor="val_accuracy", patience=3, restore_best_weights=True),
    ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6),
]

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
    callbacks=callbacks,
)

# ── Phase 2: Fine-tune top layers of base ──────────────
print("\n🔧 Phase 2: Fine-tuning top layers of MobileNetV2...")

# Unfreeze the last 30 layers
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

callbacks_ft = [
    EarlyStopping(monitor="val_accuracy", patience=3, restore_best_weights=True),
    ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2, min_lr=1e-7),
    ModelCheckpoint(MODEL_OUT, monitor="val_accuracy", save_best_only=True, verbose=1),
]

history_ft = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=10,
    callbacks=callbacks_ft,
)

# ── Save final model ───────────────────────────────────
model.save(MODEL_OUT)

# ── Evaluate ────────────────────────────────────────────
loss, accuracy = model.evaluate(val_ds)
print(f"\n{'='*50}")
print(f"✅ Training complete!")
print(f"   Validation Accuracy: {accuracy*100:.1f}%")
print(f"   Validation Loss:     {loss:.4f}")
print(f"   Model saved to:      {MODEL_OUT}")
print(f"   Classes:             {class_names}")
print(f"{'='*50}")
