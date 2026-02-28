"""
Waste Analyzer API – Image classification endpoint.
Uses MobileNetV2 v2 model (10-class Garbage Classification V2 dataset).
"""

import time
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from database import get_db, ClassificationLog
from ml.classifier import classify_image
import json

router = APIRouter()

WASTE_TYPES = [
    {"key": "battery",    "label": "Battery",    "color": "#ef4444", "emoji": "🔋"},
    {"key": "biological", "label": "Biological", "color": "#22c55e", "emoji": "🥬"},
    {"key": "cardboard",  "label": "Cardboard",  "color": "#d97706", "emoji": "📦"},
    {"key": "clothes",    "label": "Clothes",    "color": "#8b5cf6", "emoji": "👕"},
    {"key": "glass",      "label": "Glass",      "color": "#06b6d4", "emoji": "🫙"},
    {"key": "metal",      "label": "Metal",      "color": "#f59e0b", "emoji": "🔩"},
    {"key": "paper",      "label": "Paper",      "color": "#3b82f6", "emoji": "📄"},
    {"key": "plastic",    "label": "Plastic",    "color": "#ec4899", "emoji": "🧴"},
    {"key": "shoes",      "label": "Shoes",      "color": "#a855f7", "emoji": "👟"},
    {"key": "trash",      "label": "Trash",      "color": "#6b7280", "emoji": "🗑️"},
]

WASTE_TYPE_MAP = {wt["key"]: wt for wt in WASTE_TYPES}


@router.post("/analyzer/classify")
async def classify_waste(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a waste image for AI classification.
    Returns the predicted class, confidence, and full 10-class distribution.
    """
    contents = await file.read()
    file_size = len(contents)

    start = time.time()
    result = classify_image(contents)
    elapsed_ms = int((time.time() - start) * 1000)

    distribution = result["distribution"]
    predicted_class = result["predicted_class"]
    confidence = result["confidence"]
    recyclable_pct = result["recyclable_pct"]
    model_used = result["model_used"]

    # Log to database
    log = ClassificationLog(
        filename=file.filename,
        predicted_class=predicted_class,
        confidence=confidence,
        distribution_json=json.dumps(distribution),
        recyclable_pct=recyclable_pct,
    )
    db.add(log)
    db.commit()

    # Build distribution list for frontend
    dist_list = []
    for wt in WASTE_TYPES:
        dist_list.append({
            **wt,
            "value": distribution.get(wt["key"], 0),
        })
    dist_list.sort(key=lambda x: x["value"], reverse=True)

    return {
        "filename": file.filename,
        "fileSize": file_size,
        "predictedClass": predicted_class,
        "confidence": confidence,
        "distribution": dist_list,
        "recyclablePercent": recyclable_pct,
        "model": model_used,
        "inferenceTime": f"{elapsed_ms}ms",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/analyzer/history")
def get_classification_history(limit: int = 10, db: Session = Depends(get_db)):
    """Get recent classification logs."""
    logs = (
        db.query(ClassificationLog)
        .order_by(ClassificationLog.id.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id,
            "filename": l.filename,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "predictedClass": l.predicted_class,
            "confidence": l.confidence,
            "recyclablePct": l.recyclable_pct,
        }
        for l in logs
    ]
