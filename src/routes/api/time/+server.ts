// Purpose: API endpoint for server time validation
// Context: Provides server time to prevent client clock manipulation
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getServerTime, isLaunchDateReached } from '$lib/utils/accessCodes';

export const GET: RequestHandler = async () => {
	try {
		const timeInfo = getServerTime();
		const launchReached = isLaunchDateReached();
		
		return json({
			...timeInfo,
			launchReached,
			success: true
		});
	} catch (error) {
		console.error('Time API error:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};
