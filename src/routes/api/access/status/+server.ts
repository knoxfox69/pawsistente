// Purpose: API endpoint for checking access status
// Context: Validates existing device sessions and access permissions
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateDeviceSession } from '$lib/utils/accessCodes';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { betaCode, deviceId, expiresAt } = await request.json();
		
		if (!betaCode || !deviceId || !expiresAt) {
			return json({
				success: false,
				error: 'Parámetros requeridos faltantes'
			}, { status: 400 });
		}
		
		// Validate device session
		const result = validateDeviceSession(betaCode, deviceId, expiresAt);
		
		return json({
			success: result.success,
			isValid: result.isValid,
			error: result.error
		});
	} catch (error) {
		console.error('Access status check error:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};
