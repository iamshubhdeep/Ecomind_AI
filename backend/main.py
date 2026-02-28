"""
EcoMind AI – FastAPI Main Application
API server for waste management intelligence system.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes import dashboard, analyzer, predictor, optimizer, carbon, insights

# ── Initialize ──
init_db()

app = FastAPI(
    title="EcoMind AI API",
    description="Intelligent Waste Prediction & Carbon Optimization System – Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ──
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(analyzer.router, prefix="/api", tags=["Waste Analyzer"])
app.include_router(predictor.router, prefix="/api", tags=["Waste Predictor"])
app.include_router(optimizer.router, prefix="/api", tags=["Route Optimizer"])
app.include_router(carbon.router, prefix="/api", tags=["Carbon Engine"])
app.include_router(insights.router, prefix="/api", tags=["AI Insights"])


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "service": "EcoMind AI API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
