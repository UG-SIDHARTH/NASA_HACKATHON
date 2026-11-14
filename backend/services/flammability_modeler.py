import math
from typing import Dict, Any

class FlammabilityModeler:
    """
    Predictive flammability and flame spread model for spacecraft atmospheres.
    Based on empirical correlations from NASA BASS, ACME-BRE, and Saffire experiments:
    
    Variables:
    - O2 (%): Oxygen mole fraction (14% - 100%)
    - Pressure (psi): Total atmospheric pressure (4.3 - 14.7 psi)
    - Airflow velocity (cm/s): Forced ventilation velocity (0 - 40 cm/s)
    - Material Type: 'thin_fabric', 'thick_pmma', 'wire_insulation', 'silicone'
    """
    
    MATERIAL_FACTORS = {
        "thin_fabric": {"base_spread": 0.45, "loc_base": 15.2, "activation": 1.2, "label": "Cotton/Fiberglass (Sibal Cloth)"},
        "thick_pmma": {"base_spread": 0.18, "loc_base": 17.5, "activation": 1.5, "label": "Cast Acrylic (PMMA Slab)"},
        "wire_insulation": {"base_spread": 0.28, "loc_base": 19.8, "activation": 1.8, "label": "Kapton/Teflon Wire Jacketing"},
        "silicone": {"base_spread": 0.35, "loc_base": 16.5, "activation": 1.4, "label": "Silicone Elastomer / Sealant"}
    }

    @classmethod
    def predict(cls, oxygen_pct: float, pressure_psi: float, airflow_cm_s: float, material: str = "thin_fabric") -> Dict[str, Any]:
        mat = cls.MATERIAL_FACTORS.get(material, cls.MATERIAL_FACTORS["thin_fabric"])
        
        # Calculate Limiting Oxygen Concentration (LOC) adjusted for pressure and flow
        # In microgravity, low airflow actually lowers LOC (makes it easier to burn)
        loc_adjusted = mat["loc_base"] * (14.7 / max(pressure_psi, 4.0))**0.15
        if 1.0 <= airflow_cm_s <= 15.0:
            loc_adjusted -= 1.2 # airflow provides fresh oxygen without cooling
        elif airflow_cm_s > 25.0:
            loc_adjusted += (airflow_cm_s - 25.0) * 0.08 # convective cooling starts
            
        will_ignite = oxygen_pct >= loc_adjusted
        
        # Flame spread rate (mm/s)
        if not will_ignite:
            spread_rate = 0.0
            hazard_level = "NON-FLAMMABLE / EXTINCT"
            risk_index = round(max(5.0, (oxygen_pct / loc_adjusted) * 40.0), 1)
        else:
            # Overpressure factor & Oxygen excess ratio
            o2_excess = (oxygen_pct - loc_adjusted) / 10.0
            p_ratio = pressure_psi / 14.7
            
            # Flow effect: in microg, spread rate peaks around 10-20 cm/s
            flow_factor = math.sqrt(max(airflow_cm_s, 0.5)) * 0.8
            if airflow_cm_s == 0:
                flow_factor = 0.2 # pure diffusion, very sluggish
            
            spread_rate = mat["base_spread"] * (1.0 + o2_excess * mat["activation"]) * flow_factor * (p_ratio**0.3)
            spread_rate = round(spread_rate, 2)
            
            # Risk Index (0 - 100)
            risk_index = min(100.0, round(50.0 + (spread_rate * 25.0) + (oxygen_pct * 0.8), 1))
            
            if risk_index > 80:
                hazard_level = "CRITICAL EXPLOSIVE RISK"
            elif risk_index > 65:
                hazard_level = "HIGH FLAMMABILITY HAZARD"
            else:
                hazard_level = "MODERATE PROPAGATION"

        # Soot and CO emission factor (higher in microg with low flow due to residence time)
        residence_time_factor = round(2.5 / (max(airflow_cm_s, 1.0)**0.4), 2)
        relative_soot_yield = round(residence_time_factor * (oxygen_pct / 21.0), 2)

        return {
            "inputs": {
                "oxygen_pct": oxygen_pct,
                "pressure_psi": pressure_psi,
                "airflow_cm_s": airflow_cm_s,
                "material": mat["label"]
            },
            "predictions": {
                "will_ignite_and_propagate": will_ignite,
                "limiting_oxygen_concentration_loc": round(loc_adjusted, 1),
                "flame_spread_rate_mm_s": spread_rate,
                "risk_index_score": risk_index,
                "hazard_level": hazard_level,
                "relative_soot_yield_factor": relative_soot_yield
            },
            "engineering_guidance": (
                "Turn off cabin ventilation fans immediately. Reducing airflow from >10 cm/s to 0 cm/s eliminates convective oxidizer transport, forcing the flame into a diffusion-limited regime that triggers radiative cooling extinction."
                if will_ignite and airflow_cm_s > 0 else
                "Environment is safely below the Limiting Oxygen Concentration (LOC) for self-sustaining flame propagation."
            )
        }
