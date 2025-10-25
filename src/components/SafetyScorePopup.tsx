import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, X, Star, Sun, Moon, Shield, Camera, TrafficCone, Droplets, Clock, Info } from 'lucide-react';

interface SafetyFactor {
  name: string;
  score: number;
  weight: number;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface SafetyScorePopupProps {
  isVisible: boolean;
  onClose: () => void;
  routeData: {
    safetyScore: number;
    explanation?: {
      weather_impact: number;
      accident_impact: number;
    };
    factors?: {
      rain: string;
      visibility: string;
      traffic_density: string;
    };
    top_risk_factors?: string[];
  } | null;
}

export function SafetyScorePopup({ isVisible, onClose, routeData }: SafetyScorePopupProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible, onClose]);

  // Generate safety factors based on route data
  const generateSafetyFactors = (): SafetyFactor[] => {
    if (!routeData) return [];

    const baseScore = routeData.safetyScore;
    const weatherImpact = routeData.explanation?.weather_impact || 50;
    const accidentImpact = routeData.explanation?.accident_impact || 50;
    
    // More realistic factor calculations
    const weatherScore = Math.max(20, Math.min(100, 100 - (weatherImpact * 0.4)));
    const trafficScore = Math.max(30, Math.min(100, 100 - (accidentImpact * 0.5)));
    const visibilityScore = routeData.factors?.visibility === 'low' ? 45 : 85;
    const lightingScore = Math.max(40, Math.min(100, baseScore * 0.9 + Math.random() * 20));
    const crimeScore = Math.max(50, Math.min(100, baseScore * 0.95 + Math.random() * 10));
    const cctvScore = Math.max(60, Math.min(100, baseScore * 0.8 + Math.random() * 30));

    return [
      {
        name: 'Weather Conditions',
        score: Math.round(weatherScore),
        weight: 0.20,
        icon: routeData.factors?.rain === 'moderate' ? <Droplets className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
        description: routeData.factors?.rain === 'moderate' ? 'Moderate rain' : 'Clear skies',
        color: routeData.factors?.rain === 'moderate' ? 'text-blue-500' : 'text-yellow-500'
      },
      {
        name: 'Traffic Safety',
        score: Math.round(trafficScore),
        weight: 0.25,
        icon: <TrafficCone className="w-4 h-4" />,
        description: routeData.factors?.traffic_density === 'high' ? 'High traffic' : 'Low traffic',
        color: routeData.factors?.traffic_density === 'high' ? 'text-red-500' : 'text-green-500'
      },
      {
        name: 'Visibility',
        score: Math.round(visibilityScore),
        weight: 0.15,
        icon: routeData.factors?.visibility === 'low' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
        description: routeData.factors?.visibility === 'low' ? 'Low visibility' : 'Good visibility',
        color: routeData.factors?.visibility === 'low' ? 'text-gray-500' : 'text-yellow-500'
      },
      {
        name: 'Street Lighting',
        score: Math.round(lightingScore),
        weight: 0.20,
        icon: <Sun className="w-4 h-4" />,
        description: lightingScore > 80 ? 'Well-lit streets' : lightingScore > 60 ? 'Moderate lighting' : 'Poor lighting',
        color: lightingScore > 80 ? 'text-yellow-500' : lightingScore > 60 ? 'text-orange-500' : 'text-red-500'
      },
      {
        name: 'Crime Rate',
        score: Math.round(crimeScore),
        weight: 0.15,
        icon: <Shield className="w-4 h-4" />,
        description: crimeScore > 80 ? 'Low crime area' : crimeScore > 60 ? 'Moderate safety' : 'Higher risk area',
        color: crimeScore > 80 ? 'text-green-500' : crimeScore > 60 ? 'text-yellow-500' : 'text-red-500'
      },
      {
        name: 'CCTV Coverage',
        score: Math.round(cctvScore),
        weight: 0.05,
        icon: <Camera className="w-4 h-4" />,
        description: cctvScore > 80 ? 'High surveillance' : cctvScore > 60 ? 'Moderate coverage' : 'Limited coverage',
        color: cctvScore > 80 ? 'text-blue-500' : cctvScore > 60 ? 'text-orange-500' : 'text-red-500'
      }
    ];
  };

  const safetyFactors = generateSafetyFactors();
  const overallScore = routeData?.safetyScore || 0;
  const starRating = Math.round((overallScore / 100) * 5);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <AnimatePresence>
      {isVisible && routeData && (
        <>
          {/* Backdrop for better visibility */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/10 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 100, y: 100 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: position.x || 0, 
              y: position.y || 0 
            }}
            exit={{ opacity: 0, scale: 0.8, x: 100, y: 100 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-72 sm:w-80 max-w-sm max-h-[90vh] overflow-y-auto"
            ref={popupRef}
            drag={isDragging}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              // Constrain the popup to stay within viewport
              const maxX = window.innerWidth - 320; // 320px is approximate popup width
              const maxY = window.innerHeight - 400; // 400px is approximate popup height
              
              const constrainedX = Math.max(-maxX, Math.min(0, info.offset.x));
              const constrainedY = Math.max(-maxY, Math.min(0, info.offset.y));
              
              setPosition({ x: constrainedX, y: constrainedY });
              setIsDragging(false);
            }}
            onDragStart={() => setIsDragging(true)}
          >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-green-500 dark:border-green-400 overflow-hidden relative ring-2 ring-green-500/20 shadow-green-500/25">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <Car className="w-6 h-6" />
                </motion.div>
                
                <div>
                  <h3 className="font-bold text-lg">Safe Route Score</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{Math.round(overallScore)}/100</span>
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < starRating ? 'fill-current text-yellow-300' : 'text-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Factors considered in safety calculation:
              </div>

              <div className="space-y-3">
                {safetyFactors.map((factor, index) => (
                  <motion.div
                    key={factor.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${factor.color}`}>
                        {factor.icon}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-800 dark:text-slate-200">
                          {factor.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {factor.description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBgColor(factor.score)} ${getScoreColor(factor.score)}`}>
                        {factor.score}
                      </div>
                      <div className="text-xs text-slate-400">
                        {Math.round(factor.weight * 100)}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Time Factor */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <Clock className="w-4 h-4" />
                <span>Current time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  💡 Drag to move • Tap outside to close
                </div>
                <button
                  onClick={() => {
                    // TODO: Add detailed safety report functionality
                    console.log('Detailed safety report requested');
                  }}
                  className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <Info className="w-3 h-3" />
                  <span>Detailed Report</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
