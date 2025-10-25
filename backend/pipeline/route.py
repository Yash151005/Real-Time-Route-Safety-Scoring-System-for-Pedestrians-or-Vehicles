from typing import Dict, Any, List, Optional
import requests

NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"
OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving"


def geocode_location(location_name: str) -> Optional[Dict[str, float]]:
    try:
        params = { 'q': location_name, 'format': 'json', 'limit': 1, 'countrycodes': 'in' }
        headers = { 'User-Agent': 'SafeRoute-API/1.0' }
        response = requests.get(NOMINATIM_BASE_URL, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data:
            result = data[0]
            return {
                'lat': float(result['lat']),
                'lng': float(result['lon']),
            }
        return None
    except Exception:
        return None


def osrm_route_coordinates(start: Dict[str, float], end: Dict[str, float]) -> List[Dict[str, float]]:
    try:
        url = f"{OSRM_BASE_URL}/{start['lng']},{start['lat']};{end['lng']},{end['lat']}"
        params = { 'overview': 'full', 'geometries': 'geojson', 'alternatives': 'false', 'steps': 'false' }
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        coords = data.get('routes', [{}])[0].get('geometry', {}).get('coordinates', [])
        return [ {'lat': c[1], 'lng': c[0]} for c in coords ]
    except Exception:
        return []


