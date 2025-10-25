from typing import List, Dict, Any
import pandas as pd

ROAD_TYPE_ORDER = ['residential', 'arterial', 'highway']

def build_segment_features(traffic_rows: List[Dict[str, Any]], weather_rows: List[Dict[str, Any]]) -> pd.DataFrame:
    traffic_df = pd.DataFrame(traffic_rows).set_index('segment_index')
    weather_df = pd.DataFrame(weather_rows).set_index('segment_index')

    # Align indexes and combine
    df = traffic_df.join(weather_df, how='left').fillna({
        'precip_mm': 0.0,
        'visibility_km': 10.0,
        'temp_c': 20.0,
        'conditions': '',
        'wind_kph': 5.0,
    })

    # Encode road_type ordinally
    df['road_type_ord'] = df['road_type'].map({v: i for i, v in enumerate(ROAD_TYPE_ORDER)}).fillna(1)

    # Basic engineered features
    df['speed_ratio'] = (df['avg_speed_kmh'] / 60.0).clip(0.0, 2.0)
    df['density_x_heavy'] = df['traffic_density'] * (df['heavy_vehicle_pct'] / 100.0)
    df['precip_flag'] = (df['precip_mm'] > 0.2).astype(int)
    df['low_visibility_flag'] = (df['visibility_km'] < 4.0).astype(int)
    df['wind_flag'] = (df['wind_kph'] > 25.0).astype(int)

    # Select model features
    feature_cols = [
        'length_km',
        'avg_speed_kmh',
        'traffic_density',
        'accident_count',
        'heavy_vehicle_pct',
        'road_type_ord',
        'precip_mm',
        'visibility_km',
        'temp_c',
        'wind_kph',
        'speed_ratio',
        'density_x_heavy',
        'precip_flag',
        'low_visibility_flag',
        'wind_flag',
    ]

    return df[feature_cols]


WEATHER_FEATURES = [
    'precip_mm', 'visibility_km', 'temp_c', 'wind_kph',
    'precip_flag', 'low_visibility_flag', 'wind_flag'
]

ACCIDENT_FEATURES = [
    'length_km', 'avg_speed_kmh', 'traffic_density', 'accident_count',
    'heavy_vehicle_pct', 'road_type_ord', 'speed_ratio', 'density_x_heavy'
]




