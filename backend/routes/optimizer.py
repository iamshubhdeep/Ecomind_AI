"""
Route Optimizer API – Optimized collection routes.
Uses nearest-neighbor heuristic with priority weighting.

Inspired by smart-waste-master fork's OptimoRoute + Google Maps integration.
Enhanced with priority-weighted nearest-neighbor for offline operation.
"""

import math
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, WasteBin, Building

router = APIRouter()


def haversine(lat1, lng1, lat2, lng2):
    """Calculate distance between two lat/lng points in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def nearest_neighbor_route(bins):
    """Nearest-neighbor route optimization with priority weighting."""
    if not bins:
        return []

    # Sort by fill level (priority) first, then do nearest-neighbor among top priority
    prioritized = sorted(bins, key=lambda b: b.fill_level, reverse=True)

    # Only collect bins above 30% fill
    to_visit = [b for b in prioritized if b.fill_level > 30]
    if not to_visit:
        return []

    route = [to_visit[0]]
    remaining = to_visit[1:]

    while remaining:
        last = route[-1]
        nearest = min(remaining, key=lambda b: haversine(last.lat, last.lng, b.lat, b.lng))
        route.append(nearest)
        remaining.remove(nearest)

    return route


def get_fill_priority(level):
    if level >= 85:
        return "critical"
    if level >= 65:
        return "high"
    if level >= 40:
        return "medium"
    return "low"


@router.get("/routes/optimize")
def optimize_route(db: Session = Depends(get_db)):
    """
    Get optimized collection route based on bin fill levels.
    Uses nearest-neighbor with priority sorting.
    """
    all_bins = db.query(WasteBin).all()
    buildings = {b.id: b.name for b in db.query(Building).all()}

    route = nearest_neighbor_route(all_bins)

    # Calculate total distance
    total_distance = 0
    for i in range(1, len(route)):
        total_distance += haversine(route[i - 1].lat, route[i - 1].lng, route[i].lat, route[i].lng)

    route_data = []
    for i, bin_obj in enumerate(route):
        route_data.append({
            "order": i + 1,
            "binId": bin_obj.id,
            "label": bin_obj.label,
            "buildingId": bin_obj.building_id,
            "buildingName": buildings.get(bin_obj.building_id, bin_obj.building_id),
            "lat": bin_obj.lat,
            "lng": bin_obj.lng,
            "fillLevel": bin_obj.fill_level,
            "binType": bin_obj.bin_type,
            "capacity": bin_obj.capacity,
            "priority": get_fill_priority(bin_obj.fill_level),
        })

    return {
        "route": route_data,
        "stats": {
            "totalDistance": round(total_distance, 2),
            "estimatedTime": round(len(route) * 4.5 + total_distance * 3, 0),
            "binsToCollect": len(route),
            "fuelSaved": round(total_distance * 0.3, 1),
        },
        "algorithm": "Nearest-Neighbor with Priority Weighting",
    }


@router.get("/routes/bins")
def get_all_bins(db: Session = Depends(get_db)):
    """Get all bin locations with current fill levels."""
    bins = db.query(WasteBin).all()
    buildings = {b.id: b.name for b in db.query(Building).all()}

    return [
        {
            "id": b.id,
            "label": b.label,
            "buildingId": b.building_id,
            "buildingName": buildings.get(b.building_id, b.building_id),
            "lat": b.lat,
            "lng": b.lng,
            "fillLevel": b.fill_level,
            "binType": b.bin_type,
            "capacity": b.capacity,
            "priority": get_fill_priority(b.fill_level),
        }
        for b in bins
    ]
