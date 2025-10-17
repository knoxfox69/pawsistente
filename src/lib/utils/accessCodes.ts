// Purpose: CSV access codes reader and validator
// Context: Reads and validates beta access codes from CSV file
import { readFileSync } from 'fs';
import { join } from 'path';
import { LAUNCH_DATE } from '$lib/config/launchDate';

export interface AccessCode {
	code: string;
	maxDevices: number;
	description?: string;
}

export interface DeviceSession {
	deviceId: string;
	lastAccess: Date;
	expiresAt: Date;
}

// Purpose: In-memory storage for access codes and device sessions
// Context: Simulates database storage for access control
export const accessCodes = new Map<string, AccessCode>();
export const deviceSessions = new Map<string, DeviceSession[]>();

// Purpose: Load access codes from CSV file
// Context: Reads CSV file and populates access codes map
export function loadAccessCodes(): void {
	try {
		// Read CSV file from static directory
		const csvPath = join(process.cwd(), 'static', 'access_codes.csv');
		const csvContent = readFileSync(csvPath, 'utf-8');
		
		// Parse CSV content
		const lines = csvContent.trim().split('\n');
		const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
		
		// Find column indices
		const codeIndex = headers.findIndex(h => h.toLowerCase().includes('code'));
		const maxDevicesIndex = headers.findIndex(h => h.toLowerCase().includes('max') || h.toLowerCase().includes('devices'));
		const descriptionIndex = headers.findIndex(h => h.toLowerCase().includes('desc') || h.toLowerCase().includes('note'));
		
		if (codeIndex === -1) {
			throw new Error('Code column not found in CSV');
		}
		
		// Process each line (skip header)
		for (let i = 1; i < lines.length; i++) {
			const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
			
			if (values.length > codeIndex && values[codeIndex]) {
				const code = values[codeIndex];
				const maxDevices = maxDevicesIndex !== -1 && values[maxDevicesIndex] 
					? parseInt(values[maxDevicesIndex], 10) || 10 
					: 10;
				const description = descriptionIndex !== -1 && values[descriptionIndex] 
					? values[descriptionIndex] 
					: undefined;
				
				accessCodes.set(code.toLowerCase(), {
					code,
					maxDevices,
					description
				});
			}
		}
		
		console.log(`Loaded ${accessCodes.size} access codes from CSV`);
	} catch (error) {
		console.error('Error loading access codes:', error);
		// Create default access codes for testing
		accessCodes.set('beta2025', {
			code: 'beta2025',
			maxDevices: 10,
			description: 'Beta access code for 2025'
		});
		accessCodes.set('test123', {
			code: 'test123',
			maxDevices: 5,
			description: 'Test access code'
		});
	}
}

// Purpose: Validate access code and check device limits
// Context: Validates beta codes and manages device session limits
export function validateAccessCode(code: string, deviceId: string): { 
	success: boolean; 
	deviceId?: string; 
	expiresAt?: string; 
	error?: string;
} {
	const normalizedCode = code.toLowerCase().trim();
	const accessCode = accessCodes.get(normalizedCode);
	
	if (!accessCode) {
		return {
			success: false,
			error: 'Código de acceso inválido'
		};
	}
	
	// Beta access is always available - no need to check launch date for beta codes
	
	// Get existing sessions for this code
	const existingSessions = deviceSessions.get(normalizedCode) || [];
	
	// Check if device already has an active session
	const existingSession = existingSessions.find(session => 
		session.deviceId === deviceId && session.expiresAt > new Date()
	);
	
	if (existingSession) {
		// Update last access time
		existingSession.lastAccess = new Date();
		existingSession.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
		
		return {
			success: true,
			deviceId,
			expiresAt: existingSession.expiresAt.toISOString()
		};
	}
	
	// Check device limit
	const activeSessions = existingSessions.filter(session => 
		session.expiresAt > new Date()
	);
	
	if (activeSessions.length >= accessCode.maxDevices) {
		return {
			success: false,
			error: `Límite de dispositivos alcanzado (${accessCode.maxDevices})`
		};
	}
	
	// Create new session
	const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
	const newSession: DeviceSession = {
		deviceId,
		lastAccess: new Date(),
		expiresAt
	};
	
	existingSessions.push(newSession);
	deviceSessions.set(normalizedCode, existingSessions);
	
	return {
		success: true,
		deviceId,
		expiresAt: expiresAt.toISOString()
	};
}

// Purpose: Validate existing device session
// Context: Checks if stored session is still valid
export function validateDeviceSession(code: string, deviceId: string, expiresAt: string): {
	success: boolean;
	isValid: boolean;
	error?: string;
} {
	try {
		const normalizedCode = code.toLowerCase().trim();
		const sessionExpiresAt = new Date(expiresAt);
		
		// Check if session has expired
		if (sessionExpiresAt <= new Date()) {
			// Clean up expired session
			const sessions = deviceSessions.get(normalizedCode) || [];
			const updatedSessions = sessions.filter(session => session.deviceId !== deviceId);
			deviceSessions.set(normalizedCode, updatedSessions);
			
			return {
				success: true,
				isValid: false
			};
		}
		
		// Beta sessions are always valid regardless of launch date
		
		// Find and validate session
		const sessions = deviceSessions.get(normalizedCode) || [];
		const session = sessions.find(s => s.deviceId === deviceId);
		
		if (!session) {
			return {
				success: true,
				isValid: false
			};
		}
		
		// Update last access time
		session.lastAccess = new Date();
		
		return {
			success: true,
			isValid: true
		};
	} catch (error) {
		return {
			success: false,
			isValid: false,
			error: 'Error validando sesión'
		};
	}
}

// Purpose: Check if launch date has been reached
// Context: Server-side validation to prevent client manipulation
export function isLaunchDateReached(): boolean {
	const targetDate = new Date(LAUNCH_DATE);
	const now = new Date();
	console.log('targetDate', targetDate);
	console.log('now', now);
	return now >= targetDate;
}

// Purpose: Get server time for client validation
// Context: Provides server time to prevent client clock manipulation
export function getServerTime(): { 
	serverTime: string; 
	launchDate: string; 
	timeUntilLaunch: number;
} {
	const now = new Date();
	const targetDate = new Date(LAUNCH_DATE);
	const timeUntilLaunch = Math.max(0, targetDate.getTime() - now.getTime());
	
	return {
		serverTime: now.toISOString(),
		launchDate: targetDate.toISOString(),
		timeUntilLaunch
	};
}

// Purpose: Clean up expired sessions
// Context: Removes expired device sessions to free up slots
export function cleanupExpiredSessions(): void {
	const now = new Date();
	
	for (const [code, sessions] of deviceSessions.entries()) {
		const activeSessions = sessions.filter(session => session.expiresAt > now);
		deviceSessions.set(code, activeSessions);
	}
}

// Initialize access codes on module load
loadAccessCodes();

// Clean up expired sessions every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
