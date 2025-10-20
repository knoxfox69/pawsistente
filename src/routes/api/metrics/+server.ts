// Purpose: Prometheus metrics endpoint
// Context: Exposes application metrics in Prometheus format for monitoring
import type { RequestHandler } from './$types';
import { getMetricsStore, incrementRequestCount } from '$lib/utils/metricsStore';
import { withMetrics } from '$lib/utils/httpMetrics';

export const GET: RequestHandler = withMetrics(async ({ request, setHeaders, getClientAddress }) => {
	try {
		// Security: Only allow connections from Prometheus container
		const clientIP = getClientAddress();
		const forwardedFor = request.headers.get('x-forwarded-for');
		const realIP = request.headers.get('x-real-ip');
		
		// Check if request is from Prometheus container or internal network
		const isAllowed = isPrometheusRequest(clientIP, forwardedFor, realIP);
		
		if (!isAllowed) {
			console.warn(`Blocked metrics request from unauthorized IP: ${clientIP} (forwarded: ${forwardedFor}, real: ${realIP})`);
			return new Response('Forbidden', { status: 403 });
		}

		// Set appropriate headers for Prometheus
		setHeaders({
			'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		});

		// Generate metrics in Prometheus format
		const metrics = generatePrometheusMetrics();

		return new Response(metrics);
	} catch (error) {
		console.error('Metrics endpoint error:', error);
		return new Response('Error generating metrics', { status: 500 });
	}
}, { method: 'GET', path: '/api/metrics' });

// Purpose: Generate Prometheus-formatted metrics
// Context: Converts stored metrics to Prometheus exposition format
function generatePrometheusMetrics(): string {
	const lines: string[] = [];
	const metricsStore = getMetricsStore();

	// App info
	lines.push('# HELP pawsistente_app_info Application information');
	lines.push('# TYPE pawsistente_app_info gauge');
	lines.push('pawsistente_app_info{version="1.0.0"} 1');

	// Uptime
	lines.push('# HELP pawsistente_uptime_seconds Application uptime in seconds');
	lines.push('# TYPE pawsistente_uptime_seconds counter');
	lines.push(`pawsistente_uptime_seconds ${Math.floor((Date.now() - metricsStore.startTime) / 1000)}`);

	// Request count
	lines.push('# HELP pawsistente_total_requests Total number of requests');
	lines.push('# TYPE pawsistente_total_requests counter');
	lines.push(`pawsistente_total_requests ${metricsStore.requestCount}`);

	// HTTP requests
	lines.push('# HELP pawsistente_http_requests_total Total number of HTTP requests');
	lines.push('# TYPE pawsistente_http_requests_total counter');
	for (const [key, count] of metricsStore.httpRequests.entries()) {
		lines.push(`pawsistente_http_requests_total{${key}} ${count}`);
	}

	// Page views
	lines.push('# HELP pawsistente_page_views_total Total number of page views');
	lines.push('# TYPE pawsistente_page_views_total counter');
	for (const [key, count] of metricsStore.pageViews.entries()) {
		lines.push(`pawsistente_page_views_total{${key}} ${count}`);
	}

	// App visits
	lines.push('# HELP pawsistente_app_visits_total Total number of app visits');
	lines.push('# TYPE pawsistente_app_visits_total counter');
	for (const [key, count] of metricsStore.appVisits.entries()) {
		lines.push(`pawsistente_app_visits_total{${key}} ${count}`);
	}

	// Events added
	lines.push('# HELP pawsistente_events_added_total Total number of events added');
	lines.push('# TYPE pawsistente_events_added_total counter');
	for (const [key, count] of metricsStore.eventsAdded.entries()) {
		lines.push(`pawsistente_events_added_total{${key}} ${count}`);
	}

	// Events removed
	lines.push('# HELP pawsistente_events_removed_total Total number of events removed');
	lines.push('# TYPE pawsistente_events_removed_total counter');
	for (const [key, count] of metricsStore.eventsRemoved.entries()) {
		lines.push(`pawsistente_events_removed_total{${key}} ${count}`);
	}

	// Page load times (as histograms)
	lines.push('# HELP pawsistente_page_load_duration_seconds Page load duration in seconds');
	lines.push('# TYPE pawsistente_page_load_duration_seconds histogram');
	for (const [key, times] of metricsStore.pageLoadTimes.entries()) {
		if (times.length > 0) {
			const sum = times.reduce((a, b) => a + b, 0);
			const count = times.length;
			lines.push(`pawsistente_page_load_duration_seconds_bucket{${key},le="0.1"} ${times.filter(t => t <= 0.1).length}`);
			lines.push(`pawsistente_page_load_duration_seconds_bucket{${key},le="0.5"} ${times.filter(t => t <= 0.5).length}`);
			lines.push(`pawsistente_page_load_duration_seconds_bucket{${key},le="1.0"} ${times.filter(t => t <= 1.0).length}`);
			lines.push(`pawsistente_page_load_duration_seconds_bucket{${key},le="+Inf"} ${count}`);
			lines.push(`pawsistente_page_load_duration_seconds_sum{${key}} ${sum}`);
			lines.push(`pawsistente_page_load_duration_seconds_count{${key}} ${count}`);
		}
	}

	return lines.join('\n') + '\n';
}

// Purpose: Check if request is from Prometheus container or internal network
// Context: Security function to restrict metrics access to authorized sources
function isPrometheusRequest(clientIP: string, forwardedFor: string | null, realIP: string | null): boolean {
	// Allow requests from Docker internal networks only
	const allowedNetworks = [
		'172.', // Docker default bridge network
		'192.168.', // Docker custom networks
		'10.', // Docker custom networks
		'127.0.0.1', // Localhost
		'::1', // IPv6 localhost
		'localhost'
	];
	
	// Check client IP
	const isClientAllowed = allowedNetworks.some(network => 
		clientIP.startsWith(network) || clientIP === network
	);
	
	// Check forwarded headers
	const forwardedIPs = forwardedFor ? forwardedFor.split(',').map(ip => ip.trim()) : [];
	const realIPs = realIP ? [realIP] : [];
	
	const allIPs = [clientIP, ...forwardedIPs, ...realIPs];
	const isAnyIPAllowed = allIPs.some(ip => 
		allowedNetworks.some(network => ip.startsWith(network) || ip === network)
	);
	
	// Allow if any IP in the chain is from an allowed network
	return isClientAllowed || isAnyIPAllowed;
}
