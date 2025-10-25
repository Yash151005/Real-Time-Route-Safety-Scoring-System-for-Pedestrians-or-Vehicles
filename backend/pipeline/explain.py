from typing import Dict, Tuple

from .model import SafetyModel
from .features import WEATHER_FEATURES, ACCIDENT_FEATURES


def calculate_feature_impact(model: SafetyModel) -> Dict[str, float]:
    """
    Calculate weather_impact and accident_impact percentages from model feature importances.
    Returns values that sum to 100.0.
    """
    fi = model.feature_importances()
    if not fi:
        # Neutral split if importances unavailable
        return { 'weather_impact': 50.0, 'accident_impact': 50.0 }

    weather_sum = sum(fi.get(f, 0.0) for f in WEATHER_FEATURES)
    accident_sum = sum(fi.get(f, 0.0) for f in ACCIDENT_FEATURES)

    total = weather_sum + accident_sum
    if total <= 0:
        return { 'weather_impact': 50.0, 'accident_impact': 50.0 }

    weather_pct = round((weather_sum / total) * 100.0, 2)
    accident_pct = round(100.0 - weather_pct, 2)
    return { 'weather_impact': weather_pct, 'accident_impact': accident_pct }


def predict_safety_score(model: SafetyModel, features_row) -> float:
    """
    Predict a single safety score given the model and a one-row feature frame/array.
    Caller should provide a pandas DataFrame with a single row or a numpy array.
    """
    import numpy as np
    import pandas as pd

    if hasattr(features_row, 'shape') and len(getattr(features_row, 'shape')) == 2 and features_row.shape[0] == 1:
        preds = model.predict(features_row)
        return float(np.clip(preds[0], 1.0, 5.0))

    # Try to coerce to 2D
    if isinstance(features_row, (list, tuple)):
        arr = np.array([features_row])
    elif isinstance(features_row, pd.Series):
        arr = features_row.to_frame().T.values
    else:
        arr = np.array(features_row).reshape(1, -1)
    preds = model.predict(arr)
    return float(np.clip(preds[0], 1.0, 5.0))


def calculate_feature_impact_for_row(model: SafetyModel, features_row: Dict[str, float]) -> Dict[str, float]:
    """
    Row-aware impact using magnitude-weighted importances: |x_i| * importance_i
    Normalized to 100%. Falls back to global importances if row missing.
    """
    fi = model.feature_importances()
    if not fi:
        return { 'weather_impact': 50.0, 'accident_impact': 50.0 }

    # Magnitude weighted contributions
    def contrib_sum(names):
        s = 0.0
        for n in names:
            w = fi.get(n, 0.0)
            x = float(features_row.get(n, 0.0))
            s += abs(x) * w
        return s

    weather_sum = contrib_sum(WEATHER_FEATURES)
    accident_sum = contrib_sum(ACCIDENT_FEATURES)

    total = weather_sum + accident_sum
    if total <= 0:
        return calculate_feature_impact(model)

    weather_pct = round((weather_sum / total) * 100.0, 2)
    accident_pct = round(100.0 - weather_pct, 2)
    return { 'weather_impact': weather_pct, 'accident_impact': accident_pct }


