'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'

// Removed unused lineData and ChartData interface

const barData = [42, 58, 38, 67, 52, 78, 61, 83, 55, 72, 48, 89, 63, 76, 51, 68, 44, 81, 57, 74, 66, 49, 85, 71, 53, 79, 62, 88, 45, 73, 59, 82, 47, 69, 56, 77, 64, 91, 50, 75, 41, 86, 70, 54, 80, 65, 87, 43, 90, 60]

export default function AnimatedChart() {
  const [isVisible, setIsVisible] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect() // Only trigger once
        }
      },
      {
        threshold: 0.3, // Trigger when 30% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before it's fully in view
      }
    )

    if (chartRef.current) {
      observer.observe(chartRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={chartRef} className="bg-white rounded-lg border border-gray-200 p-4 h-32 overflow-hidden sm:overflow-visible">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-3">
        <motion.div 
          className="text-sm font-medium text-gray-900"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -10 }}
          transition={{ duration: 0.5 }}
        >
          Weekly Performance
        </motion.div>
                 <motion.div 
           className="text-xs text-gray-500"
           initial={{ opacity: 0 }}
           animate={{ opacity: isVisible ? 1 : 0 }}
           transition={{ duration: 0.5, delay: 0.2 }}
                   >
            Last 50 activities
          </motion.div>
      </div>

             {/* Chart Container */}
       <div className="relative h-20 overflow-hidden sm:overflow-visible">
         <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
          {/* Subtle grid lines */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 0.05 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {[10, 20, 30, 40].map((y) => (
              <line
                key={y}
                x1="5"
                y1={y}
                x2="95"
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            ))}
          </motion.g>

          {/* Animated Bars */}
          {barData.map((value, i) => (
            <motion.rect
              key={i}
              x={2 + (i * 1.92)}
              y={50 - (value * 35 / 100)}
              width="1.2"
              height={value * 35 / 100}
              fill="#6366f1"
              rx="0.2"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ 
                scaleY: isVisible ? 1 : 0, 
                opacity: isVisible ? 1 : 0 
              }}
              transition={{ 
                duration: 0.2, 
                delay: 0.5 + (i * 0.01),
                ease: "easeOut"
              }}
              style={{ transformOrigin: "bottom" }}
            />
          ))}


        </svg>
      </div>
    </div>
  )
} 