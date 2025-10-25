import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface SafetyScoreCardProps {
  score: number;
}

export default function SafetyScoreCard({ score }: SafetyScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return Shield;
    return AlertTriangle;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Moderate';
    return 'Risky';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-600';
  };

  const Icon = getScoreIcon(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
          Safety Score
        </h3>
        <Icon className={`h-6 w-6 ${getScoreColor(score)}`} />
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-slate-200 dark:text-slate-600"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className={`stop-color-${score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red'}-500`} />
                <stop offset="100%" className={`stop-color-${score >= 80 ? 'emerald' : score >= 60 ? 'orange' : 'pink'}-600`} />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Score text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className={`text-3xl font-bold ${getScoreColor(score)}`}
              >
                {Math.round(score)}
              </motion.div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                out of 100
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className={`text-lg font-semibold ${getScoreColor(score)} mb-1`}>
          {getScoreLabel(score)}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {score >= 80 && "This route is very safe with minimal risks"}
          {score >= 60 && score < 80 && "This route has moderate safety concerns"}
          {score < 60 && "This route has significant safety risks"}
        </div>
      </div>
    </div>
  );
}
