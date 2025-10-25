import os
from typing import List, Dict, Any
import requests

class WeatherClient:
    """
    Visual Crossing Timeline API client. Falls back to neutral values if missing.
    """

    def __init__(self):
        self.api_key = os.getenv('VISUAL_CROSSING_API_KEY', '')

    def fetch_for_segments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        for idx, seg in enumerate(segments):
            lat = seg['start']['lat']
            lng = seg['start']['lng']
            rows.append(self._fetch_point(lat, lng, idx))
        return rows

    def _fetch_point(self, lat: float, lng: float, segment_index: int) -> Dict[str, Any]:
        if not self.api_key:
            return self._neutral(segment_index)
        try:
            location = f"{lat},{lng}"
            url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{location}"
            params = { 'unitGroup': 'metric', 'key': self.api_key, 'contentType': 'json', 'include': 'current' }
            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            current = data.get('currentConditions', {})
            return {
                'segment_index': segment_index,
                'precip_mm': float(current.get('precip', 0.0) or 0.0),
                'visibility_km': float(current.get('visibility', 10.0) or 10.0),
                'temp_c': float(current.get('temp', 20.0) or 20.0),
                'conditions': str(current.get('conditions', '') or ''),
                'wind_kph': float(current.get('windspeed', 5.0) or 5.0),
            }
        except Exception:
            return self._neutral(segment_index)

    def _neutral(self, segment_index: int) -> Dict[str, Any]:
        return {
            'segment_index': segment_index,
            'precip_mm': 0.0,
            'visibility_km': 10.0,
            'temp_c': 20.0,
            'conditions': '',
            'wind_kph': 5.0,
        }




