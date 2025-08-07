'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

// Removed unused MetricCardProps interface

function AnimatedCounter({ value, color, delay = 0, unit, showIcon = false }: { value: string; color: string; delay?: number; unit?: string; showIcon?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const targetValue = parseInt(value.replace(/[^0-9]/g, ''))
    const startTime = Date.now()
    const duration = 2000 // 2 seconds
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentValue = Math.round(targetValue * progress)
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    const timer = setTimeout(() => {
      requestAnimationFrame(animate)
    }, delay * 1000)
    
    return () => clearTimeout(timer)
  }, [value, delay])

  return (
    <motion.div 
      className={`text-2xl font-bold ${color} flex items-center justify-center gap-1`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.5, duration: 0.5 }}
    >
      {showIcon && <TrendingUp className="h-5 w-5" />}
      {displayValue}{unit || ''}
    </motion.div>
  )
}

export default function AnimatedMetrics() {
  const metrics = [
    { value: '12', label: 'Pace Improvement', color: 'text-indigo-600', bgColor: 'bg-indigo-50', delay: 0, unit: ' min/mi', showIcon: true },
    { value: '85', label: 'Goal Progress', color: 'text-green-600', bgColor: 'bg-green-50', delay: 0.2, unit: '%', showIcon: false },
    { value: '2.3', label: 'Recovery Rate', color: 'text-blue-600', bgColor: 'bg-blue-50', delay: 0.4, unit: 'x faster', showIcon: false }
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          className={`${metric.bgColor} rounded-lg p-4 text-center`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: metric.delay, duration: 0.5, type: "spring" }}
        >
                     <AnimatedCounter 
             value={metric.value} 
             color={metric.color} 
             delay={metric.delay} 
             unit={metric.unit}
             showIcon={metric.showIcon}
           />
          <motion.div 
            className="text-sm text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: metric.delay + 1, duration: 0.5 }}
          >
            {metric.label}
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
} 