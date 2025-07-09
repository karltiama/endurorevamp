/**
 * Performance monitoring utilities for development and production
 */

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map()
  private isEnabled: boolean

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                    process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true'
  }

  /**
   * Start timing a performance metric
   */
  start(name: string): void {
    if (!this.isEnabled) return
    this.metrics.set(name, performance.now())
  }

  /**
   * End timing and log the result
   */
  end(name: string): number | null {
    if (!this.isEnabled) return null
    
    const startTime = this.metrics.get(name)
    if (!startTime) {
      console.warn(`Performance: No start time found for "${name}"`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - startTime
    
    this.metrics.delete(name)
    
    // Log performance metrics with emojis for easy scanning
    if (duration > 1000) {
      console.warn(`🐌 SLOW: ${name} took ${duration.toFixed(2)}ms`)
    } else if (duration > 500) {
      console.log(`⚠️  MEDIUM: ${name} took ${duration.toFixed(2)}ms`)
    } else {
      console.log(`⚡ FAST: ${name} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  /**
   * Measure a function execution time
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }

  /**
   * Measure React component render time
   */
  measureRender(componentName: string) {
    if (!this.isEnabled) return { start: () => {}, end: () => {} }
    
    const key = `render-${componentName}`
    return {
      start: () => this.start(key),
      end: () => this.end(key)
    }
  }

  /**
   * Get Web Vitals if available
   */
  getWebVitals() {
    if (typeof window === 'undefined') return null
    
    return {
      // These would be populated by web-vitals library if you add it
      CLS: null,
      FID: null,
      FCP: null,
      LCP: null,
      TTFB: null,
    }
  }
}

// Export singleton instance
export const perf = new PerformanceMonitor()

/**
 * React hook for measuring component performance
 */
export function usePerformance(componentName: string) {
  const { start, end } = perf.measureRender(componentName)
  
  return {
    startRender: start,
    endRender: end,
    measureAsync: <T>(name: string, fn: () => Promise<T>) => 
      perf.measure(`${componentName}-${name}`, fn)
  }
}

/**
 * Decorator for measuring API route performance
 */
export function withPerformanceLogging<T extends unknown[], R>(
  name: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return perf.measure(name, () => fn(...args))
  }
} 