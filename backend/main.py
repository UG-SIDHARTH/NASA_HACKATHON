from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import os

import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from services.si_service import SuperIntelligenceService
from services.flammability_modeler import FlammabilityModeler
from services.flammability_model import ml_service

app = FastAPI(
    title="NASA Flame in Freefall SI Dashboard API",
    description="Super-Intelligence Powered Fire Safety Insights from NASA Microgravity Combustion Science",
    version="2.0.0"
)

# Enable CORS for local Vite dev and Docker environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INVESTIGATIONS_FILE = os.path.join(BASE_DIR, "data", "investigations.json")
DOMAIN_FILE = os.path.join(BASE_DIR, "data", "domain_knowledge.json")

si_service = SuperIntelligenceService(INVESTIGATIONS_FILE, DOMAIN_FILE)

class SIQueryRequest(BaseModel):
    query: str

class FlammabilityRequest(BaseModel):
    material_type: Optional[str] = "fabric"
    material: Optional[str] = None # Support backwards compatibility
    oxygen_pct: float = 21.0
    pressure_psi: float = 14.7
    airflow_cm_s: float = 10.0
    sample_thickness_mm: Optional[float] = 3.0
    gravity_level: Optional[str] = "microgravity"

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "NASA Flame in Freefall SI Dashboard API",
        "dataset_size": len(si_service.investigations),
        "docs_url": "/docs"
    }

@app.get("/api/investigations")
def get_investigations(
    category: Optional[str] = None,
    hardware: Optional[str] = None,
    search: Optional[str] = None
):
    results = si_service.investigations
    if category:
        results = [inv for inv in results if inv.get("category") == category]
    if hardware:
        results = [inv for inv in results if hardware.lower() in inv.get("hardware", "").lower()]
    if search:
        s = search.lower()
        results = [
            inv for inv in results
            if s in inv["name"].lower()
            or s in inv["full_name"].lower()
            or s in inv["objectives"].lower()
            or any(s in m.lower() for m in inv["fuels"]["materials"])
        ]
    return results

@app.get("/api/investigations/{inv_id}")
def get_investigation_detail(inv_id: str):
    for inv in si_service.investigations:
        if inv["id"] == inv_id:
            return inv
    raise HTTPException(status_code=404, detail=f"Investigation '{inv_id}' not found")

@app.get("/api/rankings")
def get_relevance_rankings():
    """Returns investigations ranked by explainable crew fire-safety relevance score."""
    sorted_invs = sorted(si_service.investigations, key=lambda x: x["relevance_score"], reverse=True)
    return [
        {
            "id": inv["id"],
            "name": inv["name"],
            "full_name": inv["full_name"],
            "category": inv["category"],
            "hardware": inv["hardware"],
            "relevance_score": inv["relevance_score"],
            "relevance_explanation": inv["relevance_explanation"],
            "crew_environments": inv["fire_safety_relevance"]["crew_environments"]
        }
        for inv in sorted_invs
    ]

@app.post("/api/compare")
def compare_investigations(inv_ids: List[str]):
    selected = [inv for inv in si_service.investigations if inv["id"] in inv_ids]
    if not selected:
        raise HTTPException(status_code=400, detail="No matching investigations found")
    
    # Structure comparison matrix
    comparison = {
        "items": selected,
        "metrics": {
            "max_o2": max([max(inv["test_conditions"]["oxygen_concentration_pct"]) for inv in selected]),
            "min_o2": min([min(inv["test_conditions"]["oxygen_concentration_pct"]) for inv in selected]),
            "materials_count": sum([len(inv["fuels"]["materials"]) for inv in selected])
        }
    }
    return comparison

@app.get("/api/domain")
def get_domain_knowledge():
    return si_service.domain

@app.post("/api/si/query")
def ask_super_intelligence(req: SIQueryRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return si_service.answer_query(req.query)

@app.post("/api/predict/flammability")
def predict_flammability(req: FlammabilityRequest):
    """
    Predicts flammability outcomes using the trained ML model (GradientBoostingRegressor).
    Returns: loc_predicted, ignition_risk_score, flame_spread_rate, soot_yield,
             plus a human-readable risk_level (LOW/MODERATE/HIGH/CRITICAL),
             supporting investigations, and model confidence indicator.
    """
    mat = req.material_type or req.material or "fabric"
    thickness = req.sample_thickness_mm if req.sample_thickness_mm is not None else 3.0
    gravity = req.gravity_level or "microgravity"

    return ml_service.predict(
        material_type=mat,
        oxygen_pct=req.oxygen_pct,
        pressure_psi=req.pressure_psi,
        airflow_cm_s=req.airflow_cm_s,
        sample_thickness_mm=thickness,
        gravity_level=gravity
    )
