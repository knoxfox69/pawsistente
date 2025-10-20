// Purpose: Metrics collection for Prometheus monitoring
// Context: Provides application metrics for monitoring and alerting
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Purpose: Collect default Node.js metrics
// Context: Automatically collects standard Node.js performance metrics
collectDefaultMetrics();

// Purpose: HTTP request metrics
// Context: Tracks HTTP request volume and performance
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Purpose: Application-specific metrics
// Context: Tracks business logic metrics for the access control system
export const betaCodeValidations = new Counter({
  name: 'pawsistente_beta_code_validations_total',
  help: 'Total number of beta code validation attempts',
  labelNames: ['code', 'result']
});

export const activeSessions = new Gauge({
  name: 'pawsistente_active_sessions',
  help: 'Number of active beta sessions'
});

export const accessCodeUsage = new Gauge({
  name: 'pawsistente_access_code_usage',
  help: 'Usage percentage of access codes',
  labelNames: ['code']
});

export const launchDateReached = new Gauge({
  name: 'pawsistente_launch_date_reached',
  help: 'Whether the launch date has been reached (1 = yes, 0 = no)'
});

// Purpose: Event tracking metrics
// Context: Tracks when users add events to their schedule
export const eventsAdded = new Counter({
  name: 'pawsistente_events_added_total',
  help: 'Total number of events added by users',
  labelNames: ['event_id', 'event_name', 'day']
});

export const eventsRemoved = new Counter({
  name: 'pawsistente_events_removed_total',
  help: 'Total number of events removed by users',
  labelNames: ['event_id', 'event_name', 'day']
});

// Purpose: App usage metrics
// Context: Tracks general app usage and page visits
export const pageViews = new Counter({
  name: 'pawsistente_page_views_total',
  help: 'Total number of page views',
  labelNames: ['page', 'user_agent_type']
});

export const appVisits = new Counter({
  name: 'pawsistente_app_visits_total',
  help: 'Total number of app visits (unique sessions)',
  labelNames: ['entry_point']
});

export const activeUsers = new Gauge({
  name: 'pawsistente_active_users',
  help: 'Number of currently active users'
});

// Purpose: Performance metrics
// Context: Tracks app performance and load times
export const pageLoadTime = new Histogram({
  name: 'pawsistente_page_load_duration_seconds',
  help: 'Time taken to load pages',
  labelNames: ['page', 'user_agent_type'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 3, 5, 10]
});

export const apiResponseTime = new Histogram({
  name: 'pawsistente_api_response_duration_seconds',
  help: 'Time taken to respond to API requests',
  labelNames: ['endpoint', 'method', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

// Purpose: Request rate metrics
// Context: Tracks requests per second and throughput
export const requestsPerSecond = new Gauge({
  name: 'pawsistente_requests_per_second',
  help: 'Current requests per second'
});

export const totalRequests = new Counter({
  name: 'pawsistente_total_requests',
  help: 'Total number of requests processed'
});

// Purpose: Get all metrics in Prometheus format
// Context: Exports metrics for Prometheus scraping
export function getMetrics(): string {
  return register.metrics();
}

// Purpose: Update access code usage metrics
// Context: Called whenever access code usage changes
export function updateAccessCodeMetrics(accessCodes: Map<string, any>, deviceSessions: Map<string, any[]>): void {
  // Update active sessions count
  let totalActiveSessions = 0;
  
  for (const [code, sessions] of deviceSessions.entries()) {
    const activeSessionsCount = sessions.filter(session => session.expiresAt > new Date()).length;
    totalActiveSessions += activeSessionsCount;
    
    const accessCode = accessCodes.get(code);
    if (accessCode) {
      const usagePercentage = (activeSessionsCount / accessCode.maxDevices) * 100;
      accessCodeUsage.set({ code }, usagePercentage);
    }
  }
  
  activeSessions.set(totalActiveSessions);
}

// Purpose: Update launch date metric
// Context: Called to update whether launch date has been reached
export function updateLaunchDateMetric(hasReached: boolean): void {
  launchDateReached.set(hasReached ? 1 : 0);
}

// Purpose: Track event additions
// Context: Called when a user adds an event to their schedule
export function trackEventAdded(eventId: string, eventName: string, day: string): void {
  eventsAdded.inc({ event_id: eventId, event_name: eventName, day });
}

// Purpose: Track event removals
// Context: Called when a user removes an event from their schedule
export function trackEventRemoved(eventId: string, eventName: string, day: string): void {
  eventsRemoved.inc({ event_id: eventId, event_name: eventName, day });
}

// Purpose: Track page views
// Context: Called when a user visits a page
export function trackPageView(page: string, userAgent: string): void {
  const userAgentType = getUserAgentType(userAgent);
  pageViews.inc({ page, user_agent_type: userAgentType });
}

// Purpose: Track app visits
// Context: Called when a user first visits the app
export function trackAppVisit(entryPoint: string): void {
  appVisits.inc({ entry_point: entryPoint });
}

// Purpose: Track page load time
// Context: Called to measure how long pages take to load
export function trackPageLoadTime(page: string, userAgent: string, duration: number): void {
  const userAgentType = getUserAgentType(userAgent);
  pageLoadTime.observe({ page, user_agent_type: userAgentType }, duration);
}

// Purpose: Track API response time
// Context: Called to measure API response performance
export function trackApiResponseTime(endpoint: string, method: string, status: string, duration: number): void {
  apiResponseTime.observe({ endpoint, method, status }, duration);
}

// Purpose: Track request metrics
// Context: Called for each request to track RPS and total requests
export function trackRequest(): void {
  totalRequests.inc();
  // Update RPS gauge (this would typically be calculated over time)
  // For now, we'll use a simple approach
  requestsPerSecond.set(totalRequests.hashMap[''] || 0);
}

// Purpose: Update active users count
// Context: Called to update the number of currently active users
export function updateActiveUsers(count: number): void {
  activeUsers.set(count);
}

// Purpose: Helper function to categorize user agents
// Context: Simplifies user agent strings for metrics labeling
function getUserAgentType(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}
