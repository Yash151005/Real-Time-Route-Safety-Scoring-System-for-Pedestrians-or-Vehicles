import axios from 'axios';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface DangerPoint {
  lat: number;
  lng: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface RouteData {
  coordinates: Coordinate[];
  safetyScore: number;
  distance: number;
  duration: number;
  trafficLevel: 'low' | 'moderate' | 'high';
  dangerPoints: DangerPoint[];
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate realistic coordinates between two points
const generateRouteCoordinates = (start: string, end: string): Coordinate[] => {
  // Default coordinates for demo (San Francisco area)
  const startCoord = { lat: 37.7749, lng: -122.4194 };
  const endCoord = { lat: 37.7849, lng: -122.4094 };
  
  const coordinates: Coordinate[] = [];
  const steps = 10;
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = startCoord.lat + (endCoord.lat - startCoord.lat) * ratio + (Math.random() - 0.5) * 0.01;
    const lng = startCoord.lng + (endCoord.lng - startCoord.lng) * ratio + (Math.random() - 0.5) * 0.01;
    coordinates.push({ lat, lng });
  }
  
  return coordinates;
};

// Generate danger points along the route
const generateDangerPoints = (coordinates: Coordinate[]): DangerPoint[] => {
  const dangerPoints: DangerPoint[] = [];
  const numPoints = Math.floor(Math.random() * 3) + 1; // 1-3 danger points
  
  const descriptions = [
    'Construction zone ahead',
    'High crime area - stay alert',
    'Frequent accidents reported',
    'Poor road conditions',
    'Heavy traffic congestion',
    'Weather-related hazards'
  ];
  
  const severities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  
  for (let i = 0; i < numPoints; i++) {
    const randomIndex = Math.floor(Math.random() * coordinates.length);
    const coord = coordinates[randomIndex];
    
    dangerPoints.push({
      lat: coord.lat + (Math.random() - 0.5) * 0.005,
      lng: coord.lng + (Math.random() - 0.5) * 0.005,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      severity: severities[Math.floor(Math.random() * severities.length)]
    });
  }
  
  return dangerPoints;
};

export const getRoute = async (start: string, destination: string): Promise<RouteData> => {
  // Simulate API call delay
  await delay(1500);
  
  // Generate mock route data
  const coordinates = generateRouteCoordinates(start, destination);
  const dangerPoints = generateDangerPoints(coordinates);
  
  // Calculate safety score based on danger points and other factors
  let safetyScore = 85; // Base score
  
  dangerPoints.forEach(point => {
    switch (point.severity) {
      case 'high':
        safetyScore -= 15;
        break;
      case 'medium':
        safetyScore -= 10;
        break;
      case 'low':
        safetyScore -= 5;
        break;
    }
  });
  
  // Add some randomness
  safetyScore += Math.floor(Math.random() * 20) - 10;
  safetyScore = Math.max(20, Math.min(95, safetyScore)); // Clamp between 20-95
  
  const trafficLevels: ('low' | 'moderate' | 'high')[] = ['low', 'moderate', 'high'];
  const trafficLevel = trafficLevels[Math.floor(Math.random() * trafficLevels.length)];
  
  return {
    coordinates,
    safetyScore,
    distance: Math.round((Math.random() * 20 + 5) * 10) / 10, // 5-25 km
    duration: Math.round(Math.random() * 40 + 10), // 10-50 minutes
    trafficLevel,
    dangerPoints
  };
};

// Mock API endpoints for future expansion
export const api = {
  routes: {
    getSafeRoute: getRoute,
    getAlternativeRoutes: async (start: string, destination: string) => {
      await delay(1000);
      return [
        await getRoute(start, destination),
        await getRoute(start, destination),
        await getRoute(start, destination)
      ];
    }
  },
  
  safety: {
    getIncidents: async (bounds: { north: number; south: number; east: number; west: number }) => {
      await delay(800);
      return []; // Mock incidents data
    },
    
    reportIncident: async (incident: { lat: number; lng: number; type: string; description: string }) => {
      await delay(500);
      return { success: true, id: Math.random().toString(36).substr(2, 9) };
    }
  }
};
