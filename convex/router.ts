import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Fake API endpoint for route data
http.route({
  path: "/api/route",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    
    if (!start || !end) {
      return new Response(JSON.stringify({ error: "Missing start or end parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock route data
    const coordinates = [];
    const startCoord = { lat: 37.7749, lng: -122.4194 };
    const endCoord = { lat: 37.7849, lng: -122.4094 };
    
    for (let i = 0; i <= 10; i++) {
      const ratio = i / 10;
      const lat = startCoord.lat + (endCoord.lat - startCoord.lat) * ratio + (Math.random() - 0.5) * 0.01;
      const lng = startCoord.lng + (endCoord.lng - startCoord.lng) * ratio + (Math.random() - 0.5) * 0.01;
      coordinates.push({ lat, lng });
    }

    const safetyScore = Math.floor(Math.random() * 60) + 30; // 30-90
    const distance = Math.round((Math.random() * 20 + 5) * 10) / 10;
    const duration = Math.round(Math.random() * 40 + 10);
    const trafficLevels = ['low', 'moderate', 'high'];
    const trafficLevel = trafficLevels[Math.floor(Math.random() * trafficLevels.length)];

    const dangerPoints = [];
    const numPoints = Math.floor(Math.random() * 3) + 1;
    const descriptions = [
      'Construction zone ahead',
      'High crime area - stay alert',
      'Frequent accidents reported',
      'Poor road conditions',
      'Heavy traffic congestion'
    ];

    for (let i = 0; i < numPoints; i++) {
      const randomIndex = Math.floor(Math.random() * coordinates.length);
      const coord = coordinates[randomIndex];
      dangerPoints.push({
        lat: coord.lat + (Math.random() - 0.5) * 0.005,
        lng: coord.lng + (Math.random() - 0.5) * 0.005,
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      });
    }

    const routeData = {
      coordinates,
      safetyScore,
      distance,
      duration,
      trafficLevel,
      dangerPoints
    };

    return new Response(JSON.stringify(routeData), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  })
});

export default http;
