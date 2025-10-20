// Purpose: In-memory metrics storage for Prometheus
// Context: Stores metrics data that gets exposed via the /api/metrics endpoint

// In-memory metrics storage (in production, this would be in a database)
let metricsStore = {
	pageViews: new Map<string, number>(),
	appVisits: new Map<string, number>(),
	eventsAdded: new Map<string, number>(),
	eventsRemoved: new Map<string, number>(),
	pageLoadTimes: new Map<string, number[]>(),
	httpRequests: new Map<string, number>(),
	requestCount: 0,
	startTime: Date.now()
};

// Purpose: Update metrics from tracking endpoint
// Context: Called by the tracking endpoint to update metrics
export function updateMetrics(type: string, data: any) {
	switch (type) {
		case 'page_view':
			const pageKey = `page="${data.page}",user_agent_type="${data.user_agent_type}"`;
			metricsStore.pageViews.set(pageKey, (metricsStore.pageViews.get(pageKey) || 0) + 1);
			break;
			
		case 'app_visit':
			const visitKey = `entry_point="${data.entryPoint}"`;
			metricsStore.appVisits.set(visitKey, (metricsStore.appVisits.get(visitKey) || 0) + 1);
			break;
			
		case 'page_load':
			const loadKey = `page="${data.page}",user_agent_type="${data.user_agent_type}"`;
			if (!metricsStore.pageLoadTimes.has(loadKey)) {
				metricsStore.pageLoadTimes.set(loadKey, []);
			}
			metricsStore.pageLoadTimes.get(loadKey)!.push(data.duration);
			break;
			
		case 'event_added':
			const addKey = `event_id="${data.eventId}",event_name="${data.eventName}",day="${data.day}"`;
			metricsStore.eventsAdded.set(addKey, (metricsStore.eventsAdded.get(addKey) || 0) + 1);
			break;
			
		case 'event_removed':
			const removeKey = `event_id="${data.eventId}",event_name="${data.eventName}",day="${data.day}"`;
			metricsStore.eventsRemoved.set(removeKey, (metricsStore.eventsRemoved.get(removeKey) || 0) + 1);
			break;
	}
}

// Purpose: Get current metrics store
// Context: Used by the metrics endpoint to generate Prometheus format
export function getMetricsStore() {
	return metricsStore;
}

// Purpose: Increment request counter
// Context: Called on each metrics endpoint request
export function incrementRequestCount() {
	metricsStore.requestCount++;
}

// Purpose: Track HTTP request
// Context: Called for each HTTP request to update metrics
export function trackHttpRequest(method: string, path: string, statusCode: number) {
	const key = `method="${method}",path="${path}",status="${statusCode}"`;
	metricsStore.httpRequests.set(key, (metricsStore.httpRequests.get(key) || 0) + 1);
}
