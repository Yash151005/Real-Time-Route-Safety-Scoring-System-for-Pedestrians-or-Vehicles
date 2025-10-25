from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Any, List
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor


MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'safety_model.pkl')
MODEL_PATH = os.path.normpath(MODEL_PATH)


def _compute_proxy_target(features_df: pd.DataFrame) -> np.ndarray:
    """
    Build a proxy safety score target in range ~[1, 5]. Lower risk -> higher score.
    Uses weighted combination of key risk features.
    """
    # Normalize inputs with safe defaults
    precip = features_df.get('precip_mm', pd.Series(0.0, index=features_df.index)).clip(lower=0, upper=20)
    visibility = features_df.get('visibility_km', pd.Series(10.0, index=features_df.index)).clip(lower=0.1, upper=10)
    traffic_density = features_df.get('traffic_density', pd.Series(0.5, index=features_df.index)).clip(lower=0, upper=1)
    accident_count = features_df.get('accident_count', pd.Series(0.0, index=features_df.index)).clip(lower=0)

    # Risk increases with precip, accident_count, traffic_density, and low visibility
    risk = (
        0.35 * (precip / 10.0) +
        0.30 * traffic_density +
        0.25 * (accident_count / (1.0 + accident_count)) +
        0.10 * ((10.0 - visibility) / 10.0)
    )
    risk = risk.clip(lower=0, upper=1.5)

    # Convert risk to safety score (1..5)
    safety = 5.0 - 3.0 * risk
    return safety.to_numpy()


@dataclass
class SafetyModel:
    model: RandomForestRegressor
    feature_names: List[str]

    @classmethod
    def load_or_train(cls, features_df: pd.DataFrame) -> 'SafetyModel':
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            return cls(model=model, feature_names=list(features_df.columns))

        # Train a model on proxy target derived from the same features
        y = _compute_proxy_target(features_df)
        model = RandomForestRegressor(
            n_estimators=150,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        model.fit(features_df.values, y)
        joblib.dump(model, MODEL_PATH)
        return cls(model=model, feature_names=list(features_df.columns))

    def predict(self, features_df: pd.DataFrame) -> np.ndarray:
        preds = self.model.predict(features_df.values)
        # Clamp into [1, 5] range and round to one decimal later by caller
        return np.clip(preds, 1.0, 5.0)

    def feature_importances(self) -> Dict[str, float]:
        importances = list(getattr(self.model, 'feature_importances_', []))
        if not importances or not self.feature_names or len(importances) != len(self.feature_names):
            return {}
        return { name: float(w) for name, w in zip(self.feature_names, importances) }


