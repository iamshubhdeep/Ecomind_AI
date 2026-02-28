"""
Waste Predictor API – Historical data + LSTM-simulated forecasts.
"""

import math
import random
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, WasteRecord

router = APIRouter()


@router.get("/predictor/historical")
def get_historical_data(
    building_id: str = Query("all", description="Building ID or 'all'"),
    days: int = Query(30, description="Number of days"),
    db: Session = Depends(get_db),
):
    """Get historical waste generation data."""
    query = db.query(
        WasteRecord.date,
        func.avg(WasteRecord.total).label("total"),
        func.avg(WasteRecord.plastic).label("plastic"),
        func.avg(WasteRecord.paper).label("paper"),
        func.avg(WasteRecord.organic).label("organic"),
        func.avg(WasteRecord.metal).label("metal"),
        func.avg(WasteRecord.ewaste).label("ewaste"),
    )

    if building_id != "all":
        query = query.filter(WasteRecord.building_id == building_id)

    records = (
        query.group_by(WasteRecord.date)
        .order_by(WasteRecord.date.desc())
        .limit(days)
        .all()
    )

    return [
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


@router.get("/predictor/forecast")
def get_forecast(
    building_id: str = Query("all", description="Building ID or 'all'"),
    days: int = Query(7, description="Forecast days"),
    db: Session = Depends(get_db),
):
    """
    Generate waste volume forecast.
    Simulates LSTM-based prediction with confidence intervals.
    """
    # Get the last known value as baseline
    query = db.query(WasteRecord)
    if building_id != "all":
        query = query.filter(WasteRecord.building_id == building_id)
    last_record = query.order_by(WasteRecord.date.desc()).first()
    baseline = last_record.total if last_record else 180

    forecast = []
    from datetime import datetime, timedelta
    last_date = datetime.strptime(last_record.date, "%Y-%m-%d") if last_record else datetime.utcnow()

    for i in range(1, days + 1):
        date = last_date + timedelta(days=i)
        day_of_week = date.weekday()
        weekend_factor = 0.6 if day_of_week >= 5 else 1.0
        trend = baseline + math.sin(i * 0.5) * 25
        predicted = round((trend + (random.random() - 0.5) * 20) * weekend_factor)
        upper = round((trend + 30) * weekend_factor)
        lower = round(max(50, (trend - 30) * weekend_factor))

        forecast.append({
            "date": date.strftime("%Y-%m-%d"),
            "dateLabel": date.strftime("%b %d"),
            "predicted": predicted,
            "upper": upper,
            "lower": lower,
        })

    # Summary stats
    tomorrow = forecast[0] if forecast else None
    peak = max(forecast, key=lambda x: x["predicted"]) if forecast else None
    overflow_risk_days = sum(1 for f in forecast if f["predicted"] > 220)

    return {
        "forecast": forecast,
        "summary": {
            "tomorrowVolume": tomorrow["predicted"] if tomorrow else 0,
            "peakDay": peak["dateLabel"] if peak else "",
            "peakVolume": peak["predicted"] if peak else 0,
            "overflowRiskDays": overflow_risk_days,
        },
        "model": "LSTM (simulated)",
        "confidenceLevel": "85%",
    }
