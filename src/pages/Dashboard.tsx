import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ProfileSection } from '../components/ProfileSection';
import { SafetyScorePopup } from '../components/SafetyScorePopup';
import { getCurrentTimeContext, calculatePersonalizedFactors, getTimeBasedRouteRecommendations } from '../utils/timePersonalization';
import { 
  Navigation, 
  MapPin, 
  Loader2,
  ToggleLeft,
  ToggleRight,
  Zap,
  Route,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Award,
  Clock,
  MapIcon
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Coordinate {
  lat: number;
  lng: number;
}

interface RouteData {
  id: string;
  name: string;
  coordinates: Coordinate[];
  safetyScore: number;
  distance: number;
  duration: number;
  startName: string;
  endName: string;
  color: string;
  isRecommended?: boolean;
  explanation?: {
    weather_impact?: number;
    accident_impact?: number;
  };
}

// Component to fit map bounds when routes are loaded
function FitBounds({ coordinates }: { coordinates: Coordinate[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates.map(coord => [coord.lat, coord.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  
  return null;
}

// Geocoding function using Nominatim API
const geocodeLocation = async (locationName: string): Promise<Coordinate | null> => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: locationName,
        format: 'json',
        limit: 1,
        countrycodes: 'in', // Restrict to India
      }
    });
    
    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Route fetching function using OSRM API with alternatives
const fetchRoutes = async (start: Coordinate, end: Coordinate): Promise<RouteData[]> => {
  try {
    const response = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}`,
      {
        params: {
          overview: 'full',
          geometries: 'geojson',
          alternatives: 'true',
          steps: 'false'
        }
      }
    );
    
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const routes = response.data.routes.slice(0, 3); // Get up to 3 routes
      const colors = ['#22C55E', '#FACC15', '#EF4444']; // Green, Yellow, Red
      const routeNames = ['Route A', 'Route B', 'Route C'];
      
      return routes.map((route: any, index: number) => {
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
          lat: coord[1],
          lng: coord[0]
        }));
        
        // Generate safety score (60-100)
        const safetyScore = Math.floor(Math.random() * 40) + 60;
        
        return {
          id: `route-${index}`,
          name: routeNames[index],
          coordinates,
          safetyScore,
          distance: Math.round(route.distance / 1000 * 10) / 10, // Convert to km
          duration: Math.round(route.duration / 60), // Convert to minutes
          startName: '',
          endName: '',
          color: colors[index] || '#6B7280'
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Routing error:', error);
    return [];
  }
};

// Generate safety score and color based on score
const getSafetyColor = (score: number) => {
  if (score >= 80) return '#22C55E'; // Green
  if (score >= 70) return '#FACC15'; // Yellow
  return '#EF4444'; // Red
};

export default function Dashboard() {
  const { userProfile } = useAuth();
  const saveRouteHistory = useMutation(api.routeHistory.saveRouteHistory);
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [showSafetyPopup, setShowSafetyPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<string[]>([]);
  const mapRef = useRef<L.Map | null>(null);

  const handleFindRoute = async () => {
    if (!startLocation || !destination) {
      toast.error('Please enter both start and destination locations');
      return;
    }

    setLoading(true);
    setRoutes([]);
    setSelectedRoute(null);

    try {
      // Step 1: Geocode start and destination
      toast.info('Finding locations...');
      const [startCoords, endCoords] = await Promise.all([
        geocodeLocation(startLocation),
        geocodeLocation(destination)
      ]);

      if (!startCoords) {
        toast.error(`Could not find location: ${startLocation}`);
        setLoading(false);
        return;
      }

      if (!endCoords) {
        toast.error(`Could not find location: ${destination}`);
        setLoading(false);
        return;
      }

      // Step 2: Fetch multiple routes using OSRM
      toast.info('Calculating routes...');
      const routeData = await fetchRoutes(startCoords, endCoords);

      if (routeData.length === 0) {
        toast.error('Could not find routes between these locations');
        setLoading(false);
        return;
      }

      // Step 3: Update route data with location names and find recommended route
      let updatedRoutes = routeData.map(route => ({
        ...route,
        startName: startLocation,
        endName: destination,
        color: getSafetyColor(route.safetyScore)
      }));

      // Step 4: Apply time-based personalization
      const timeContext = getCurrentTimeContext();
      let personalizedRoutes = updatedRoutes;
      
      if (userProfile) {
        const personalizedFactors = calculatePersonalizedFactors(userProfile, timeContext);
        const recommendations = getTimeBasedRouteRecommendations(userProfile, timeContext);
        setPersonalizedRecommendations(recommendations);
        
        // Apply safety multiplier to routes
        personalizedRoutes = updatedRoutes.map(route => ({
          ...route,
          safetyScore: Math.min(100, Math.max(30, route.safetyScore * personalizedFactors.safetyMultiplier)),
          explanation: {
            weather_impact: 50 + (personalizedFactors.timeBasedAdjustments.weather * 20),
            accident_impact: 50 - (personalizedFactors.timeBasedAdjustments.crime * 20),
          }
        }));
      }

      // Step 5: Fetch explainability from backend and attach to each route card
      try {
        const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:5000';
        const base = String(BACKEND).replace(/\/$/, '');
        const backendResp = await axios.post(
          `${base}/find_safe_route`,
          { start: startLocation, end: destination },
          { headers: { 'Content-Type': 'application/json' } }
        );
        const explanation = backendResp?.data?.explanation;
        if (explanation && typeof explanation.weather_impact === 'number' && typeof explanation.accident_impact === 'number') {
          personalizedRoutes = personalizedRoutes.map(r => ({
            ...r,
            explanation: {
              weather_impact: Math.round(explanation.weather_impact * 100) / 100,
              accident_impact: Math.round(explanation.accident_impact * 100) / 100,
            }
          }));
        }
      } catch (e) {
        // Ignore backend errors; UI will hide explanation if absent
      }

      // Find the route with highest safety score as recommended
      const recommendedRoute = personalizedRoutes.reduce((prev, current) => 
        prev.safetyScore > current.safetyScore ? prev : current
      );
      recommendedRoute.isRecommended = true;

      setRoutes(personalizedRoutes);
      setSelectedRoute(recommendedRoute);
      
      // Save route to history if user is authenticated
      if (userProfile && recommendedRoute) {
        try {
          await saveRouteHistory({
            userId: userProfile.userId as any,
            startLocation,
            endLocation,
            routeData: {
              coordinates: recommendedRoute.coordinates,
              safetyScore: recommendedRoute.safetyScore,
              distance: recommendedRoute.distance,
              duration: recommendedRoute.duration,
              explanation: recommendedRoute.explanation,
            },
            timeOfDay: timeContext.timeOfDay,
            dayOfWeek: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][timeContext.dayOfWeek] as any,
          });
        } catch (error) {
          console.error('Failed to save route history:', error);
        }
      }
      
      toast.success(`${personalizedRoutes.length} personalized routes found successfully!`);
      
    } catch (error) {
      console.error('Route finding error:', error);
      toast.error('Failed to find routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route: RouteData) => {
    setSelectedRoute(route);
    setShowSafetyPopup(true);
    toast.success(`Route selected! Safety breakdown is now visible in the bottom-right corner.`, {
      duration: 3000,
    });
  };

  const getSafetyBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
  };

  const getSafetyIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 70) return AlertTriangle;
    return AlertTriangle;
  };

  const getRecommendationText = () => {
    if (routes.length === 0) return '';
    
    const recommendedRoute = routes.find(r => r.isRecommended);
    if (!recommendedRoute) return '';
    
    const otherRoutes = routes.filter(r => !r.isRecommended);
    if (otherRoutes.length === 0) return `${recommendedRoute.name} is the only available route.`;
    
    const avgOtherScore = otherRoutes.reduce((sum, r) => sum + r.safetyScore, 0) / otherRoutes.length;
    const improvement = Math.round(((recommendedRoute.safetyScore - avgOtherScore) / avgOtherScore) * 100);
    
    return `${recommendedRoute.name} is ${improvement}% safer than other routes.`;
  };

  // Simulate real-time updates
  useEffect(() => {
    if (!realTimeEnabled || routes.length === 0) return;

    const interval = setInterval(() => {
      setRoutes(prevRoutes => {
        return prevRoutes.map(route => {
          const change = (Math.random() - 0.5) * 4; // -2 to +2
          const newScore = Math.max(60, Math.min(100, route.safetyScore + change));
          
          if (Math.abs(newScore - route.safetyScore) > 1) {
            return {
              ...route,
              safetyScore: newScore,
              color: getSafetyColor(newScore)
            };
          }
          return route;
        });
      });
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [realTimeEnabled, routes.length]);

  // Get all coordinates for map bounds
  const allCoordinates = routes.flatMap(route => route.coordinates);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Left Panel */}
        <div className="w-full lg:w-96 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                Route Safety Planner
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Find the safest route for your journey in India
              </p>
            </div>

            {/* Route Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Start Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    placeholder="e.g., Pune, Mumbai, Delhi"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Destination
                </label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g., Bangalore, Chennai, Kolkata"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleFindRoute}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Route className="h-5 w-5" />
                    <span>Find Safe Routes</span>
                  </>
                )}
              </button>
            </div>

            {/* Real-time Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-green-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Real-time Updates
                </span>
              </div>
              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className="text-green-500 hover:text-green-600 transition-colors"
              >
                {realTimeEnabled ? (
                  <ToggleRight className="h-6 w-6" />
                ) : (
                  <ToggleLeft className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Profile Section */}
            <AnimatePresence>
              {userProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                      Your Profile
                    </h3>
                    <button
                      onClick={() => setShowProfile(!showProfile)}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      {showProfile ? 'Hide' : 'Edit Profile'}
                    </button>
                  </div>
                  {showProfile && <ProfileSection />}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Personalized Recommendations */}
            <AnimatePresence>
              {personalizedRecommendations.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-6"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold text-blue-800 dark:text-blue-300">
                      Personalized Safety Tips
                    </span>
                  </div>
                  <div className="space-y-2">
                    {personalizedRecommendations.map((recommendation, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-sm text-blue-700 dark:text-blue-400"
                      >
                        {recommendation}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Recommendation */}
            <AnimatePresence>
              {routes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-800 dark:text-green-300">
                      AI Recommendation
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {getRecommendationText()}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Routes List */}
            <AnimatePresence>
              {routes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center space-x-2">
                    <MapIcon className="h-5 w-5" />
                    <span>Available Routes</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {routes.map((route, index) => {
                      const SafetyIcon = getSafetyIcon(route.safetyScore);
                      const isSelected = selectedRoute?.id === route.id;
                      
                      return (
                        <motion.div
                          key={route.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          onClick={() => handleRouteSelect(route)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                            isSelected 
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg' 
                              : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-green-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: route.color }}
                              />
                              <span className="font-semibold text-slate-800 dark:text-white">
                                {route.name}
                              </span>
                              {route.isRecommended && (
                                <Star className="h-4 w-4 text-green-500 fill-current" />
                              )}
                            </div>
                            <SafetyIcon className={`h-5 w-5 ${
                              route.safetyScore >= 80 ? 'text-green-500' :
                              route.safetyScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                            }`} />
                          </div>
                          
                          <div className="space-y-2">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getSafetyBadgeColor(route.safetyScore)}`}>
                              {Math.round(route.safetyScore)}% Safety Score
                            </div>
                            
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{route.distance} km</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{Math.round(route.duration)} min</span>
                              </div>
                            </div>
                            
                            {/* Safety Score Bar */}
                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${route.safetyScore}%` }}
                                transition={{ duration: 1, delay: index * 0.2 }}
                                className="h-2 rounded-full"
                                style={{ backgroundColor: route.color }}
                              />
                            </div>

                            {/* Animated Explainability (Weather vs Accident) */}
                            {route.explanation && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                                className="mt-2"
                              >
                                <div className="flex flex-col sm:flex-col gap-1">
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: 0.15 + index * 0.1 }}
                                    className="text-sm text-blue-400"
                                  >
                                    🌦️ Weather Impact: {Math.round((route.explanation.weather_impact ?? 0) * 100) / 100}%
                                  </motion.div>
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: 0.3 + index * 0.1 }}
                                    className="text-sm text-orange-400"
                                  >
                                    🚧 Accident Impact: {Math.round((route.explanation.accident_impact ?? 0) * 100) / 100}%
                                  </motion.div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                          
                          {/* Click hint */}
                          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-600">
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                              <span>💡</span>
                              <span>Click for detailed safety breakdown</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            center={[20.5937, 78.9629]} // Center of India
            zoom={5}
            className="h-full w-full"
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Fit bounds when routes change */}
            {allCoordinates.length > 0 && (
              <FitBounds coordinates={allCoordinates} />
            )}
            
            {/* Route Polylines */}
            {routes.map((route) => (
              <Polyline
                key={route.id}
                positions={route.coordinates.map(coord => [coord.lat, coord.lng])}
                color={route.color}
                weight={selectedRoute?.id === route.id ? 8 : 5}
                opacity={selectedRoute?.id === route.id ? 1 : 0.7}
              />
            ))}

            {/* Start and End Markers */}
            {selectedRoute && selectedRoute.coordinates.length > 0 && (
              <>
                {/* Start Marker */}
                <Marker position={[selectedRoute.coordinates[0].lat, selectedRoute.coordinates[0].lng]}>
                  <Popup>
                    <div className="text-center">
                      <strong>Start: {selectedRoute.startName}</strong>
                      <br />
                      <span className="text-sm text-slate-600">
                        {selectedRoute.coordinates[0].lat.toFixed(4)}, {selectedRoute.coordinates[0].lng.toFixed(4)}
                      </span>
                    </div>
                  </Popup>
                </Marker>

                {/* End Marker */}
                <Marker position={[
                  selectedRoute.coordinates[selectedRoute.coordinates.length - 1].lat,
                  selectedRoute.coordinates[selectedRoute.coordinates.length - 1].lng
                ]}>
                  <Popup>
                    <div className="text-center">
                      <strong>Destination: {selectedRoute.endName}</strong>
                      <br />
                      <span className="text-sm text-slate-600">
                        {selectedRoute.coordinates[selectedRoute.coordinates.length - 1].lat.toFixed(4)}, {selectedRoute.coordinates[selectedRoute.coordinates.length - 1].lng.toFixed(4)}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}
          </MapContainer>

          {/* Floating Route Info Display */}
          {selectedRoute && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 right-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 z-[1000] max-w-sm"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedRoute.color }}
                />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white flex items-center space-x-1">
                    <span>{selectedRoute.name}</span>
                    {selectedRoute.isRecommended && (
                      <Star className="h-4 w-4 text-green-500 fill-current" />
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedRoute.startName} → {selectedRoute.endName}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className={`font-medium ${
                  selectedRoute.safetyScore >= 80 ? 'text-green-600' :
                  selectedRoute.safetyScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(selectedRoute.safetyScore)}% Safety
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  {selectedRoute.distance}km • {Math.round(selectedRoute.duration)}min
                </div>
              </div>
            </motion.div>
          )}

          {/* No Routes State */}
          {routes.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <Route className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Ready to Find Your Routes
                </h3>
                <p className="text-slate-500 dark:text-slate-500 max-w-sm">
                  Enter your start and destination locations to find multiple safe routes with real-time safety scoring
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Safety Score Popup */}
      <SafetyScorePopup
        isVisible={showSafetyPopup}
        onClose={() => setShowSafetyPopup(false)}
        routeData={selectedRoute ? {
          safetyScore: selectedRoute.safetyScore,
          explanation: selectedRoute.explanation,
          factors: selectedRoute.factors,
          top_risk_factors: selectedRoute.top_risk_factors
        } : null}
      />

      {/* Floating indicator when popup is visible */}
      {showSafetyPopup && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="fixed bottom-2 right-2 z-[10000] w-3 h-3 bg-green-500 rounded-full animate-pulse"
        />
      )}
    </div>
  );
}
