'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Zap, Star } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

export default function AnimatedLevelUp() {
  const [isVisible, setIsVisible] = useState(false)
  const [showPowerUp, setShowPowerUp] = useState(false)
  const [showPlusOne, setShowPlusOne] = useState(false)
  const [powerUpHit, setPowerUpHit] = useState(false)
  const levelUpRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const shouldReduceMotion = useReducedMotion()

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

    // On mobile or reduced-motion, minimize chained effects
    const hitDelayMs = shouldReduceMotion || isMobile ? 800 : 1200
    const plusOneDelayMs = shouldReduceMotion || isMobile ? 1200 : 1800

    setShowPowerUp(true)

    const hitTimer = setTimeout(() => {
      setPowerUpHit(true)
    }, hitDelayMs)

    const plusOneTimer = setTimeout(() => {
      setShowPlusOne(true)
    }, plusOneDelayMs)

    return () => {
      clearTimeout(hitTimer)
      clearTimeout(plusOneTimer)
    }
  }, [isVisible, isMobile, shouldReduceMotion])

  return (
    <div className="px-2 sm:px-0">
      {isMobile ? (
        // Mobile: Single container with proper text flow
        <h2 ref={levelUpRef} className="text-2xl font-bold text-gray-900 text-center">
          Everything You Need to <span className="text-indigo-600">Level Up</span>
        </h2>
      ) : (
        // Desktop: Centered container with relative positioning for effects
        <div className="text-center">
          <div
            ref={levelUpRef}
            className="relative inline-flex items-center gap-1"
          >
            {/* "Everything You Need to" - static text */}
            <span className="text-3xl md:text-4xl font-bold text-gray-900">
              Everything You Need to{' '}
            </span>

            {/* "Level" - static text */}
            <span className="text-3xl md:text-4xl font-bold text-gray-900">
              Level
            </span>

            {/* "Up" - animated flying text */}
            <motion.span
              className="text-3xl md:text-4xl font-bold text-indigo-600 relative"
        initial={shouldReduceMotion ? { opacity: 1 } : {
          opacity: 0,
          x: 0,
          y: 50,
          rotate: 15,
          scale: 0.8
        }}
        animate={isVisible ? (shouldReduceMotion ? { opacity: 1 } : {
          opacity: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1
        }) : (shouldReduceMotion ? { opacity: 1 } : {
          opacity: 0,
          x: 0,
          y: 50,
          rotate: 15,
          scale: 0.8
        })}
        transition={shouldReduceMotion ? { duration: 0 } : {
          duration: 1.2,
          ease: 'easeOut',
          type: 'spring',
          stiffness: 150,
          damping: 12
        }}
      >
        Up
      </motion.span>

            {/* Power-up effect - desktop only */}
            <AnimatePresence>
              {showPowerUp && !shouldReduceMotion && !isMobile && (
                <motion.div
                  className="absolute -top-2 -right-2 pointer-events-none"
                  initial={{ opacity: 0, scale: 0, rotate: 0 }}
                  animate={{
                    opacity: powerUpHit ? 0 : 1,
                    scale: powerUpHit ? 0.5 : 1,
                    rotate: powerUpHit ? 720 : 360
                  }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 720 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                >
                  {/* Power-up burst effect */}
                  <div className="relative">
                    {/* Main power-up icon */}
                    <motion.div
                      className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
                      animate={shouldReduceMotion ? undefined : {
                        scale: [1, 1.15, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(251, 191, 36, 0.7)',
                          '0 0 0 10px rgba(251, 191, 36, 0)',
                          '0 0 0 0 rgba(251, 191, 36, 0)'
                        ]
                      }}
                      transition={shouldReduceMotion ? { duration: 0 } : {
                        duration: 2.5,
                        repeat: shouldReduceMotion ? 0 : 2,
                        ease: 'easeInOut'
                      }}
                    >
                      <Zap className="h-4 w-4 text-white" />
                    </motion.div>

                    {/* Radiating circles */}
                    {!(shouldReduceMotion || isMobile) && [...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 border-2 border-yellow-400 rounded-full"
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ 
                          scale: [1, 2 + i * 0.5], 
                          opacity: [0.8, 0]
                        }}
                        transition={{ duration: 2.0, delay: i * 0.3, ease: 'easeOut' }}
                      />
                    ))}

                    {/* Sparkle effects */}
                    {!(shouldReduceMotion || isMobile) && [...Array(6)].map((_, i) => (
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
                        transition={{ duration: 1.4, delay: 0.5 + i * 0.15, ease: 'easeOut' }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* +1 Achievement popup - desktop only */}
            <AnimatePresence>
              {showPlusOne && !isMobile && (
                <motion.div
                  className="absolute -top-8 -right-8 pointer-events-none"
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.8 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: -10, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 0.8 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
                >
                  <motion.div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1"
                    animate={shouldReduceMotion ? undefined : {
                      y: [-10, -15, -10],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : {
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <Star className="h-3 w-3" />
                    +1
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
