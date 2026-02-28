"""
EcoMind AI – Database Models & Engine
SQLAlchemy ORM with SQLite backend
"""

from sqlalchemy import (
    Column, Integer, Float, String, DateTime, Boolean, Text,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ecomind.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── Dependency ──
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────

class Building(Base):
    __tablename__ = "buildings"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)


class WasteBin(Base):
    __tablename__ = "waste_bins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    building_id = Column(String, nullable=False)
    label = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    fill_level = Column(Integer, default=0)
    bin_type = Column(String, default="mixed")
    capacity = Column(Integer, default=100)
    last_collected = Column(DateTime, nullable=True)


class WasteRecord(Base):
    __tablename__ = "waste_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    building_id = Column(String, nullable=False)
    date = Column(String, nullable=False)
    total = Column(Float, default=0)
    plastic = Column(Float, default=0)
    paper = Column(Float, default=0)
    organic = Column(Float, default=0)
    metal = Column(Float, default=0)
    ewaste = Column(Float, default=0)


class ClassificationLog(Base):
    __tablename__ = "classification_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    filename = Column(String, nullable=True)
    predicted_class = Column(String, nullable=True)
    confidence = Column(Float, default=0)
    distribution_json = Column(Text, nullable=True)
    recyclable_pct = Column(Float, default=0)


class CarbonMetric(Base):
    __tablename__ = "carbon_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    week_label = Column(String, nullable=False)
    co2_saved = Column(Float, default=0)
    co2_emitted = Column(Float, default=0)
    diversion_rate = Column(Float, default=0)
    sustainability_score = Column(Integer, default=0)
    grade = Column(String, default="C")


class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    title = Column(String, nullable=False)
    insight_text = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    impact = Column(String, nullable=True)
    building_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Create tables ──
def init_db():
    Base.metadata.create_all(bind=engine)
