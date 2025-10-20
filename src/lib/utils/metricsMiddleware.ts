// Purpose: Middleware for automatic metrics collection
// Context: Provides request tracking and performance monitoring for all HTTP requests

import { httpRequestsTotal, httpRequestDuration, trackRequest, trackApiResponseTime } from './metrics';

// Purpose: Track HTTP request metrics
// Context: Wraps request handlers to automatically collect metrics
export function withMetrics(handler: any) {
  return async (event: any) => {
    const startTime = Date.now();
    const { request, url } = event;
    const method = request.method;
    const route = url.pathname;
    
    try {
      // Track the request
      trackRequest();
      
      // Execute the handler
      const response = await handler(event);
      
      // Calculate duration
      const duration = (Date.now() - startTime) / 1000;
      const status = response.status.toString();
      
      // Record metrics
      httpRequestsTotal.inc({ method, route, status });
      httpRequestDuration.observe({ method, route, status }, duration);
      trackApiResponseTime(route, method, status, duration);
      
      return response;
    } catch (error) {
      // Calculate duration even for errors
      const duration = (Date.now() - startTime) / 1000;
      const status = '500';
      
      // Record error metrics
      httpRequestsTotal.inc({ method, route, status });
      httpRequestDuration.observe({ method, route, status }, duration);
      trackApiResponseTime(route, method, status, duration);
      
      throw error;
    }
  };
}

// Purpose: Track page load times on the client side
// Context: Provides client-side performance tracking
export function trackClientPageLoad(page: string) {
  if (typeof window !== 'undefined') {
    // Track page view
    const userAgent = navigator.userAgent;
    
    // Measure page load time
    const loadTime = performance.now() / 1000; // Convert to seconds
    
    // Send to metrics endpoint
    fetch('/api/metrics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'page_load',
        page,
        userAgent,
        duration: loadTime
      })
    }).catch(console.error);
  }
}

// Purpose: Track page views on the client side
// Context: Provides client-side page view tracking
export function trackClientPageView(page: string) {
  if (typeof window !== 'undefined') {
    const userAgent = navigator.userAgent;
    
    fetch('/api/metrics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'page_view',
        page,
        userAgent
      })
    }).catch(console.error);
  }
}

// Purpose: Track app visits on the client side
// Context: Provides client-side app visit tracking
export function trackClientAppVisit(entryPoint: string) {
  if (typeof window !== 'undefined') {
    fetch('/api/metrics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'app_visit',
        entryPoint
      })
    }).catch(console.error);
  }
}
