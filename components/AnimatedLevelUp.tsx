'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Zap, Star } from 'lucide-react'

export default function AnimatedLevelUp() {
  const [isVisible, setIsVisible] = useState(false)
  const [showPowerUp, setShowPowerUp] = useState(false)
  const [showPlusOne, setShowPlusOne] = useState(false)
  const [powerUpHit, setPowerUpHit] = useState(false)
  const levelUpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
          observer.disconnect() // Only trigger once
        }
      },
      { threshold: 0.3 } // Trigger when 30% of the element is visible
    )

    if (levelUpRef.current) {
      observer.observe(levelUpRef.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    // Show power-up immediately when scrolled into view
    setShowPowerUp(true)

    // "Up" hits the power-up after flying in
    const hitTimer = setTimeout(() => {
      setPowerUpHit(true)
    }, 1200)

    // Show the +1 achievement after power-up is hit
    const plusOneTimer = setTimeout(() => {
      setShowPlusOne(true)
    }, 1800)

    return () => {
      clearTimeout(hitTimer)
      clearTimeout(plusOneTimer)
    }
  }, [isVisible])

  return (
    <div ref={levelUpRef} className="relative inline-flex items-center gap-1">
      {/* "Everything You Need to" - static text */}
      <span className="text-3xl sm:text-4xl font-bold text-gray-900">
        Everything You Need to{' '}
      </span>
      
      {/* "Level" - static text */}
      <span className="text-3xl sm:text-4xl font-bold text-gray-900">
        Level
      </span>

      {/* "Up" - animated flying text */}
      <motion.span
        className="text-3xl sm:text-4xl font-bold text-indigo-600 relative"
        initial={{ 
          opacity: 0, 
          x: 0, 
          y: 50,
          rotate: 15,
          scale: 0.8
        }}
        animate={isVisible ? { 
          opacity: 1, 
          x: 0, 
          y: 0,
          rotate: 0,
          scale: 1
        } : {
          opacity: 0, 
          x: 0, 
          y: 50,
          rotate: 15,
          scale: 0.8
        }}
        transition={{ 
          duration: 1.2, 
          ease: "easeOut",
          type: "spring",
          stiffness: 150,
          damping: 12
        }}
      >
        Up
      </motion.span>

      {/* Power-up effect */}
      <AnimatePresence>
        {showPowerUp && (
          <motion.div
            className="absolute -top-2 -right-2"
            initial={{ 
              opacity: 0, 
              scale: 0,
              rotate: 0
            }}
            animate={{ 
              opacity: powerUpHit ? 0 : 1, 
              scale: powerUpHit ? 0.5 : 1,
              rotate: powerUpHit ? 720 : 360
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.5,
              rotate: 720
            }}
                         transition={{ 
               duration: powerUpHit ? 0.6 : 1.2,
               ease: "easeOut"
             }}
          >
            {/* Power-up burst effect */}
            <div className="relative">
              {/* Main power-up icon */}
              <motion.div
                className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                animate={{
                  scale: [1, 1.2, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(251, 191, 36, 0.7)",
                    "0 0 0 10px rgba(251, 191, 36, 0)",
                    "0 0 0 0 rgba(251, 191, 36, 0)"
                  ]
                }}
                                 transition={{
                   duration: 2.5,
                   repeat: 2,
                   ease: "easeInOut"
                 }}
              >
                <Zap className="h-4 w-4 text-white" />
              </motion.div>

              {/* Radiating circles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 border-2 border-yellow-400 rounded-full"
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ 
                    scale: [1, 2 + i * 0.5], 
                    opacity: [0.8, 0]
                  }}
                                     transition={{
                     duration: 2.0,
                     delay: i * 0.3,
                     ease: "easeOut"
                   }}
                />
              ))}

              {/* Sparkle effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 0,
                    scale: 0
                  }}
                  animate={{ 
                    x: Math.cos(i * 60 * Math.PI / 180) * 20,
                    y: Math.sin(i * 60 * Math.PI / 180) * 20,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0]
                  }}
                                     transition={{
                     duration: 1.4,
                     delay: 0.5 + i * 0.15,
                     ease: "easeOut"
                   }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* +1 Achievement popup */}
      <AnimatePresence>
        {showPlusOne && (
          <motion.div
            className="absolute -top-8 -right-8"
            initial={{ 
              opacity: 0, 
              y: 20,
              scale: 0.8
            }}
            animate={{ 
              opacity: 1, 
              y: -10,
              scale: 1
            }}
            exit={{ 
              opacity: 0, 
              y: -30,
              scale: 0.8
            }}
                         transition={{ 
               duration: 1.0,
               ease: "easeOut"
             }}
          >
            <motion.div
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1"
              animate={{
                y: [-10, -15, -10],
                rotate: [0, 5, -5, 0]
              }}
                             transition={{
                 duration: 3,
                 repeat: Infinity,
                 ease: "easeInOut"
               }}
            >
              <Star className="h-3 w-3" />
              +1
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
