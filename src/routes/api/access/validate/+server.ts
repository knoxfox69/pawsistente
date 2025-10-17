// Purpose: API endpoint for validating beta access codes
// Context: Handles beta code validation and device session creation
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateAccessCode } from '$lib/utils/accessCodes';
import { v4 as uuidv4 } from 'uuid';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code } = await request.json();
		
		if (!code || typeof code !== 'string') {
			return json({
				success: false,
				error: 'Código de acceso requerido'
			}, { status: 400 });
		}
		
		// Generate unique device ID
		const deviceId = uuidv4();
		
		// Validate access code
		const result = validateAccessCode(code, deviceId);
		
		if (result.success) {
			return json({
				success: true,
				deviceId: result.deviceId,
				expiresAt: result.expiresAt,
				message: 'Acceso concedido'
			});
		} else {
			return json({
				success: false,
				error: result.error || 'Código de acceso inválido'
			}, { status: 403 });
		}
	} catch (error) {
		console.error('Access validation error:', error);
		return json({
			success: false,
			error: 'Error interno del servidor'
		}, { status: 500 });
	}
};
