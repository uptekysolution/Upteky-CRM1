'use client'

import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
  renderTime: number
  memoryUsage: number
  isSlow: boolean
  warnings: string[]
}

interface PerformanceConfig {
  slowRenderThreshold: number // milliseconds
  memoryThreshold: number // MB
  enableLogging: boolean
}

const defaultConfig: PerformanceConfig = {
  slowRenderThreshold: 100, // 100ms
  memoryThreshold: 50, // 50MB
  enableLogging: process.env.NODE_ENV === 'development'
}

export function usePerformanceMonitor(
  componentName: string,
  config: Partial<PerformanceConfig> = {}
) {
  const mergedConfig = { ...defaultConfig, ...config }
  const renderStartTime = useRef<number>(0)
  const lastRenderTime = useRef<number>(0)
  const warnings = useRef<string[]>([])

  const logPerformance = useCallback((metrics: PerformanceMetrics) => {
    if (!mergedConfig.enableLogging) return

    const { renderTime, memoryUsage, isSlow, warnings: warningList } = metrics

    // Prevent excessive logging
    if (renderTime < 1) return // Skip very fast renders

    if (isSlow || warningList.length > 0) {
      console.warn(`[Performance] ${componentName}:`, {
        renderTime: `${renderTime}ms`,
        memoryUsage: `${memoryUsage}MB`,
        isSlow,
        warnings: warningList
      })
    } else {
      console.log(`[Performance] ${componentName}:`, {
        renderTime: `${renderTime}ms`,
        memoryUsage: `${memoryUsage}MB`
      })
    }
  }, [componentName, mergedConfig.enableLogging])

  const getMemoryUsage = useCallback((): number => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as any).memory
      if (memory) {
        return Math.round(memory.usedJSHeapSize / 1024 / 1024) // Convert to MB
      }
    }
    return 0
  }, [])

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now()
  }, [])

  const endRender = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current
    lastRenderTime.current = renderTime
    
    const memoryUsage = getMemoryUsage()
    const isSlow = renderTime > mergedConfig.slowRenderThreshold
    const memoryWarning = memoryUsage > mergedConfig.memoryThreshold

    warnings.current = []
    if (isSlow) {
      warnings.current.push(`Slow render: ${renderTime.toFixed(2)}ms`)
    }
    if (memoryWarning) {
      warnings.current.push(`High memory usage: ${memoryUsage}MB`)
    }

    const metrics: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      isSlow,
      warnings: warnings.current
    }

    // Only log if we have a valid render time
    if (renderStartTime.current > 0) {
      logPerformance(metrics)
    }
    return metrics
  }, [getMemoryUsage, mergedConfig, logPerformance])

  // Monitor for memory leaks
  useEffect(() => {
    let memoryLeakCheck: NodeJS.Timeout

    const checkMemoryLeak = () => {
      const memoryUsage = getMemoryUsage()
      if (memoryUsage > mergedConfig.memoryThreshold * 2) {
        console.warn(`[Memory Leak] ${componentName}: High memory usage detected: ${memoryUsage}MB`)
      }
    }

    if (mergedConfig.enableLogging) {
      memoryLeakCheck = setInterval(checkMemoryLeak, 30000) // Check every 30 seconds
    }

    return () => {
      if (memoryLeakCheck) {
        clearInterval(memoryLeakCheck)
      }
    }
  }, [componentName, getMemoryUsage, mergedConfig])

  // Monitor for long-running operations
  const monitorAsyncOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await operation()
      const duration = performance.now() - startTime
      
      if (duration > mergedConfig.slowRenderThreshold && mergedConfig.enableLogging) {
        console.warn(`[Async Operation] ${componentName}.${operationName}: ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`[Async Operation Error] ${componentName}.${operationName}: ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }, [componentName, mergedConfig])

  return {
    startRender,
    endRender,
    monitorAsyncOperation,
    getMetrics: () => ({
      renderTime: lastRenderTime.current,
      memoryUsage: getMemoryUsage(),
      warnings: warnings.current
    })
  }
}

// Hook for monitoring component re-renders
export function useRenderMonitor(componentName: string) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef<number>(0)

  useEffect(() => {
    renderCount.current++
    lastRenderTime.current = Date.now()

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render] ${componentName}: #${renderCount.current}`)
    }
  })

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current
  }
}

// Hook for monitoring data fetching performance
export function useDataFetchMonitor(componentName: string) {
  const fetchTimes = useRef<number[]>([])
  const errorCount = useRef(0)

  const recordFetch = useCallback((duration: number, success: boolean) => {
    fetchTimes.current.push(duration)
    
    if (!success) {
      errorCount.current++
    }

    // Keep only last 10 fetch times
    if (fetchTimes.current.length > 10) {
      fetchTimes.current.shift()
    }

    if (process.env.NODE_ENV === 'development') {
      const avgTime = fetchTimes.current.reduce((a, b) => a + b, 0) / fetchTimes.current.length
      console.log(`[Data Fetch] ${componentName}: ${duration.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms)`)
    }
  }, [componentName])

  const getStats = useCallback(() => {
    const times = fetchTimes.current
    if (times.length === 0) return null

    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)

    return {
      average: avg,
      min,
      max,
      count: times.length,
      errorCount: errorCount.current
    }
  }, [])

  return {
    recordFetch,
    getStats
  }
}

// Hook for monitoring user interactions
export function useInteractionMonitor(componentName: string) {
  const interactionTimes = useRef<Map<string, number[]>>(new Map())

  const recordInteraction = useCallback((interactionName: string, duration: number) => {
    if (!interactionTimes.current.has(interactionName)) {
      interactionTimes.current.set(interactionName, [])
    }

    const times = interactionTimes.current.get(interactionName)!
    times.push(duration)

    // Keep only last 20 interaction times
    if (times.length > 20) {
      times.shift()
    }

    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.warn(`[Slow Interaction] ${componentName}.${interactionName}: ${duration.toFixed(2)}ms`)
    }
  }, [componentName])

  const getInteractionStats = useCallback((interactionName: string) => {
    const times = interactionTimes.current.get(interactionName)
    if (!times || times.length === 0) return null

    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)

    return {
      average: avg,
      min,
      max,
      count: times.length
    }
  }, [])

  return {
    recordInteraction,
    getInteractionStats
  }
}
