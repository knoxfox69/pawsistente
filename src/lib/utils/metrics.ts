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
