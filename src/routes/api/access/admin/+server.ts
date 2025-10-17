// Purpose: Admin endpoint for viewing access code usage statistics
// Context: Provides real-time information about device usage per access code (localhost only)
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { accessCodes, deviceSessions } from '$lib/utils/accessCodes';

export const GET: RequestHandler = async ({ request }) => {
	try {
		// Purpose: Restrict access to localhost only
		// Context: Prevents unauthorized access to admin statistics
		const url = new URL(request.url);
		const hostname = url.hostname;
		
		if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
			return json({
				success: false,
				error: 'Access denied - admin endpoint only available on localhost'
			}, { status: 403 });
		}
		const usageStats = [];
		
		// Get all access codes and their usage
		for (const [code, accessCode] of accessCodes.entries()) {
			const sessions = deviceSessions.get(code) || [];
			const activeSessions = sessions.filter(session => session.expiresAt > new Date());
			
			usageStats.push({
				code: accessCode.code,
				maxDevices: accessCode.maxDevices,
				description: accessCode.description,
				currentDevices: activeSessions.length,
				availableSlots: accessCode.maxDevices - activeSessions.length,
				usagePercentage: Math.round((activeSessions.length / accessCode.maxDevices) * 100),
				activeDevices: activeSessions.map(session => ({
					deviceId: session.deviceId.substring(0, 8) + '...', // Truncated for privacy
					lastAccess: session.lastAccess.toISOString(),
					expiresAt: session.expiresAt.toISOString()
				}))
			});
		}
		
		return json({
			success: true,
			totalCodes: accessCodes.size,
			codes: usageStats,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Admin stats error:', error);
		return json({
			success: false,
			error: 'Error retrieving usage statistics'
		}, { status: 500 });
	}
};
