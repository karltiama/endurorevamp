'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Target, Activity, BarChart3 } from 'lucide-react';

// Example dashboard readouts that illustrate the metrics the app actually
// computes from your Strava data (weekly distance, training load, goal progress,
// totals, and activity streak). Values are illustrative, not aggregate claims.
const stats = [
  {
    value: '+12%',
    label: 'Weekly distance',
    icon: TrendingUp,
    color: 'green',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    position: 'bottom-left',
    enterFrom: { x: -100, y: 50, opacity: 0 },
    exitTo: { x: -100, y: -50, opacity: 0 },
  },
  {
    value: '320',
    label: 'Weekly training load (TSS)',
    icon: Zap,
    color: 'blue',
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    position: 'top-right',
    enterFrom: { x: 100, y: -50, opacity: 0 },
    exitTo: { x: 100, y: 50, opacity: 0 },
  },
  {
    value: '85%',
    label: 'Goal progress',
    icon: Target,
    color: 'purple',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    position: 'bottom-right',
    enterFrom: { x: 100, y: 50, opacity: 0 },
    exitTo: { x: 100, y: -50, opacity: 0 },
  },
  {
    value: '3.2k',
    label: 'Total km tracked',
    icon: Activity,
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    position: 'top-left',
    enterFrom: { x: -100, y: -50, opacity: 0 },
    exitTo: { x: -100, y: 50, opacity: 0 },
  },
  {
    value: '12 days',
    label: 'Activity streak',
    icon: BarChart3,
    color: 'orange',
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    position: 'center',
    enterFrom: { scale: 0.5, opacity: 0 },
    exitTo: { scale: 0.5, opacity: 0 },
  },
];

export default function AnimatedStats() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % stats.length);
    }, 4000); // Change every 4 seconds to give more time to appreciate each animation

    return () => clearInterval(interval);
  }, [isClient]);

  const currentStat = stats[currentIndex];

  if (!isClient) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={currentStat.enterFrom}
        animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        exit={currentStat.exitTo}
        transition={{
          duration: 0.6,
          ease: 'easeOut',
          type: 'spring',
          stiffness: 100,
          damping: 15,
        }}
        className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-4 border"
      >
        <div className="flex items-center space-x-3">
          <motion.div
            className={`w-12 h-12 ${currentStat.bgColor} rounded-full flex items-center justify-center`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <currentStat.icon className={`h-6 w-6 ${currentStat.iconColor}`} />
          </motion.div>
          <div>
            <motion.p
              className="font-semibold text-gray-900"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {currentStat.value}
            </motion.p>
            <motion.p
              className="text-sm text-gray-500"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {currentStat.label}
            </motion.p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
