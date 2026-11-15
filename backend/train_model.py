import json
import pickle
import os
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor

MATERIAL_TYPES = ['fabric', 'plastic', 'composite', 'wire_insulation', 'silicone']
GRAVITY_LEVELS = ['microgravity', 'partial', 'normal']

def train():
    data_file = 'backend/data/grounded_training_data.json'
    print(f"Loading resource dataset from {data_file}...")
    with open(data_file, 'r', encoding='utf-8') as f:
        records = json.load(f)

    print(f"Total training points extracted from provided NASA resources: {len(records)}")

    X = []
    y = []

    for r in records:
        mat_idx = MATERIAL_TYPES.index(r['material_type'])
        grav_idx = GRAVITY_LEVELS.index(r['gravity_level'])
        X.append([
            mat_idx,
            grav_idx,
            r['oxygen_pct'],
            r['pressure_psi'],
            r['airflow_cm_s'],
            r['sample_thickness_mm']
        ])
        y.append([
            r['loc_predicted'],
            r['flame_spread_rate'],
            r['soot_yield']
        ])

    X = np.array(X)
    y = np.array(y)

    print(f"Training MultiOutputRegressor(GradientBoostingRegressor) on shape: {X.shape} -> {y.shape}...")
    base_gbr = GradientBoostingRegressor(
        n_estimators=140,
        learning_rate=0.07,
        max_depth=4,
        random_state=42
    )
    model = MultiOutputRegressor(base_gbr)
    model.fit(X, y)

    # Calculate training R2 score
    score = model.score(X, y)
    print(f"Model Training R^2 Score across all 3 targets: {score:.4f}")

    os.makedirs('backend/models', exist_ok=True)
    out_path = 'backend/models/flammability_model.pkl'
    with open(out_path, 'wb') as f:
        pickle.dump({
            'model': model,
            'materials': MATERIAL_TYPES,
            'gravity_levels': GRAVITY_LEVELS,
            'features': ['material_type', 'gravity_level', 'oxygen_pct', 'pressure_psi', 'airflow_cm_s', 'sample_thickness_mm'],
            'r2_score': score,
            'samples_trained': len(records),
            'source': 'NASA Physical Sciences Informatics (PSI) & ISS Combustion Science Guide'
        }, f)

    print(f"Trained model saved to {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")

if __name__ == '__main__':
    train()
