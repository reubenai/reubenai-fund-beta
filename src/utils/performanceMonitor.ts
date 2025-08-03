/**
 * Performance monitoring utility for production readiness
 * Tracks critical metrics and provides insights for optimization
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

interface WebVitals {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitals = {};
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Track API call performance
   */
  trackAPICall(endpoint: string, duration: number, success: boolean) {
    this.addMetric('api_call', duration, {
      endpoint,
      success,
      threshold_exceeded: duration > 3000
    });

    // Log slow API calls in production
    if (this.isProduction && duration > 5000) {
      console.warn(`Slow API call detected: ${endpoint} took ${duration}ms`);
    }
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number) {
    this.addMetric('component_render', renderTime, {
      component: componentName,
      slow_render: renderTime > 16 // 60fps threshold
    });
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(action: string, duration: number) {
    this.addMetric('user_interaction', duration, {
      action,
      responsive: duration < 100 // User perception threshold
    });
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.addMetric('memory_usage', memory.usedJSHeapSize, {
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usage_percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      });
    }
  }

  /**
   * Track bundle loading performance
   */
  trackBundleLoad(bundleName: string, loadTime: number) {
    this.addMetric('bundle_load', loadTime, {
      bundle: bundleName,
      slow_load: loadTime > 1000
    });
  }

  /**
   * Collect Web Vitals
   */
  collectWebVitals() {
    // FCP - First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) {
      this.webVitals.fcp = fcpEntry.startTime;
    }

    // Navigation timing for TTFB
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.webVitals.ttfb = navigation.responseStart - navigation.requestStart;
    }

    // Monitor LCP through observer if available
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.webVitals.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Observer not supported
      }
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 300000); // Last 5 minutes

    const apiCalls = recentMetrics.filter(m => m.name === 'api_call');
    const slowCalls = apiCalls.filter(m => m.context?.threshold_exceeded);

    const renders = recentMetrics.filter(m => m.name === 'component_render');
    const slowRenders = renders.filter(m => m.context?.slow_render);

    return {
      webVitals: this.webVitals,
      apiPerformance: {
        totalCalls: apiCalls.length,
        slowCalls: slowCalls.length,
        averageResponseTime: apiCalls.length > 0 
          ? apiCalls.reduce((sum, m) => sum + m.value, 0) / apiCalls.length 
          : 0
      },
      renderPerformance: {
        totalRenders: renders.length,
        slowRenders: slowRenders.length,
        averageRenderTime: renders.length > 0
          ? renders.reduce((sum, m) => sum + m.value, 0) / renders.length
          : 0
      },
      memoryUsage: this.getLatestMetric('memory_usage')?.context
    };
  }

  /**
   * Check if performance thresholds are met
   */
  checkPerformanceThresholds(): { passed: boolean; issues: string[] } {
    const summary = this.getPerformanceSummary();
    const issues: string[] = [];

    // Check Web Vitals
    if (summary.webVitals.fcp && summary.webVitals.fcp > 1800) {
      issues.push(`Slow First Contentful Paint: ${summary.webVitals.fcp}ms (should be < 1800ms)`);
    }
    if (summary.webVitals.lcp && summary.webVitals.lcp > 2500) {
      issues.push(`Slow Largest Contentful Paint: ${summary.webVitals.lcp}ms (should be < 2500ms)`);
    }
    if (summary.webVitals.ttfb && summary.webVitals.ttfb > 800) {
      issues.push(`Slow Time to First Byte: ${summary.webVitals.ttfb}ms (should be < 800ms)`);
    }

    // Check API performance
    if (summary.apiPerformance.averageResponseTime > 2000) {
      issues.push(`Slow average API response: ${summary.apiPerformance.averageResponseTime}ms`);
    }

    // Check render performance
    if (summary.renderPerformance.averageRenderTime > 16) {
      issues.push(`Slow component renders: ${summary.renderPerformance.averageRenderTime}ms average`);
    }

    // Check memory usage
    const memUsage = summary.memoryUsage?.usage_percentage;
    if (memUsage && memUsage > 80) {
      issues.push(`High memory usage: ${memUsage.toFixed(1)}%`);
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(timeframe: 'hour' | 'day' | 'all' = 'hour') {
    const now = Date.now();
    const timeframeMs = timeframe === 'hour' ? 3600000 : timeframe === 'day' ? 86400000 : Infinity;
    
    return this.metrics.filter(m => now - m.timestamp < timeframeMs);
  }

  private addMetric(name: string, value: number, context?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private getLatestMetric(name: string) {
    return this.metrics
      .filter(m => m.name === name)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * HOC for tracking component render performance
 */
export function withPerformanceTracking<T extends Record<string, any>>(
  Component: any,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: T) {
    const renderStart = performance.now();
    
    // Track render time after component mounts
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const renderEnd = performance.now();
        performanceMonitor.trackComponentRender(componentName, renderEnd - renderStart);
      }, 0);
    }

    return Component(props);
  };
}

/**
 * Hook for tracking API calls
 */
export function useAPIPerformanceTracking() {
  return (endpoint: string, duration: number, success: boolean) => {
    performanceMonitor.trackAPICall(endpoint, duration, success);
  };
}

// Initialize Web Vitals collection on module load
if (typeof window !== 'undefined') {
  performanceMonitor.collectWebVitals();
  
  // Track memory usage periodically
  setInterval(() => {
    performanceMonitor.trackMemoryUsage();
  }, 30000); // Every 30 seconds
}
