"""
Dashboard API – Aggregated stats, trends, and alerts.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, WasteBin, WasteRecord, CarbonMetric

router = APIRouter()


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get aggregated dashboard KPI stats."""
    bins = db.query(WasteBin).all()
    total_bins = len(bins)
    overflow_risk = sum(1 for b in bins if b.fill_level > 85)

    # Latest day waste total (sum across buildings)
    latest_date = db.query(func.max(WasteRecord.date)).scalar()
    day_records = db.query(WasteRecord).filter(WasteRecord.date == latest_date).all()
    total_waste = round(sum(r.total for r in day_records) / max(len(day_records), 1))

    # Recycling rate from latest carbon metric
    latest_carbon = db.query(CarbonMetric).order_by(CarbonMetric.id.desc()).first()
    recycling_rate = latest_carbon.diversion_rate if latest_carbon else 62
    co2_saved = latest_carbon.co2_saved if latest_carbon else 0

    return {
        "totalWasteToday": total_waste,
        "recyclingRate": recycling_rate,
        "co2Saved": co2_saved,
        "activeBins": total_bins,
        "overflowRisk": overflow_risk,
        "collectionEfficiency": 89,
    }


@router.get("/dashboard/waste-trend")
def get_waste_trend(days: int = 14, db: Session = Depends(get_db)):
    """Get waste generation trend over last N days (campus-wide average)."""
    records = (
        db.query(
            WasteRecord.date,
            func.avg(WasteRecord.total).label("total"),
            func.avg(WasteRecord.plastic).label("plastic"),
            func.avg(WasteRecord.paper).label("paper"),
            func.avg(WasteRecord.organic).label("organic"),
            func.avg(WasteRecord.metal).label("metal"),
            func.avg(WasteRecord.ewaste).label("ewaste"),
        )
        .group_by(WasteRecord.date)
        .order_by(WasteRecord.date.desc())
        .limit(days)
        .all()
    )
    result = [
        {
            "date": r.date,
            "total": round(r.total),
            "plastic": round(r.plastic),
            "paper": round(r.paper),
            "organic": round(r.organic),
            "metal": round(r.metal),
            "ewaste": round(r.ewaste),
        }
        for r in reversed(records)
    ]
    return result


@router.get("/dashboard/composition")
def get_waste_composition(db: Session = Depends(get_db)):
    """Get overall waste composition percentages."""
    latest_date = db.query(func.max(WasteRecord.date)).scalar()
    records = db.query(WasteRecord).filter(WasteRecord.date == latest_date).all()

    if not records:
        return []

    totals = {"Plastic": 0, "Paper": 0, "Organic": 0, "Metal": 0, "E-Waste": 0}
    for r in records:
        totals["Plastic"] += r.plastic
        totals["Paper"] += r.paper
        totals["Organic"] += r.organic
        totals["Metal"] += r.metal
        totals["E-Waste"] += r.ewaste

    grand_total = sum(totals.values()) or 1
    colors = {"Plastic": "#f472b6", "Paper": "#60a5fa", "Organic": "#34d399", "Metal": "#fbbf24", "E-Waste": "#a78bfa"}

    return [
        {"name": k, "value": round(v / grand_total * 100), "color": colors[k]}
        for k, v in totals.items()
    ]


@router.get("/dashboard/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """Get recent alerts based on bin fill levels."""
    bins = db.query(WasteBin).order_by(WasteBin.fill_level.desc()).all()
    alerts = []
    for b in bins:
        if b.fill_level >= 90:
            alerts.append({
                "id": b.id, "type": "critical",
                "message": f"Bin {b.label} is {b.fill_level}% full – overflow imminent",
                "time": "Just now", "icon": "🔴",
            })
        elif b.fill_level >= 80:
            alerts.append({
                "id": b.id, "type": "warning",
                "message": f"Bin {b.label} approaching capacity ({b.fill_level}%)",
                "time": "Recently", "icon": "🟡",
            })
    # Static info alerts
    alerts.append({"id": 100, "type": "info", "message": "Route optimization saved 2.3 km today", "time": "1 hr ago", "icon": "🟢"})
    alerts.append({"id": 101, "type": "info", "message": "Weekly recycling rate up by 4%", "time": "2 hr ago", "icon": "🟢"})
    return alerts[:6]
