"""
AI Behavioral Insights API – Rule-based insight generation.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db, Insight, Building

router = APIRouter()


@router.get("/insights")
def get_insights(
    category: str = Query("all", description="Filter by category: all, trend, opportunity, anomaly, efficiency, behavioral, prediction"),
    building_id: str = Query("all", description="Filter by building ID"),
    db: Session = Depends(get_db),
):
    """Get AI-generated behavioral insights with optional filtering."""
    query = db.query(Insight)

    if category != "all":
        query = query.filter(Insight.category == category)
    if building_id != "all":
        query = query.filter(Insight.building_id == building_id)

    insights = query.order_by(Insight.id).all()
    buildings = {b.id: b.name for b in db.query(Building).all()}

    return [
        {
            "id": i.id,
            "category": i.category,
            "severity": i.severity,
            "title": i.title,
            "insight": i.insight_text,
            "recommendation": i.recommendation,
            "impact": i.impact,
            "buildingId": i.building_id,
            "buildingName": buildings.get(i.building_id, i.building_id),
            "createdAt": i.created_at.isoformat() if i.created_at else None,
        }
        for i in insights
    ]


@router.get("/insights/categories")
def get_insight_categories(db: Session = Depends(get_db)):
    """Get available insight categories with counts."""
    from sqlalchemy import func
    cats = (
        db.query(Insight.category, func.count(Insight.id))
        .group_by(Insight.category)
        .all()
    )
    return [{"category": c, "count": n} for c, n in cats]


@router.get("/buildings")
def get_buildings(db: Session = Depends(get_db)):
    """Get all buildings."""
    buildings = db.query(Building).all()
    return [
        {"id": b.id, "name": b.name, "lat": b.lat, "lng": b.lng}
        for b in buildings
    ]
