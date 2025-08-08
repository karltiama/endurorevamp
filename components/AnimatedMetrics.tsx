'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

function AnimatedCounter({ 
  value, 
  color, 
  delay = 0, 
  unit, 
  showIcon = false 
}: { 
  value: string
  color: string
  delay?: number
  unit?: string
  showIcon?: boolean 
}) {
  const [displayValue, setDisplayValue] = useState<string | number>(0)
  
  useEffect(() => {
    // Handle time format (7:32) vs numeric values
    if (value.includes(':')) {
      // For time values, just animate the opacity and show the full value
      const timer = setTimeout(() => {
        setDisplayValue(value)
      }, delay * 1000)
      return () => clearTimeout(timer)
    } else {
      // For numeric values, animate counting up
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
    }
  }, [value, delay])

  return (
    <motion.div 
      className={`text-lg sm:text-xl font-bold ${color} flex items-center justify-center gap-1`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.5, duration: 0.5 }}
    >
      {showIcon && <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />}
      {displayValue}{unit || ''}
    </motion.div>
  )
}

export default function AnimatedMetrics() {
  const metrics = [
    { 
      value: '7:32', 
      label: 'Average Pace', 
      color: 'text-indigo-600', 
      bgColor: 'bg-indigo-50', 
      delay: 0, 
      unit: ' min/mi', 
      showIcon: false 
    },
    { 
      value: '85', 
      label: 'Goal Progress', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50', 
      delay: 0.2, 
      unit: '%', 
      showIcon: false 
    },
    { 
      value: '2.3', 
      label: 'Recovery Rate', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50', 
      delay: 0.4, 
      unit: 'x faster', 
      showIcon: false 
    }
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {metrics.map((metric, index) => (
        <motion.div
          key={index}
          className={`${metric.bgColor} rounded-lg p-3 sm:p-4 text-center`}
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
            className="text-xs text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: metric.delay + 1, duration: 0.5 }}
          >
            {metric.label}
          </motion.div>
          {/* Comparison text for each metric */}
          {index === 0 && (
            <motion.div 
              className="text-xs text-green-600 mt-1 font-medium flex items-center justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: metric.delay + 1.2, duration: 0.5 }}
            >
              <TrendingUp className="h-3 w-3" />
              12s faster vs last month
            </motion.div>
          )}
          {index === 1 && (
            <motion.div 
              className="text-xs text-green-600 mt-1 font-medium flex items-center justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: metric.delay + 1.2, duration: 0.5 }}
            >
              <TrendingUp className="h-3 w-3" />
              +15% vs last month
            </motion.div>
          )}
          {index === 2 && (
            <motion.div 
              className="text-xs text-green-600 mt-1 font-medium flex items-center justify-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: metric.delay + 1.2, duration: 0.5 }}
            >
              <TrendingUp className="h-3 w-3" />
              +0.8x vs last month
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  )
} 