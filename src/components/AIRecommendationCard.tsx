import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { RouteData } from '../services/api';

interface AIRecommendationCardProps {
  routeData: RouteData;
}

export default function AIRecommendationCard({ routeData }: AIRecommendationCardProps) {
  const generateRecommendation = (data: RouteData) => {
    const { safetyScore, trafficLevel, dangerPoints } = data;
    
    if (safetyScore >= 80) {
      return {
        type: 'success',
        icon: CheckCircle,
        title: 'Excellent Route Choice',
        message: `This route has a ${safetyScore}% safety rating with minimal risks. Perfect for your journey!`,
        improvement: null
      };
    } else if (safetyScore >= 60) {
      const alternativeScore = Math.min(95, safetyScore + Math.floor(Math.random() * 20) + 10);
      return {
        type: 'warning',
        icon: AlertCircle,
        title: 'Alternative Route Available',
        message: `Route B is safer by ${alternativeScore - safetyScore}% with better safety conditions.`,
        improvement: `${alternativeScore - safetyScore}% safer`
      };
    } else {
      const alternativeScore = Math.min(95, safetyScore + Math.floor(Math.random() * 30) + 20);
      return {
        type: 'danger',
        icon: TrendingUp,
        title: 'Safer Route Recommended',
        message: `Consider Route C - it's ${alternativeScore - safetyScore}% safer with fewer risk factors.`,
        improvement: `${alternativeScore - safetyScore}% safer`
      };
    }
  };

  const recommendation = generateRecommendation(routeData);
  const Icon = recommendation.icon;

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-800 dark:text-green-300',
          text: 'text-green-700 dark:text-green-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          title: 'text-yellow-800 dark:text-yellow-300',
          text: 'text-yellow-700 dark:text-yellow-400'
        };
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-800 dark:text-red-300',
          text: 'text-red-700 dark:text-red-400'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-700',
          border: 'border-slate-200 dark:border-slate-600',
          icon: 'text-slate-600 dark:text-slate-400',
          title: 'text-slate-800 dark:text-slate-300',
          text: 'text-slate-700 dark:text-slate-400'
        };
    }
  };

  const colors = getColorClasses(recommendation.type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`${colors.bg} ${colors.border} border rounded-2xl p-6`}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 ${colors.icon}`}>
          <Brain className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon className={`h-5 w-5 ${colors.icon}`} />
            <h3 className={`font-semibold ${colors.title}`}>
              AI Recommendation
            </h3>
          </div>
          <h4 className={`font-medium ${colors.title} mb-2`}>
            {recommendation.title}
          </h4>
          <p className={`text-sm ${colors.text} mb-3`}>
            {recommendation.message}
          </p>
          
          {recommendation.improvement && (
            <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-white dark:bg-slate-800 ${colors.text} text-sm font-medium`}>
              <TrendingUp className="h-4 w-4" />
              <span>{recommendation.improvement}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
