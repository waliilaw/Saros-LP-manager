import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  interactionTime?: number;
  memoryUsage?: number;
}

const PERFORMANCE_THRESHOLD = {
  renderTime: 16, // ms (targeting 60fps)
  interactionTime: 100, // ms
};

export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef<number>(0);
  const interactionStartTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;

      const metrics: PerformanceMetrics = {
        componentName,
        renderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
      };

      // Log performance metrics
      logPerformanceMetrics(metrics);
    };
  }, [componentName]);

  const trackInteraction = (interactionName: string) => {
    interactionStartTime.current = performance.now();

    return () => {
      const endTime = performance.now();
      const interactionTime = endTime - interactionStartTime.current;

      const metrics: PerformanceMetrics = {
        componentName: `${componentName}:${interactionName}`,
        renderTime: 0,
        interactionTime,
      };

      logPerformanceMetrics(metrics);
    };
  };

  return { trackInteraction };
}

function logPerformanceMetrics(metrics: PerformanceMetrics) {
  // Only log in development or if performance monitoring is enabled
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING) {
    const warnings: string[] = [];

    if (metrics.renderTime > PERFORMANCE_THRESHOLD.renderTime) {
      warnings.push(`High render time: ${metrics.renderTime.toFixed(2)}ms`);
    }

    if (metrics.interactionTime && metrics.interactionTime > PERFORMANCE_THRESHOLD.interactionTime) {
      warnings.push(`Slow interaction: ${metrics.interactionTime.toFixed(2)}ms`);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`Performance Metrics: ${metrics.componentName}`);
      console.log('Render Time:', `${metrics.renderTime.toFixed(2)}ms`);
      if (metrics.interactionTime) {
        console.log('Interaction Time:', `${metrics.interactionTime.toFixed(2)}ms`);
      }
      if (metrics.memoryUsage) {
        console.log('Memory Usage:', `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      }
      if (warnings.length > 0) {
        console.warn('⚠️ Performance Warnings:', warnings);
      }
      console.groupEnd();
    }

    // In production, send metrics to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement production monitoring service integration
      // sendMetricsToMonitoringService(metrics);
    }
  }
}
