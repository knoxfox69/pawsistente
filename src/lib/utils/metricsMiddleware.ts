// Purpose: Middleware for automatic metrics collection
// Context: Provides request tracking and performance monitoring for all HTTP requests

// Purpose: Server-only metrics middleware
// Context: Provides request tracking and performance monitoring for all HTTP requests

let httpRequestsTotal: any, httpRequestDuration: any, trackRequest: any, trackApiResponseTime: any;

// Lazy load metrics only on server
async function loadServerMetrics() {
  if (typeof window !== 'undefined') {
    throw new Error('Server metrics middleware cannot be used in client-side code');
  }
  
  if (!httpRequestsTotal) {
    const metrics = await import('./metrics');
    httpRequestsTotal = metrics.httpRequestsTotal;
    httpRequestDuration = metrics.httpRequestDuration;
    trackRequest = metrics.trackRequest;
    trackApiResponseTime = metrics.trackApiResponseTime;
  }
}

// Purpose: Track HTTP request metrics
// Context: Wraps request handlers to automatically collect metrics
export function withMetrics(handler: any) {
  return async (event: any) => {
    const startTime = Date.now();
    const { request, url } = event;
    const method = request.method;
    const route = url.pathname;
    
    try {
      // Load server metrics
      await loadServerMetrics();
      
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
      // Load server metrics for error tracking
      await loadServerMetrics();
      
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

