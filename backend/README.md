# SafeRoute API Backend

A Flask-based REST API for the Real-Time Route Safety Scoring System that provides multiple route alternatives with AI-powered safety analysis.

## Features

- **Multi-Route Planning**: Get up to 3 alternative routes between any two locations
- **Safety Scoring**: AI-powered safety analysis with scores from 30-95%
- **Risk Assessment**: Detailed risk factors for each route
- **Real-time Data**: Integration with OpenStreetMap and OSRM APIs
- **Indian Focus**: Optimized for Indian cities and locations

## API Endpoints

### GET /api/routes
Get route alternatives with safety scores.

**Parameters:**
- `start` (required): Starting location name (e.g., "Mumbai", "Delhi")
- `end` (required): Destination location name (e.g., "Pune", "Bangalore")

**Example Request:**
```
GET /api/routes?start=Mumbai&end=Pune
```

**Example Response:**
```json
{
  "success": true,
  "routes": [
    {
      "id": "A",
      "coordinates": [
        {"lat": 19.0760, "lng": 72.8777},
        {"lat": 18.5204, "lng": 73.8567}
      ],
      "safety_score": 85,
      "risk_factors": ["High traffic density", "Low lighting"],
      "reason": "Excellent route with minimal risks. High traffic density, Low lighting detected but manageable.",
      "distance_km": 148.2,
      "duration_minutes": 180,
      "start_location": "Mumbai",
      "end_location": "Pune"
    }
  ],
  "recommendation": {
    "recommended_route": "A",
    "reason": "Route A has the highest safety score of 85%"
  },
  "start_coordinates": {
    "lat": 19.0760,
    "lng": 72.8777,
    "display_name": "Mumbai, Maharashtra, India"
  },
  "end_coordinates": {
    "lat": 18.5204,
    "lng": 73.8567,
    "display_name": "Pune, Maharashtra, India"
  }
}
```

### GET /api/health
Health check endpoint.

### GET /api/risk-factors
Get all available risk factors and their impact scores.

## Safety Scoring Algorithm

The safety score is calculated using a weighted system:

**Base Score:** 100

**Risk Factor Penalties:**
- High traffic density: -15 points
- Accident-prone area: -20 points
- Bad road condition: -18 points
- Poor visibility: -16 points
- Heavy vehicle traffic: -13 points
- Steep turns: -12 points
- Rainy weather: -10 points
- Low lighting: -8 points
- Construction zone: -14 points
- School zone: -5 points

**Final Score Range:** 30-95 points

## Installation & Setup

1. **Install Dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run the Application:**
```bash
python app.py
```

3. **Development Mode:**
```bash
export FLASK_ENV=development
python app.py
```

The API will be available at `http://localhost:5000`

### Segment Safety Pipeline

Additional endpoints:

- `GET /api/segment-safety?start=<city|lat,lng>&end=<city|lat,lng>`: Returns per-segment predicted safety scores.
- `GET /api/segment-safety/map?start=<city|lat,lng>&end=<city|lat,lng>`: Returns an interactive HTML map with color-coded segments.

Environment variables:
- `VISUAL_CROSSING_API_KEY` for weather features.

Run an example:
```bash
python -m pipeline.example --start "Mumbai" --end "Pune" --output map.html
```

### New: POST /find_safe_route

Body:
```json
{
  "start": "Pune",
  "end": "Mumbai",
  "generate_map": true
}
```

Example:
```bash
curl -X POST http://localhost:5000/find_safe_route \
  -H "Content-Type: application/json" \
  -d '{"start":"Pune","end":"Mumbai","generate_map":true}'
```


## Environment Variables

- `PORT`: Server port (default: 5000)
- `FLASK_ENV`: Environment mode (development/production)

## API Integration

The backend integrates with:

1. **Nominatim API**: For geocoding city names to coordinates
2. **OSRM API**: For route calculation and alternatives

## Error Handling

The API provides comprehensive error handling:

- **400**: Missing required parameters
- **404**: Location not found or no routes available
- **500**: Internal server error

## CORS Support

CORS is enabled for all origins to support frontend integration.

## Logging

The application includes comprehensive logging for debugging and monitoring.

## Testing

Test the API using curl:

```bash
# Get routes between Mumbai and Pune
curl "http://localhost:5000/api/routes?start=Mumbai&end=Pune"

# Health check
curl "http://localhost:5000/api/health"

# Get risk factors
curl "http://localhost:5000/api/risk-factors"
```

## Production Deployment

For production deployment:

1. Set `FLASK_ENV=production`
2. Use a WSGI server like Gunicorn
3. Configure proper logging
4. Set up monitoring and health checks

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```
