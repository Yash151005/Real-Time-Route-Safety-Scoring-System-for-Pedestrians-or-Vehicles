from typing import Dict, Any
import folium


def _score_color(score: float) -> str:
    if score >= 4.0:
        return '#2ecc71'  # green
    if score >= 3.0:
        return '#f1c40f'  # yellow
    return '#e74c3c'      # red


def build_folium_map(segment_payload: Dict[str, Any]) -> str:
    """
    Build an HTML map for segments in the payload from /find_safe_route
    or /api/segment-safety.
    """
    start = segment_payload.get('start') or segment_payload.get('start_coordinates')
    if not start:
        # Fallback: try first segment start
        first = (segment_payload.get('segments') or segment_payload.get('route') or [])
        if first:
            start = first[0].get('start') or { 'lat': first[0].get('lat'), 'lng': first[0].get('lon') }

    center_lat = (start or {}).get('lat', 19.0)
    center_lng = (start or {}).get('lng', 73.0)
    m = folium.Map(location=[center_lat, center_lng], zoom_start=7)

    segments = segment_payload.get('segments') or segment_payload.get('route') or []
    for seg in segments:
        lat = seg.get('lat') or ((seg.get('start') or {}).get('lat'))
        lng = seg.get('lon') or ((seg.get('start') or {}).get('lng'))
        score = float(seg.get('safety_score', 3.0))
        folium.CircleMarker(
            location=[lat, lng],
            radius=5,
            color=_score_color(score),
            fill=True,
            fill_color=_score_color(score),
            popup=f"Segment {seg.get('segment_id', seg.get('segment_index', ''))}: {score}",
        ).add_to(m)

    return m._repr_html_()


