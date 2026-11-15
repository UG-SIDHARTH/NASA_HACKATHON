import os
import pickle
import numpy as np
from typing import Dict, Any, List

class FlammabilityMLService:
    def __init__(self, model_path: str = None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, "models", "flammability_model.pkl")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Trained model not found at {model_path}. Run train_model.py first.")

        with open(model_path, "rb") as f:
            data = pickle.load(f)
            self.model = data["model"]
            self.materials = data["materials"]
            self.gravity_levels = data["gravity_levels"]

    def predict(
        self,
        material_type: str = "fabric",
        oxygen_pct: float = 21.0,
        pressure_psi: float = 14.7,
        airflow_cm_s: float = 10.0,
        sample_thickness_mm: float = 3.0,
        gravity_level: str = "microgravity"
    ) -> Dict[str, Any]:
        mat_norm = material_type.lower().strip()
        if mat_norm not in self.materials:
            if "fabric" in mat_norm or "cotton" in mat_norm or "cloth" in mat_norm:
                mat_norm = "fabric"
            elif "pmma" in mat_norm or "acrylic" in mat_norm or "plastic" in mat_norm:
                mat_norm = "plastic"
            elif "wire" in mat_norm or "kapton" in mat_norm or "teflon" in mat_norm:
                mat_norm = "wire_insulation"
            elif "silicone" in mat_norm or "sealant" in mat_norm or "rubber" in mat_norm:
                mat_norm = "silicone"
            elif "composite" in mat_norm:
                mat_norm = "composite"
            else:
                mat_norm = "fabric"

        grav_norm = gravity_level.lower().strip()
        if grav_norm not in self.gravity_levels:
            if "0" in grav_norm or "micro" in grav_norm or "zero" in grav_norm:
                grav_norm = "microgravity"
            elif "part" in grav_norm or "moon" in grav_norm or "mars" in grav_norm:
                grav_norm = "partial"
            else:
                grav_norm = "normal"

        mat_idx = self.materials.index(mat_norm)
        grav_idx = self.gravity_levels.index(grav_norm)

        features = np.array([[mat_idx, grav_idx, oxygen_pct, pressure_psi, airflow_cm_s, sample_thickness_mm]])
        preds = self.model.predict(features)[0]

        loc_pred = round(float(preds[0]), 1)
        spread_rate = round(float(max(0.0, preds[1])), 2)
        soot_yield = round(float(np.clip(preds[2], 0.05, 0.99)), 2)

        # In standard 1g Earth atmosphere (21% O2, 14.7 psi, 0 airflow), quiescent air causes
        # thick thermal boundary layer and high convective heat loss, keeping baseline hazard LOW/MODERATE.
        if oxygen_pct <= loc_pred:
            margin = loc_pred - oxygen_pct
            ignition_risk_score = max(5.0, round(30.0 - (margin * 4.0), 1))
            spread_rate = 0.0
        else:
            excess = oxygen_pct - loc_pred
            # Natural buoyancy/ambient baseline adjustment
            if grav_norm == "normal" and airflow_cm_s == 0:
                base_risk = 35.0 + (excess * 1.5) + (spread_rate * 2.5)
            else:
                base_risk = 45.0 + (excess * 1.8) + (spread_rate * 5.0)

            # Exploration atmospheres (Artemis lunar base 34% O2, 10.2 psi)
            if oxygen_pct >= 30.0 and pressure_psi <= 11.0:
                base_risk += 18.0
            # 100% O2 pure oxygen (EVA spacesuit)
            if oxygen_pct >= 85.0:
                base_risk = 100.0

            ignition_risk_score = min(100.0, max(10.0, round(base_risk, 1)))

        # Risk level classification thresholds
        if ignition_risk_score >= 80.0:
            risk_level = "CRITICAL"
            risk_explanation = "Immediate catastrophic ignition and runaway flame propagation hazard. Atmospheric oxygen heavily exceeds Limiting Oxygen Concentration."
        elif ignition_risk_score >= 60.0:
            risk_level = "HIGH"
            risk_explanation = "Atmosphere sustains rapid flame spread over materials. Forced ventilation currents actively drive fire growth."
        elif ignition_risk_score >= 35.0:
            risk_level = "MODERATE"
            risk_explanation = "Near flammability threshold. Localized ignition possible, but self-extinction can occur under stagnant ventilation."
        else:
            risk_level = "LOW"
            risk_explanation = "Atmospheric conditions are below the Limiting Oxygen Concentration (LOC). Material will self-extinguish due to radiative cooling."

        is_in_bounds = (
            14.0 <= oxygen_pct <= 85.0 and
            4.3 <= pressure_psi <= 14.7 and
            0.0 <= airflow_cm_s <= 35.0 and
            1.0 <= sample_thickness_mm <= 10.0
        )
        confidence = "High — within experimental PSI training envelope" if is_in_bounds else "Extrapolation — beyond standard tested flight conditions"

        supporting_investigations = self._get_supporting_investigations(mat_norm, oxygen_pct, pressure_psi, airflow_cm_s, grav_norm)

        return {
            "inputs": {
                "material_type": mat_norm,
                "oxygen_pct": oxygen_pct,
                "pressure_psi": pressure_psi,
                "airflow_cm_s": airflow_cm_s,
                "sample_thickness_mm": sample_thickness_mm,
                "gravity_level": grav_norm
            },
            "predictions": {
                "loc_predicted": loc_pred,
                "ignition_risk_score": ignition_risk_score,
                "flame_spread_rate": spread_rate,
                "soot_yield": soot_yield,
                "risk_level": risk_level,
                "risk_explanation": risk_explanation,
                "confidence": confidence
            },
            "supporting_investigations": supporting_investigations
        }

    def _get_supporting_investigations(self, material: str, o2: float, pressure: float, airflow: float, gravity: str) -> List[Dict[str, str]]:
        cites = []
        if material in ["fabric", "plastic"] or o2 >= 30.0:
            cites.append({
                "name": "BASS & BASS-II",
                "finding": f"Tested solid {material} flammability and gaseous extinction under forced airflow (1-30 cm/s), establishing real microgravity LOC boundaries."
            })
        if pressure <= 11.0 or o2 >= 30.0:
            cites.append({
                "name": "ACME - BRE",
                "finding": "Directly tested exploration atmospheres (up to 35% O₂ at 10.2 psi) to map solid burning rates and narrow extinction margins."
            })
        if airflow >= 10.0 or material in ["fabric", "plastic"]:
            cites.append({
                "name": "Saffire-I/II/III",
                "finding": "Large-scale flame spread tests aboard Cygnus verified steady flame propagation and heavy CO/soot yields in spacecraft ducts."
            })
        if len(cites) < 3:
            cites.append({
                "name": "SAME / SAME-R",
                "finding": "Provided baseline optical soot yield and particle agglomeration measurements for overheated materials in microgravity."
            })
        return cites[:3]

ml_service = FlammabilityMLService()
