// Purpose: Server-only metrics wrapper
// Context: Ensures metrics are only loaded on the server side

// Purpose: Get server-side metrics module
// Context: Lazy loads metrics only when needed on server
async function getServerMetrics() {
  if (typeof window !== 'undefined') {
    throw new Error('Server metrics cannot be used in client-side code');
  }
  
  // Dynamic import for server-side
  const metrics = await import('./metrics');
  return metrics;
}

// Purpose: Server-side metrics functions
// Context: Wraps all metrics functions to ensure server-only execution
export async function getMetrics(): Promise<string> {
  const m = await getServerMetrics();
  return m.getMetrics();
}

export async function updateAccessCodeMetrics(accessCodes: Map<string, any>, deviceSessions: Map<string, any[]>): Promise<void> {
  const m = await getServerMetrics();
  return m.updateAccessCodeMetrics(accessCodes, deviceSessions);
}

export async function updateLaunchDateMetric(hasReached: boolean): Promise<void> {
  const m = await getServerMetrics();
  return m.updateLaunchDateMetric(hasReached);
}

export async function trackEventAdded(eventId: string, eventName: string, day: string): Promise<void> {
  const m = await getServerMetrics();
  return m.trackEventAdded(eventId, eventName, day);
}

export async function trackEventRemoved(eventId: string, eventName: string, day: string): Promise<void> {
  const m = await getServerMetrics();
  return m.trackEventRemoved(eventId, eventName, day);
}

export async function trackPageView(page: string, userAgent: string): Promise<void> {
  const m = await getServerMetrics();
  return m.trackPageView(page, userAgent);
}

export async function trackAppVisit(entryPoint: string): Promise<void> {
  const m = await getServerMetrics();
  return m.trackAppVisit(entryPoint);
}

export async function trackPageLoadTime(page: string, userAgent: string, duration: number): Promise<void> {
  const m = await getServerMetrics();
  return m.trackPageLoadTime(page, userAgent, duration);
}

export async function trackApiResponseTime(endpoint: string, method: string, status: string, duration: number): Promise<void> {
  const m = await getServerMetrics();
  return m.trackApiResponseTime(endpoint, method, status, duration);
}

export async function trackRequest(): Promise<void> {
  const m = await getServerMetrics();
  return m.trackRequest();
}

export async function updateActiveUsers(count: number): Promise<void> {
  const m = await getServerMetrics();
  return m.updateActiveUsers(count);
}
