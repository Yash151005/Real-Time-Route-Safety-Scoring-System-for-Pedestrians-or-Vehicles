import { motion } from 'framer-motion';
import { Shield, Brain, Users, Zap, MapPin, AlertTriangle } from 'lucide-react';

export default function About() {
  const problemPoints = [
    'Over 1.35 million people die in road traffic crashes annually',
    'Traditional navigation apps prioritize speed over safety',
    'Limited real-time awareness of safety conditions',
    'Lack of predictive safety analytics'
  ];

  const solutionFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Machine learning algorithms analyze traffic patterns, crime data, and road conditions'
    },
    {
      icon: MapPin,
      title: 'Real-Time Monitoring',
      description: 'Live updates on accidents, construction, weather, and safety incidents'
    },
    {
      icon: Users,
      title: 'Community Intelligence',
      description: 'Crowdsourced safety reports from millions of active users'
    },
    {
      icon: Zap,
      title: 'Instant Recommendations',
      description: 'Smart route suggestions based on current safety conditions'
    }
  ];

  const techStack = [
    { name: 'React', description: 'Modern UI framework for responsive interfaces' },
    { name: 'TailwindCSS', description: 'Utility-first CSS framework for rapid styling' },
    { name: 'Leaflet', description: 'Interactive maps with real-time route visualization' },
    { name: 'Framer Motion', description: 'Smooth animations and micro-interactions' },
    { name: 'Machine Learning', description: 'AI models for safety prediction and analysis' },
    { name: 'Real-Time APIs', description: 'Live data integration for traffic and incidents' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-slate-800 dark:text-white mb-6">
            About SafeRoute.AI
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Revolutionizing navigation with AI-powered safety intelligence to make every journey safer
          </p>
        </motion.div>

        {/* Problem Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-20"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 lg:p-12 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center mb-8">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-4" />
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                The Problem
              </h2>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
              Traditional navigation systems focus solely on getting you from point A to point B as quickly as possible, 
              often ignoring critical safety factors that could impact your journey.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {problemPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700 dark:text-slate-300">{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Solution Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-20"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 lg:p-12 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center mb-8">
              <Shield className="h-8 w-8 text-green-500 mr-4" />
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                Our Solution
              </h2>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-12">
              SafeRoute.AI combines artificial intelligence, real-time data, and community intelligence 
              to provide the safest possible routes for your travels.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {solutionFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="group p-6 bg-slate-50 dark:bg-slate-700 rounded-2xl hover:bg-green-50 dark:hover:bg-slate-600 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Tech Stack Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 lg:p-12 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center mb-8">
              <Zap className="h-8 w-8 text-blue-500 mr-4" />
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                Technology Stack
              </h2>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-12">
              Built with cutting-edge technologies to ensure reliability, performance, and scalability.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {techStack.map((tech, index) => (
                <motion.div
                  key={tech.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="p-6 bg-slate-50 dark:bg-slate-700 rounded-xl hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-slate-600"
                >
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                    {tech.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    {tech.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
