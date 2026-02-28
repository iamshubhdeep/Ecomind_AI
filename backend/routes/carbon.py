"""
Carbon & Sustainability Score Engine API.
Calculates CO₂ savings, landfill diversion, and sustainability grades.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, CarbonMetric, WasteRecord
from sqlalchemy import func

router = APIRouter()

# Emission factors (kg CO₂ per kg waste)
EMISSION_FACTORS = {
    "plastic": {"emission": 6.0, "recycle_savings": 1.5},
    "paper": {"emission": 1.1, "recycle_savings": 0.9},
    "organic": {"emission": 0.5, "recycle_savings": 0.3},
    "metal": {"emission": 4.0, "recycle_savings": 3.2},
    "ewaste": {"emission": 20.0, "recycle_savings": 15.0},
}


@router.get("/carbon/summary")
def get_carbon_summary(db: Session = Depends(get_db)):
    """Get overall carbon and sustainability summary."""
    metrics = db.query(CarbonMetric).order_by(CarbonMetric.id).all()
    latest = metrics[-1] if metrics else None

    total_saved = sum(m.co2_saved for m in metrics)
    total_emitted = sum(m.co2_emitted for m in metrics)
    trees_equivalent = round(total_saved / 21)

    return {
        "co2SavedTotal": total_saved,
        "co2EmittedTotal": total_emitted,
        "diversionRate": latest.diversion_rate if latest else 0,
        "treesEquivalent": trees_equivalent,
        "sustainabilityScore": latest.sustainability_score if latest else 0,
        "grade": latest.grade if latest else "C",
        "weeklyTrend": "+4.2%",
        "target": 85,
    }


@router.get("/carbon/weekly")
def get_weekly_carbon(db: Session = Depends(get_db)):
    """Get weekly CO₂ impact data."""
    metrics = db.query(CarbonMetric).order_by(CarbonMetric.id).all()
    return [
        {
            "week": m.week_label,
            "saved": m.co2_saved,
            "emitted": m.co2_emitted,
            "diversionRate": m.diversion_rate,
            "score": m.sustainability_score,
            "grade": m.grade,
        }
        for m in metrics
    ]


@router.get("/carbon/by-category")
def get_carbon_by_category(db: Session = Depends(get_db)):
    """Get CO₂ savings breakdown by waste category."""
    # Get average waste volumes
    avgs = db.query(
        func.avg(WasteRecord.plastic).label("plastic"),
        func.avg(WasteRecord.paper).label("paper"),
        func.avg(WasteRecord.organic).label("organic"),
        func.avg(WasteRecord.metal).label("metal"),
        func.avg(WasteRecord.ewaste).label("ewaste"),
    ).first()

    categories = []
    colors = {"plastic": "#f472b6", "paper": "#60a5fa", "organic": "#34d399", "metal": "#fbbf24", "ewaste": "#a78bfa"}
    labels = {"plastic": "Plastic", "paper": "Paper", "organic": "Organic", "metal": "Metal", "ewaste": "E-Waste"}

    for key, factors in EMISSION_FACTORS.items():
        avg_vol = getattr(avgs, key, 0) or 0
        saved = round(factors["recycle_savings"] * avg_vol, 1)
        emitted = round(factors["emission"] * avg_vol * 0.3, 1)  # Assuming 30% goes to landfill
        categories.append({
            "name": labels[key],
            "key": key,
            "saved": saved,
            "emitted": emitted,
            "color": colors[key],
        })

    return categories


@router.get("/carbon/breakdown")
def get_sustainability_breakdown(db: Session = Depends(get_db)):
    """Get sustainability score breakdown by area."""
    latest = db.query(CarbonMetric).order_by(CarbonMetric.id.desc()).first()
    base_score = latest.sustainability_score if latest else 70

    return {
        "overall": base_score,
        "grade": latest.grade if latest else "B",
        "breakdown": {
            "recycling": min(100, base_score + 4),
            "composting": max(0, base_score - 13),
            "reduction": max(0, base_score - 7),
            "awareness": min(100, base_score + 10),
            "efficiency": max(0, base_score - 3),
        },
        "trend": "+4.2%",
        "target": 85,
    }
