"""
EcoMind AI – Waste Classifier (v2)
Loads fine-tuned MobileNetV2 model trained on Garbage Classification V2 dataset.

Model: waste_classifier_v2.keras
Input: 224×224×3 RGB image
Output: Softmax(10) → per-class probabilities
Classes: battery, biological, cardboard, clothes, glass, metal, paper, plastic, shoes, trash
"""

import os
import random
import logging

logger = logging.getLogger(__name__)

# ── Lazy-load model ──
_model = None
_model_loaded = False
_model_error = None

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "waste_classifier_v2.keras")

IMG_SIZE = (224, 224)

# Class names in alphabetical order (matches tf.keras.utils.image_dataset_from_directory)
CLASS_NAMES = ["battery", "biological", "cardboard", "clothes", "glass",
               "metal", "paper", "plastic", "shoes", "trash"]

# Which categories are recyclable
RECYCLABLE = {"battery", "cardboard", "glass", "metal", "paper", "plastic"}


def _load_model():
    """Attempt to load the trained Keras model. Returns True on success."""
    global _model, _model_loaded, _model_error

    if _model_loaded:
        return _model is not None

    _model_loaded = True

    if not os.path.exists(MODEL_PATH):
        _model_error = f"Model file not found at {MODEL_PATH}"
        logger.warning(_model_error)
        return False

    try:
        os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
        import tensorflow as tf
        tf.get_logger().setLevel("ERROR")

        _model = tf.keras.models.load_model(MODEL_PATH)
        logger.info("✅ Waste classifier v2 loaded from %s", MODEL_PATH)
        return True
    except ImportError:
        _model_error = "TensorFlow not installed – using simulated classification"
        logger.warning(_model_error)
        return False
    except Exception as e:
        _model_error = f"Failed to load model: {e}"
        logger.warning(_model_error)
        return False


def _simulate_classification():
    """Fallback: random but realistic classification."""
    raw = [random.random() for _ in CLASS_NAMES]
    total = sum(raw)
    probs = [v / total for v in raw]

    # Make one class dominant
    top_idx = random.randint(0, len(CLASS_NAMES) - 1)
    probs[top_idx] += 0.4
    total = sum(probs)
    probs = [p / total for p in probs]

    distribution = {name: round(p * 100, 1) for name, p in zip(CLASS_NAMES, probs)}
    predicted_class = CLASS_NAMES[top_idx]
    confidence = round(probs[top_idx] * 100, 1)
    recyclable_pct = round(sum(v for k, v in distribution.items() if k in RECYCLABLE), 1)

    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "distribution": distribution,
        "recyclable_pct": recyclable_pct,
        "model_used": "MobileNetV2 (simulated)",
    }


def classify_image(file_bytes: bytes) -> dict:
    """
    Classify a waste image.

    Args:
        file_bytes: Raw image bytes (PNG/JPG/WebP)

    Returns:
        dict with:
            predicted_class: str – top predicted category
            confidence: float – confidence percentage (0-100)
            distribution: dict – {class_name: percentage} for all 10 classes
            recyclable_pct: float – sum of recyclable category percentages
            model_used: str
    """
    if not _load_model():
        logger.info("Model unavailable, falling back to simulation")
        return _simulate_classification()

    try:
        import numpy as np
        from PIL import Image
        import io
        import tensorflow as tf

        # Decode and preprocess
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        img = img.resize(IMG_SIZE)
        arr = np.array(img, dtype=np.float32)
        arr = np.expand_dims(arr, axis=0)

        # MobileNetV2 preprocessing (scale to [-1, 1])
        arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)

        # Inference
        prediction = _model.predict(arr, verbose=0)
        probs = prediction[0]

        # Build result
        distribution = {name: round(float(p) * 100, 1) for name, p in zip(CLASS_NAMES, probs)}
        top_idx = int(np.argmax(probs))
        predicted_class = CLASS_NAMES[top_idx]
        confidence = round(float(probs[top_idx]) * 100, 1)
        recyclable_pct = round(sum(v for k, v in distribution.items() if k in RECYCLABLE), 1)

        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "distribution": distribution,
            "recyclable_pct": recyclable_pct,
            "model_used": "MobileNetV2 v2 (real)",
        }

    except Exception as e:
        logger.warning("Real inference failed: %s – falling back to simulation", e)
        return _simulate_classification()
