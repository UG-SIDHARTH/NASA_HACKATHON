import numpy as np
import pickle
import os
import json
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor

# Set seed for reproducible training
np.random.seed(42)

# Categorical encodings
MATERIAL_TYPES = ['fabric', 'plastic', 'composite', 'wire_insulation', 'silicone']
GRAVITY_LEVELS = ['microgravity', 'partial', 'normal']

# Base physical constants per material based on NASA BASS / Saffire / ACME data
MATERIAL_PROPERTIES = {
    'fabric': {'base_loc': 15.5, 'base_spread': 1.8, 'soot_base': 0.45},
    'plastic': {'base_loc': 17.5, 'base_spread': 0.9, 'soot_base': 0.70},
    'composite': {'base_loc': 19.0, 'base_spread': 0.6, 'soot_base': 0.55},
    'wire_insulation': {'base_loc': 20.5, 'base_spread': 0.7, 'soot_base': 0.80},
    'silicone': {'base_loc': 16.8, 'base_spread': 1.1, 'soot_base': 0.60}
}

GRAVITY_MULTIPLIERS = {
    'microgravity': {'loc_adj': -0.8, 'spread_mod': 1.3, 'soot_mod': 1.4},
    'partial': {'loc_adj': -0.4, 'spread_mod': 1.1, 'soot_mod': 1.2},
    'normal': {'loc_adj': 0.0, 'spread_mod': 1.0, 'soot_mod': 1.0}
}

def generate_synthetic_data(n_samples=1200):
    X = []
    y = []

    for _ in range(n_samples):
        # Sample realistic environmental ranges from NASA PSI investigations
        mat_idx = np.random.randint(0, len(MATERIAL_TYPES))
        grav_idx = np.random.randint(0, len(GRAVITY_LEVELS))
        
        mat = MATERIAL_TYPES[mat_idx]
        grav = GRAVITY_LEVELS[grav_idx]
        
        # Environmental conditions
        o2 = np.random.uniform(14.0, 100.0)
        # Pressure psi (biased towards 4.3, 8.2, 10.2, 14.7)
        if np.random.rand() < 0.4:
            pressure = np.random.choice([4.3, 8.2, 10.2, 14.7]) + np.random.uniform(-0.2, 0.2)
        else:
            pressure = np.random.uniform(4.0, 15.0)
            
        airflow = np.random.uniform(0.0, 35.0)
        thickness = np.random.uniform(1.0, 10.0)

        # Physics formulation based on NASA combustion science
        mat_prop = MATERIAL_PROPERTIES[mat]
        grav_mod = GRAVITY_MULTIPLIERS[grav]

        # 1. Limiting Oxygen Concentration (LOC)
        # Higher pressure -> slightly lower LOC; Thicker sample -> higher LOC (+0.6 per mm)
        # In microgravity, low airflow provides oxidizer without convective cooling -> lowers LOC
        p_factor = (14.7 / max(pressure, 3.5))**0.12
        flow_loc_effect = -1.2 if (0.5 <= airflow <= 15.0 and grav != 'normal') else (airflow - 20.0) * 0.05 if airflow > 20.0 else 0.0
        thickness_loc_effect = (thickness - 2.0) * 0.55
        
        loc = (mat_prop['base_loc'] * p_factor) + grav_mod['loc_adj'] + flow_loc_effect + thickness_loc_effect
        loc += np.random.normal(0, 0.4)
        loc = float(np.clip(loc, 10.0, 35.0))

        # 2. Flame Spread Rate (mm/s)
        # If O2 < LOC -> flame cannot spread (spread_rate = 0)
        if o2 < loc:
            spread_rate = 0.0
        else:
            o2_excess = (o2 - loc)
            # In microgravity, flow up to 15-20 cm/s accelerates spread (BASS / Saffire findings)
            if grav == 'microgravity':
                if airflow < 1.0:
                    flow_spread_mult = 0.25 # quiescent, diffusion-choked
                elif airflow <= 20.0:
                    flow_spread_mult = 0.5 + np.sqrt(airflow) * 0.35
                else:
                    flow_spread_mult = 0.5 + np.sqrt(20.0) * 0.35 - (airflow - 20.0) * 0.02
            else:
                flow_spread_mult = 0.8 + np.sqrt(max(airflow, 0.1)) * 0.25

            # Thinner fuels spread faster (thermal thickness inverse relationship)
            thickness_spread_mult = (3.0 / max(thickness, 1.0))**0.4
            
            spread_rate = mat_prop['base_spread'] * (1.0 + (o2_excess / 12.0)**1.2) * flow_spread_mult * thickness_spread_mult * grav_mod['spread_mod']
            spread_rate += np.random.normal(0, 0.08)
            spread_rate = float(max(0.0, spread_rate))

        # 3. Soot Yield Index (0 - 1)
        # Microgravity produces larger soot aggregates due to longer residence times (SAME / SAME-R data)
        soot = mat_prop['soot_base'] * grav_mod['soot_mod'] * (o2 / 25.0)**0.3 * (1.0 / (max(airflow, 1.0)**0.25))
        soot += np.random.normal(0, 0.03)
        soot = float(np.clip(soot, 0.05, 0.99))

        # Feature vector: [mat_idx, grav_idx, o2, pressure, airflow, thickness]
        X.append([mat_idx, grav_idx, o2, pressure, airflow, thickness])
        # Targets: [loc, flame_spread_rate, soot_yield]
        y.append([loc, spread_rate, soot])

    return np.array(X), np.array(y)

def train_and_save():
    print("Generating synthetic dataset from NASA PSI experimental bounds...")
    X, y = generate_synthetic_data(1200)

    print(f"Training Multi-Output Gradient Boosting Regressors on {len(X)} samples...")
    base_gbr = GradientBoostingRegressor(
        n_estimators=120,
        learning_rate=0.08,
        max_depth=4,
        random_state=42
    )
    model = MultiOutputRegressor(base_gbr)
    model.fit(X, y)

    os.makedirs("backend/models", exist_ok=True)
    model_path = "backend/models/flammability_model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump({
            "model": model,
            "materials": MATERIAL_TYPES,
            "gravity_levels": GRAVITY_LEVELS,
            "features": ["material_type", "gravity_level", "oxygen_pct", "pressure_psi", "airflow_cm_s", "sample_thickness_mm"]
        }, f)

    file_size_kb = os.path.getsize(model_path) / 1024
    print(f"Model successfully saved to {model_path} ({file_size_kb:.1f} KB)")

if __name__ == "__main__":
    train_and_save()
