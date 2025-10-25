from typing import List, Dict, Any
import math
import random
import os
import pandas as pd

class TrafficDataProvider:
    """
    Demo provider that synthesizes traffic segment features for each route segment.
    Replace with real datasource joins (e.g., map-matched traffic segments).
    """

    def __init__(self):
        dataset_path_env = os.getenv('accident_prediction_india.csv', '')
        default_path = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'dataset', 'accident_prediction_india.csv'))
        self.dataset_path = dataset_path_env or default_path
        self.df = None
        if os.path.exists(self.dataset_path):
            try:
                self.df = pd.read_csv(self.dataset_path)
            except Exception:
                self.df = None

    def fetch_segments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        for idx, seg in enumerate(segments):
            lat1, lng1 = seg['start']['lat'], seg['start']['lng']
            lat2, lng2 = seg['end']['lat'], seg['end']['lng']
            dist_km = self._haversine_km(lat1, lng1, lat2, lng2)

            # Default synthetic values in case dataset missing
            base = {
                'segment_index': idx,
                'length_km': dist_km,
                'avg_speed_kmh': max(10, random.gauss(40, 10)),
                'traffic_density': min(1.0, max(0.0, random.random() * 1.0)),
                'accident_count': max(0, int(random.gauss(0.8, 1.0))),
                'road_type': random.choice(['highway', 'arterial', 'residential']),
                'heavy_vehicle_pct': min(100.0, max(0.0, random.gauss(12.0, 5.0))),
            }

            if self.df is not None and {'lat', 'lon'}.issubset(self.df.columns):
                try:
                    # Find nearest dataset row to segment start
                    lat = lat1
                    lon = lng1
                    # Approx quick distance (not exact haversine for speed) for filtering
                    candidates = self.df.copy()
                    candidates['d'] = ((candidates['lat'] - lat).abs() + (candidates['lon'] - lon).abs())
                    nearest = candidates.nsmallest(1, 'd').iloc[0]
                    base['avg_speed_kmh'] = float(nearest.get('avg_speed', base['avg_speed_kmh']))
                    base['traffic_density'] = float(nearest.get('traffic_density', base['traffic_density']))
                    base['accident_count'] = float(nearest.get('accident_count', base['accident_count']))
                    # Normalize/clean road type
                    rt = str(nearest.get('road_type', base['road_type'])).strip().lower()
                    if rt not in ['residential', 'arterial', 'highway']:
                        # coarse mapping if needed
                        if 'highway' in rt or 'nh' in rt:
                            rt = 'highway'
                        elif 'arterial' in rt or 'main' in rt:
                            rt = 'arterial'
                        else:
                            rt = 'residential'
                    base['road_type'] = rt
                    base['heavy_vehicle_pct'] = float(nearest.get('heavy_vehicle_pct', base['heavy_vehicle_pct']))
                except Exception:
                    pass

            rows.append(base)
        return rows

    def _haversine_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c



