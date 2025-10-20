// Purpose: HTTP request metrics tracking
// Context: Automatically tracks HTTP requests for Prometheus metrics

import { incrementRequestCount, trackHttpRequest as trackHttp } from './metricsStore';

// Purpose: Track HTTP request
// Context: Called for each HTTP request to update metrics
export function trackHttpRequest(method: string, path: string, statusCode: number, duration: number) {
	// Increment total request count
	incrementRequestCount();
	
	// Track detailed HTTP request
	trackHttp(method, path, statusCode);
}

// Purpose: Middleware wrapper for SvelteKit
// Context: Wraps request handlers to automatically track metrics
export function withMetrics<T extends (...args: any[]) => any>(
	handler: T,
	options?: { method?: string; path?: string }
): T {
	return (async (...args: any[]) => {
		const startTime = Date.now();
		let statusCode = 200;
		
		try {
			const result = await handler(...args);
			statusCode = result?.status || 200;
			return result;
		} catch (error) {
			statusCode = 500;
			throw error;
		} finally {
			const duration = Date.now() - startTime;
			const method = options?.method || 'GET';
			const path = options?.path || 'unknown';
			
			trackHttpRequest(method, path, statusCode, duration);
		}
	}) as T;
}
