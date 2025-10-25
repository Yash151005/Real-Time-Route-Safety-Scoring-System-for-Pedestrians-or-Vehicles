export interface TimeContext {
  hour: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  isWeekend: boolean;
  isRushHour: boolean;
  isNightTime: boolean;
}

export interface UserProfile {
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  age: number;
  modeOfTransport: 'walking' | 'cycling' | 'car' | 'public_transport';
  preferences: {
    avoidDarkAreas: boolean;
    preferWellLitRoutes: boolean;
    avoidHighCrimeAreas: boolean;
    preferMainRoads: boolean;
  };
}

export interface PersonalizedRouteFactors {
  safetyMultiplier: number;
  riskFactors: string[];
  recommendations: string[];
  timeBasedAdjustments: {
    lighting: number;
    traffic: number;
    crime: number;
    weather: number;
  };
}

export function getCurrentTimeContext(): TimeContext {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  if (hour >= 6 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';
  
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  const isNightTime = hour >= 22 || hour <= 5;
  
  return {
    hour,
    dayOfWeek,
    timeOfDay,
    isWeekend,
    isRushHour,
    isNightTime,
  };
}

export function calculatePersonalizedFactors(
  userProfile: UserProfile,
  timeContext: TimeContext
): PersonalizedRouteFactors {
  let safetyMultiplier = 1.0;
  const riskFactors: string[] = [];
  const recommendations: string[] = [];
  
  // Time-based adjustments
  const timeBasedAdjustments = {
    lighting: 1.0,
    traffic: 1.0,
    crime: 1.0,
    weather: 1.0,
  };
  
  // Night time adjustments
  if (timeContext.isNightTime) {
    timeBasedAdjustments.lighting = 0.7; // Reduced lighting
    timeBasedAdjustments.crime = 0.8; // Higher crime risk
    
    if (userProfile.preferences.avoidDarkAreas) {
      safetyMultiplier *= 0.8;
      riskFactors.push('Low lighting conditions');
      recommendations.push('Consider well-lit main roads');
    }
    
    if (userProfile.modeOfTransport === 'walking') {
      safetyMultiplier *= 0.85;
      riskFactors.push('Walking at night');
      recommendations.push('Use main roads with street lighting');
    }
  }
  
  // Rush hour adjustments
  if (timeContext.isRushHour) {
    timeBasedAdjustments.traffic = 1.3; // Higher traffic density
    
    if (userProfile.modeOfTransport === 'car') {
      safetyMultiplier *= 0.9;
      riskFactors.push('Heavy traffic congestion');
      recommendations.push('Consider alternative routes or public transport');
    }
  }
  
  // Weekend adjustments
  if (timeContext.isWeekend) {
    if (timeContext.isNightTime) {
      timeBasedAdjustments.crime = 0.9; // Slightly higher crime risk on weekend nights
      riskFactors.push('Weekend night activity');
      recommendations.push('Stay on main roads with good visibility');
    }
  }
  
  // Gender-based adjustments (based on safety research)
  if (userProfile.gender === 'female' && timeContext.isNightTime) {
    safetyMultiplier *= 0.9;
    riskFactors.push('Night time safety concerns');
    recommendations.push('Share your route with emergency contact');
  }
  
  // Age-based adjustments
  if (userProfile.age < 25 && timeContext.isNightTime) {
    safetyMultiplier *= 0.95;
    riskFactors.push('Young adult night safety');
    recommendations.push('Avoid isolated areas');
  } else if (userProfile.age > 65) {
    safetyMultiplier *= 0.95;
    riskFactors.push('Senior safety considerations');
    recommendations.push('Choose well-lit, accessible routes');
  }
  
  // Transport mode adjustments
  switch (userProfile.modeOfTransport) {
    case 'walking':
      if (timeContext.isNightTime) {
        safetyMultiplier *= 0.85;
        riskFactors.push('Pedestrian night safety');
        recommendations.push('Use sidewalks and crosswalks');
      }
      break;
    case 'cycling':
      if (timeContext.isNightTime) {
        safetyMultiplier *= 0.9;
        riskFactors.push('Cycling visibility');
        recommendations.push('Use bike lanes and wear reflective gear');
      }
      break;
    case 'car':
      if (timeContext.isRushHour) {
        safetyMultiplier *= 0.9;
        riskFactors.push('Traffic congestion');
        recommendations.push('Allow extra time for your journey');
      }
      break;
    case 'public_transport':
      if (timeContext.isNightTime) {
        safetyMultiplier *= 0.95;
        riskFactors.push('Public transport safety');
        recommendations.push('Wait in well-lit areas');
      }
      break;
  }
  
  // User preference adjustments
  if (userProfile.preferences.avoidHighCrimeAreas && timeContext.isNightTime) {
    safetyMultiplier *= 0.9;
    recommendations.push('Route optimized to avoid high-crime areas');
  }
  
  if (userProfile.preferences.preferWellLitRoutes && timeContext.isNightTime) {
    safetyMultiplier *= 1.1;
    recommendations.push('Route prioritized for well-lit streets');
  }
  
  return {
    safetyMultiplier,
    riskFactors,
    recommendations,
    timeBasedAdjustments,
  };
}

export function getTimeBasedRouteRecommendations(
  userProfile: UserProfile,
  timeContext: TimeContext
): string[] {
  const recommendations: string[] = [];
  
  // Time-specific recommendations
  if (timeContext.timeOfDay === 'night') {
    recommendations.push('🌙 Night travel: Use main roads with good lighting');
    recommendations.push('📱 Share your route with emergency contact');
    recommendations.push('🚶 Stay on populated streets');
  }
  
  if (timeContext.isRushHour) {
    recommendations.push('🚗 Rush hour: Allow extra travel time');
    recommendations.push('🚌 Consider public transport alternatives');
  }
  
  if (timeContext.isWeekend && timeContext.isNightTime) {
    recommendations.push('🎉 Weekend night: Be extra cautious in entertainment districts');
  }
  
  // User-specific recommendations
  if (userProfile.modeOfTransport === 'walking' && timeContext.isNightTime) {
    recommendations.push('🚶 Walking: Use sidewalks and crosswalks');
    recommendations.push('👥 Walk with others when possible');
  }
  
  if (userProfile.modeOfTransport === 'cycling' && timeContext.isNightTime) {
    recommendations.push('🚴 Cycling: Use bike lanes and wear reflective gear');
    recommendations.push('🔦 Ensure bike lights are working');
  }
  
  if (userProfile.age < 25) {
    recommendations.push('👤 Young adult: Avoid isolated areas at night');
  }
  
  if (userProfile.age > 65) {
    recommendations.push('👴 Senior: Choose accessible, well-lit routes');
  }
  
  return recommendations;
}

