import os
import random
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
import numpy as np
from joblib import dump, load

# Local pipeline modules (created below)
try:
    from pipeline.route import geocode_location, osrm_route_coordinates
    from pipeline.traffic import TrafficDataProvider
    from pipeline.weather import WeatherClient
    from pipeline.features import build_segment_features
    from pipeline.model import SafetyModel
    from pipeline.viz import build_folium_map
    from pipeline.explain import calculate_feature_impact, predict_safety_score, calculate_feature_impact_for_row
except Exception:
    # Defer import errors during app startup; endpoints will validate availability
    geocode_location = None
    osrm_route_coordinates = None
    TrafficDataProvider = None
    WeatherClient = None
    build_segment_features = None
    SafetyModel = None
    build_folium_map = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# API Configuration
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"
OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving"

# Risk factors and their impact on safety score
RISK_FACTORS = [
    "High traffic density",
    "Rainy weather", 
    "Low lighting",
    "Accident-prone area",
    "Steep turns",
    "Bad road condition",
    "Construction zone",
    "School zone",
    "Heavy vehicle traffic",
    "Poor visibility"
]

RISK_IMPACT = {
    "High traffic density": 15,
    "Rainy weather": 10,
    "Low lighting": 8,
    "Accident-prone area": 20,
    "Steep turns": 12,
    "Bad road condition": 18,
    "Construction zone": 14,
    "School zone": 5,
    "Heavy vehicle traffic": 13,
    "Poor visibility": 16
}

def geocode_location(location_name):
    """
    Convert location name to coordinates using Nominatim API
    """
    try:
        params = {
            'q': location_name,
            'format': 'json',
            'limit': 1,
            'countrycodes': 'in'  # Restrict to India
        }
        
        headers = {
            'User-Agent': 'SafeRoute-API/1.0'
        }
        
        response = requests.get(NOMINATIM_BASE_URL, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if data and len(data) > 0:
            result = data[0]
            return {
                'lat': float(result['lat']),
                'lng': float(result['lon']),
                'display_name': result.get('display_name', location_name)
            }
        return None
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Geocoding error for {location_name}: {str(e)}")
        return None
    except (ValueError, KeyError) as e:
        logger.error(f"Geocoding parsing error for {location_name}: {str(e)}")
        return None

def fetch_routes(start_coords, end_coords):
    """
    Fetch multiple route alternatives using OSRM API
    """
    try:
        url = f"{OSRM_BASE_URL}/{start_coords['lng']},{start_coords['lat']};{end_coords['lng']},{end_coords['lat']}"
        
        params = {
            'overview': 'full',
            'geometries': 'geojson',
            'alternatives': 'true',
            'steps': 'false'
        }
        
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        if 'routes' in data and len(data['routes']) > 0:
            return data['routes'][:3]  # Return up to 3 routes
        return []
        
    except requests.exceptions.RequestException as e:
        logger.error(f"OSRM routing error: {str(e)}")
        return []
    except (ValueError, KeyError) as e:
        logger.error(f"OSRM parsing error: {str(e)}")
        return []

def generate_risk_factors():
    """
    Generate random risk factors for a route
    """
    num_factors = random.randint(2, 4)
    return random.sample(RISK_FACTORS, num_factors)

def calculate_safety_score(risk_factors):
    """
    Calculate safety score based on risk factors
    """
    base_score = 100
    
    for factor in risk_factors:
        if factor in RISK_IMPACT:
            base_score -= RISK_IMPACT[factor]
    
    # Add some randomness (±5 points)
    base_score += random.randint(-5, 5)
    
    # Ensure score is between 30 and 95
    return max(30, min(95, base_score))

def generate_reason(risk_factors, safety_score):
    """
    Generate a human-readable reason based on risk factors
    """
    if safety_score >= 80:
        return f"Excellent route with minimal risks. {', '.join(risk_factors[:2]) if len(risk_factors) >= 2 else 'Clear conditions'} detected but manageable."
    elif safety_score >= 65:
        return f"Good route with moderate concerns. Watch out for {', '.join(risk_factors[:2])} along this path."
    else:
        return f"Route requires caution due to {', '.join(risk_factors[:3])}. Consider alternative if possible."

def process_route_data(routes, start_name, end_name):
    """
    Process OSRM route data and add safety information
    """
    processed_routes = []
    route_names = ['A', 'B', 'C']
    
    for i, route in enumerate(routes):
        try:
            # Extract coordinates
            coordinates = []
            if 'geometry' in route and 'coordinates' in route['geometry']:
                for coord in route['geometry']['coordinates']:
                    coordinates.append({
                        'lat': coord[1],
                        'lng': coord[0]
                    })
            
            # Generate safety data
            risk_factors = generate_risk_factors()
            safety_score = calculate_safety_score(risk_factors)
            reason = generate_reason(risk_factors, safety_score)
            
            # Calculate distance and duration
            distance = round(route.get('distance', 0) / 1000, 1)  # Convert to km
            duration = round(route.get('duration', 0) / 60)  # Convert to minutes
            
            processed_route = {
                'id': route_names[i] if i < len(route_names) else f'Route_{i+1}',
                'coordinates': coordinates,
                'safety_score': safety_score,
                'risk_factors': risk_factors,
                'reason': reason,
                'distance_km': distance,
                'duration_minutes': duration,
                'start_location': start_name,
                'end_location': end_name
            }
            
            processed_routes.append(processed_route)
            
        except (KeyError, ValueError) as e:
            logger.error(f"Error processing route {i}: {str(e)}")
            continue
    
    return processed_routes


@app.route('/find_safe_route', methods=['POST'])
def find_safe_route():
    """
    POST body: { "start": "Pune", "end": "Mumbai", "generate_map": true }
    Returns per-segment safety scores and average as specified.
    """
    try:
        payload = request.get_json(force=True, silent=True) or {}
        start = payload.get('start')
        end = payload.get('end')
        generate_map = bool(payload.get('generate_map', False))
        if not start or not end:
            return jsonify({ 'error': 'start and end are required' }), 400

        # Geocode
        start_coords = geocode_location(start) if geocode_location else None
        end_coords = geocode_location(end) if geocode_location else None
        if not start_coords or not end_coords:
            return jsonify({ 'error': 'Could not geocode start or end' }), 404

        # Get polyline coordinates for main route
        coords = osrm_route_coordinates(start_coords, end_coords) if osrm_route_coordinates else []
        if len(coords) < 2:
            return jsonify({ 'error': 'No route geometry available' }), 404

        # Build segments as consecutive point pairs (thinning to ~every 5th point for efficiency)
        step = max(1, len(coords) // 50)
        sampled = coords[::step]
        if sampled[-1] != coords[-1]:
            sampled.append(coords[-1])
        segments = []
        for i in range(len(sampled) - 1):
            segments.append({ 'start': sampled[i], 'end': sampled[i+1] })

        # Fetch traffic + weather
        traffic = TrafficDataProvider()
        weather = WeatherClient()
        traffic_rows = traffic.fetch_segments(segments)
        weather_rows = weather.fetch_for_segments(segments)

        # Build features and score
        features_df = build_segment_features(traffic_rows, weather_rows)
        model = SafetyModel.load_or_train(features_df)
        preds = model.predict(features_df)

        # Assemble response
        route_items = []
        for idx, seg in enumerate(segments):
            w = next((w for w in weather_rows if w['segment_index'] == idx), None) or {}
            t = next((t for t in traffic_rows if t['segment_index'] == idx), None) or {}
            # Build one-row feature dict for explainability
            feat_row = features_df.iloc[idx].to_dict()
            # Qualitative factors
            rain = 'none'
            if w.get('precip_mm', 0) > 10:
                rain = 'heavy'
            elif w.get('precip_mm', 0) > 2:
                rain = 'moderate'
            visibility_label = 'good'
            if w.get('visibility_km', 10) < 2:
                visibility_label = 'very low'
            elif w.get('visibility_km', 10) < 5:
                visibility_label = 'low'
            traffic_label = 'low'
            if t.get('traffic_density', 0) > 0.7:
                traffic_label = 'high'
            elif t.get('traffic_density', 0) > 0.4:
                traffic_label = 'moderate'

            impacts_row = calculate_feature_impact_for_row(model, feat_row)

            route_items.append({
                'segment_id': idx + 1,
                'lat': seg['start']['lat'],
                'lon': seg['start']['lng'],
                'safety_score': round(float(preds[idx]), 1),
                'factors': {
                    'rain': rain,
                    'visibility': visibility_label,
                    'traffic_density': traffic_label,
                },
                'explanation': {
                    'weather_impact': impacts_row.get('weather_impact', 50.0),
                    'accident_impact': impacts_row.get('accident_impact', 50.0)
                }
            })

        avg_score = round(float(sum(x['safety_score'] for x in route_items) / len(route_items)), 1)

        # High-level explanation for the entire route using feature importances
        impacts = calculate_feature_impact(model)

        resp = {
            'route': route_items,
            'average_safety_score': avg_score,
            'explanation': {
                'weather_impact': impacts.get('weather_impact', 50.0),
                'accident_impact': impacts.get('accident_impact', 50.0)
            }
        }

        if generate_map:
            # Save map as HTML file
            html = build_folium_map({ 'segments': [
                { 'segment_index': r['segment_id'], 'start': { 'lat': r['lat'], 'lng': r['lon'] }, 'safety_score': r['safety_score'] }
                for r in route_items
            ], 'start': start_coords }) if build_folium_map else None
            try:
                out_path = os.path.join(os.path.dirname(__file__), 'route_safety_map.html')
                with open(out_path, 'w', encoding='utf-8') as f:
                    f.write(html or '')
                resp['map_file'] = 'backend/route_safety_map.html'
            except Exception:
                pass

        return jsonify(resp)
    except Exception as e:
        logger.error(f"find_safe_route error: {str(e)}")
        return jsonify({ 'error': 'Internal server error' }), 500

@app.route('/api/routes', methods=['GET'])
def get_routes():
    """
    Main API endpoint to get route alternatives with safety scores
    """
    try:
        # Get query parameters
        start = request.args.get('start')
        end = request.args.get('end')
        
        if not start or not end:
            return jsonify({
                'error': 'Missing required parameters: start and end'
            }), 400
        
        logger.info(f"Processing route request: {start} -> {end}")
        
        # Step 1: Geocode start and end locations
        start_coords = geocode_location(start)
        if not start_coords:
            return jsonify({
                'error': f'Could not find location: {start}'
            }), 404
        
        end_coords = geocode_location(end)
        if not end_coords:
            return jsonify({
                'error': f'Could not find location: {end}'
            }), 404
        
        logger.info(f"Geocoded: {start} -> {start_coords}, {end} -> {end_coords}")
        
        # Step 2: Fetch routes from OSRM
        routes = fetch_routes(start_coords, end_coords)
        if not routes:
            return jsonify({
                'error': 'No routes found between the specified locations'
            }), 404
        
        # Step 3: Process routes and add safety information
        processed_routes = process_route_data(routes, start, end)
        
        if not processed_routes:
            return jsonify({
                'error': 'Failed to process route data'
            }), 500
        
        # Step 4: Sort routes by safety score (highest first)
        processed_routes.sort(key=lambda x: x['safety_score'], reverse=True)
        
        # Step 5: Add recommendation
        best_route = processed_routes[0]
        recommendation = {
            'recommended_route': best_route['id'],
            'reason': f"Route {best_route['id']} has the highest safety score of {best_route['safety_score']}%"
        }
        
        logger.info(f"Successfully processed {len(processed_routes)} routes")
        
        return jsonify({
            'success': True,
            'routes': processed_routes,
            'recommendation': recommendation,
            'start_coordinates': start_coords,
            'end_coordinates': end_coords
        })
        
    except Exception as e:
        logger.error(f"Unexpected error in get_routes: {str(e)}")
        return jsonify({
            'error': 'Internal server error occurred'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'message': 'SafeRoute API is running'
    })

@app.route('/api/segment-safety', methods=['GET'])
def segment_safety():
    """
    Predict per-segment safety scores for a route and return GeoJSON-like data.

    Query params:
      - start: string (city/address) or "lat,lng"
      - end: string (city/address) or "lat,lng"
    """
    try:
        if geocode_location is None:
            return jsonify({'error': 'Pipeline modules not initialized'}), 500

        start = request.args.get('start')
        end = request.args.get('end')
        if not start or not end:
            return jsonify({'error': 'Missing required parameters: start and end'}), 400

        def parse_place(place: str):
            if ',' in place:
                try:
                    lat_str, lng_str = place.split(',', 1)
                    return { 'lat': float(lat_str.strip()), 'lng': float(lng_str.strip()) }
                except Exception:
                    pass
            return geocode_location(place)

        start_coords = parse_place(start)
        end_coords = parse_place(end)
        if not start_coords or not end_coords:
            return jsonify({'error': 'Could not geocode start or end'}), 404

        coordinates = osrm_route_coordinates(start_coords, end_coords)
        if not coordinates:
            return jsonify({'error': 'No route geometry available'}), 404

        # Build segment list (pair consecutive points)
        segments = []
        for i in range(len(coordinates) - 1):
            a = coordinates[i]
            b = coordinates[i + 1]
            segments.append({ 'start': a, 'end': b })

        traffic = TrafficDataProvider()
        weather = WeatherClient()
        traffic_rows = traffic.fetch_segments(segments)
        weather_rows = weather.fetch_for_segments(segments)

        features_df = build_segment_features(traffic_rows, weather_rows)

        model = SafetyModel.load_or_train(features_df)
        predictions = model.predict(features_df)

        # Assemble response with reasons
        feature_importances = model.feature_importances()
        results = []
        for idx, seg in enumerate(segments):
            score = float(predictions[idx])
            feat_row = features_df.iloc[idx].to_dict()
            # Pick top contributing positive risk features by magnitude
            contributions = sorted(
                [ (k, abs(feat_row.get(k, 0)) * feature_importances.get(k, 0)) for k in feature_importances.keys() ],
                key=lambda x: x[1], reverse=True
            )[:3]
            reasons = [f"{k.replace('_', ' ')}" for k, _ in contributions]
            results.append({
                'segment_index': idx,
                'start': seg['start'],
                'end': seg['end'],
                'safety_score': round(score, 1),
                'top_risk_factors': reasons
            })

        return jsonify({
            'start': start_coords,
            'end': end_coords,
            'segments': results
        })
    except Exception as e:
        logger.error(f"segment_safety error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/segment-safety/map', methods=['GET'])
def segment_safety_map():
    """
    Produce an interactive Folium map as HTML for the route with per-segment coloring.
    """
    try:
        start = request.args.get('start')
        end = request.args.get('end')
        if not start or not end:
            return jsonify({'error': 'Missing required parameters: start and end'}), 400

        # Reuse JSON endpoint to get data
        with app.test_request_context(f"/api/segment-safety?start={start}&end={end}"):
            json_resp = segment_safety()
        if isinstance(json_resp, tuple):
            body, status = json_resp
            if status != 200:
                return json_resp
            data = body.get_json()
        else:
            data = json_resp.get_json()

        html = build_folium_map(data)
        return html
    except Exception as e:
        logger.error(f"segment_safety_map error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/risk-factors', methods=['GET'])
def get_risk_factors():
    """
    Get all available risk factors and their impact scores
    """
    return jsonify({
        'risk_factors': RISK_FACTORS,
        'impact_scores': RISK_IMPACT
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Starting SafeRoute API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
