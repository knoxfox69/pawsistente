// Purpose: Prometheus metrics endpoint
// Context: Exposes application metrics in Prometheus format for monitoring
import type { RequestHandler } from './$types';
import { getMetrics, updateAccessCodeMetrics, updateLaunchDateMetric } from '$lib/utils/metrics';
import { accessCodes, deviceSessions, isLaunchDateReached } from '$lib/utils/accessCodes';

export const GET: RequestHandler = async ({ request, setHeaders }) => {
	try {
		// Purpose: Update metrics with current application state
		// Context: Ensures metrics reflect real-time application data
		updateAccessCodeMetrics(accessCodes, deviceSessions);
		updateLaunchDateMetric(isLaunchDateReached());

		// Set appropriate headers for Prometheus
		setHeaders({
			'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		});

		// Return metrics in Prometheus format
		return new Response(getMetrics());
	} catch (error) {
		console.error('Metrics endpoint error:', error);
		return new Response('Error generating metrics', { status: 500 });
	}
};
