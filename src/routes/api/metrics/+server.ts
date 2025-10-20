// Purpose: Prometheus metrics endpoint
// Context: Exposes application metrics in Prometheus format for monitoring
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, setHeaders }) => {
	try {
		// Set appropriate headers for Prometheus
		setHeaders({
			'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		});

		// Return basic metrics for now
		const basicMetrics = `# HELP pawsistente_app_info Application information
# TYPE pawsistente_app_info gauge
pawsistente_app_info{version="1.0.0"} 1

# HELP pawsistente_uptime_seconds Application uptime in seconds
# TYPE pawsistente_uptime_seconds counter
pawsistente_uptime_seconds ${Math.floor(Date.now() / 1000)}

# HELP pawsistente_requests_total Total number of requests
# TYPE pawsistente_requests_total counter
pawsistente_requests_total 0
`;

		return new Response(basicMetrics);
	} catch (error) {
		console.error('Metrics endpoint error:', error);
		return new Response('Error generating metrics', { status: 500 });
	}
};
