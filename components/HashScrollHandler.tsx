'use client'

import { useEffect } from 'react'

export function HashScrollHandler() {
  useEffect(() => {
    // Handle scrolling to hash fragment on page load
    if (typeof window !== 'undefined' && window.location.hash) {
      const elementId = window.location.hash.substring(1)
      const element = document.getElementById(elementId)
      
      if (element) {
        // Wait for the page to fully load before scrolling
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          })
        }, 100)
      }
    }
  }, [])
  
  return null
} 