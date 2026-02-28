"""
EcoMind AI – Database Seed Script
Populates the database with realistic demo data.
"""

import math
import random
from datetime import datetime, timedelta
from database import SessionLocal, init_db, Building, WasteBin, WasteRecord, CarbonMetric, Insight


def seed():
    init_db()
    db = SessionLocal()

    # Clear existing data
    for model in [Insight, CarbonMetric, WasteRecord, WasteBin, Building]:
        db.query(model).delete()
    db.commit()

    # ── Buildings ──
    buildings = [
        Building(id="hostel-a", name="Hostel A", lat=28.6139, lng=77.2090),
        Building(id="hostel-b", name="Hostel B", lat=28.6155, lng=77.2105),
        Building(id="canteen", name="Main Canteen", lat=28.6125, lng=77.2115),
        Building(id="library", name="Central Library", lat=28.6148, lng=77.2078),
        Building(id="admin", name="Admin Block", lat=28.6162, lng=77.2095),
        Building(id="sports", name="Sports Complex", lat=28.6130, lng=77.2060),
        Building(id="lab", name="Science Lab", lat=28.6170, lng=77.2082),
        Building(id="workshop", name="Workshop", lat=28.6118, lng=77.2100),
    ]
    db.add_all(buildings)

    # ── Bins ──
    bins = [
        WasteBin(building_id="hostel-a", label="HA-01", lat=28.6141, lng=77.2092, fill_level=87, bin_type="mixed", capacity=120),
        WasteBin(building_id="hostel-a", label="HA-02", lat=28.6137, lng=77.2088, fill_level=45, bin_type="recyclable", capacity=80),
        WasteBin(building_id="hostel-b", label="HB-01", lat=28.6157, lng=77.2107, fill_level=92, bin_type="mixed", capacity=120),
        WasteBin(building_id="canteen", label="CT-01", lat=28.6127, lng=77.2117, fill_level=78, bin_type="organic", capacity=150),
        WasteBin(building_id="canteen", label="CT-02", lat=28.6123, lng=77.2113, fill_level=34, bin_type="recyclable", capacity=80),
        WasteBin(building_id="library", label="LB-01", lat=28.6150, lng=77.2080, fill_level=22, bin_type="paper", capacity=60),
        WasteBin(building_id="admin", label="AD-01", lat=28.6164, lng=77.2097, fill_level=56, bin_type="mixed", capacity=100),
        WasteBin(building_id="sports", label="SP-01", lat=28.6132, lng=77.2062, fill_level=95, bin_type="mixed", capacity=100),
        WasteBin(building_id="lab", label="SL-01", lat=28.6172, lng=77.2084, fill_level=41, bin_type="hazardous", capacity=50),
        WasteBin(building_id="workshop", label="WK-01", lat=28.6120, lng=77.2102, fill_level=68, bin_type="metal", capacity=80),
    ]
    db.add_all(bins)

    # ── Historical Waste Records (30 days, all buildings) ──
    now = datetime.utcnow()
    for b in buildings:
        for i in range(30, -1, -1):
            date = now - timedelta(days=i)
            day_of_week = date.weekday()
            weekend = 0.6 if day_of_week >= 5 else 1.0
            base = 180 + math.sin(i * 0.3) * 40
            db.add(WasteRecord(
                building_id=b.id,
                date=date.strftime("%Y-%m-%d"),
                total=round((base + (random.random() - 0.5) * 30) * weekend),
                plastic=round((35 + random.random() * 15) * weekend),
                paper=round((25 + random.random() * 12) * weekend),
                organic=round((55 + random.random() * 20) * weekend),
                metal=round((10 + random.random() * 8) * weekend),
                ewaste=round((3 + random.random() * 4) * weekend),
            ))

    # ── Carbon Metrics (4 weeks) ──
    weeks = [
        CarbonMetric(week_label="W1", co2_saved=98, co2_emitted=45, diversion_rate=62, sustainability_score=72, grade="B"),
        CarbonMetric(week_label="W2", co2_saved=105, co2_emitted=42, diversion_rate=65, sustainability_score=74, grade="B"),
        CarbonMetric(week_label="W3", co2_saved=112, co2_emitted=38, diversion_rate=68, sustainability_score=76, grade="B+"),
        CarbonMetric(week_label="W4", co2_saved=118, co2_emitted=35, diversion_rate=71, sustainability_score=78, grade="B+"),
    ]
    db.add_all(weeks)

    # ── Insights ──
    insights = [
        Insight(category="trend", severity="warning", title="Rising Plastic Waste in Hostel A",
                insight_text="Hostel A shows a 23% increase in plastic waste over the past 2 weeks. This correlates with increased food delivery activity.",
                recommendation="Install dedicated plastic recycling bins near hostel entrance. Consider partnering with local delivery services for reusable containers.",
                impact="Could reduce plastic waste by 18-25%", building_id="hostel-a"),
        Insight(category="opportunity", severity="positive", title="Composting Potential Identified",
                insight_text="The Canteen generates 55+ kg of organic waste daily. Only 12% currently reaches composting facilities.",
                recommendation="Switching to on-site composting can reduce landfill waste by 32% and generate usable compost for campus gardens.",
                impact="Estimated 112 kg CO₂ reduction per week", building_id="canteen"),
        Insight(category="anomaly", severity="critical", title="E-Waste Spike Detected in Lab",
                insight_text="Science Lab has generated 3x normal e-waste volume this week, possibly from equipment replacement cycle.",
                recommendation="Coordinate with IT department for proper e-waste disposal. Contact certified e-waste recyclers.",
                impact="Proper disposal prevents 45 kg CO₂ equivalent toxic emissions", building_id="lab"),
        Insight(category="efficiency", severity="info", title="Paper Consumption Declining",
                insight_text="Library paper waste has decreased by 31% since digital resource adoption last month.",
                recommendation="Continue digital transition. Share success metrics with other departments to encourage similar adoption.",
                impact="Saving approximately 8 kg CO₂ per week", building_id="library"),
        Insight(category="behavioral", severity="warning", title="Weekend Waste Misclassification",
                insight_text="Weekend waste audits show 40% of recyclables ending up in general waste bins, primarily in hostels.",
                recommendation="Deploy color-coded signage and run awareness campaigns targeting weekend habits.",
                impact="Correct sorting could improve recycling rate by 15%", building_id="hostel-b"),
        Insight(category="prediction", severity="info", title="Exam Week Waste Pattern Predicted",
                insight_text="Based on historical data, upcoming exam week is expected to see 25% increase in paper and packaging waste.",
                recommendation="Pre-position extra recycling bins near hostels and library. Schedule additional collection runs.",
                impact="Proactive planning can maintain 60%+ recycling rate during peak", building_id="library"),
    ]
    db.add_all(insights)

    db.commit()
    db.close()
    print("✅ Database seeded successfully!")


if __name__ == "__main__":
    seed()
