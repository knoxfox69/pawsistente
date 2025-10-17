// Purpose: Access control state management
// Context: Manages beta access codes and device tracking
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AccessState {
	isAccessGranted: boolean;
	betaCode?: string;
	deviceId?: string;
	expiresAt?: string;
	checkingAccess: boolean;
}

// Purpose: Create access control store with initial state
// Context: Manages global access state across the application
function createAccessControlStore() {
	const { subscribe, set, update } = writable<AccessState>({
		isAccessGranted: false,
		checkingAccess: true
	});

	return {
		subscribe,
		
		// Purpose: Initialize access control on app start
		// Context: Checks localStorage and validates existing access
		async initialize(): Promise<void> {
			if (!browser) return;
			
			update(state => ({ ...state, checkingAccess: true }));
			
			try {
				// Check if we have stored access
				const betaCode = localStorage.getItem('beta_access_code');
				const deviceId = localStorage.getItem('beta_access_device_id');
				const expiresAt = localStorage.getItem('beta_access_expires');
				
				if (betaCode && deviceId && expiresAt) {
					// Check if access is still valid
					const isValid = await this.validateStoredAccess(betaCode, deviceId, expiresAt);
					if (isValid) {
						update(state => ({
							...state,
							isAccessGranted: true,
							betaCode,
							deviceId,
							expiresAt,
							checkingAccess: false
						}));
						return;
					} else {
						// Clear expired access
						this.clearStoredAccess();
					}
				}
				
				// Check if we've reached the launch date
				const hasReachedLaunchDate = this.checkLaunchDate();
				if (hasReachedLaunchDate) {
					update(state => ({
						...state,
						isAccessGranted: true,
						checkingAccess: false
					}));
					return;
				}
				
				update(state => ({
					...state,
					isAccessGranted: false,
					checkingAccess: false
				}));
			} catch (error) {
				console.error('Access control initialization error:', error);
				update(state => ({
					...state,
					isAccessGranted: false,
					checkingAccess: false
				}));
			}
		},

		// Purpose: Validate stored access credentials
		// Context: Ensures stored access is still valid on the server
		async validateStoredAccess(betaCode: string, deviceId: string, expiresAt: string): Promise<boolean> {
			try {
				const response = await fetch('/api/access/status', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ betaCode, deviceId, expiresAt }),
				});

				const result = await response.json();
				return result.success && result.isValid;
			} catch (error) {
				console.error('Access validation error:', error);
				return false;
			}
		},

		// Purpose: Check if launch date has been reached
		// Context: Validates against server time to prevent client manipulation
		checkLaunchDate(): boolean {
			// This will be validated server-side, but we can do a basic check here
			const targetDate = new Date('2025-10-20T21:00:00.000Z'); // 3pm GMT-6 = 9pm UTC
			const now = new Date();
			return now >= targetDate;
		},

		// Purpose: Grant access after successful beta code validation
		// Context: Updates store state when access is granted
		grantAccess(betaCode: string, deviceId: string, expiresAt: string): void {
			update(state => ({
				...state,
				isAccessGranted: true,
				betaCode,
				deviceId,
				expiresAt,
				checkingAccess: false
			}));
		},

		// Purpose: Clear stored access credentials
		// Context: Removes access when expired or invalid
		clearStoredAccess(): void {
			if (browser) {
				localStorage.removeItem('beta_access_code');
				localStorage.removeItem('beta_access_device_id');
				localStorage.removeItem('beta_access_expires');
			}
			
			update(state => ({
				...state,
				isAccessGranted: false,
				betaCode: undefined,
				deviceId: undefined,
				expiresAt: undefined,
				checkingAccess: false
			}));
		},

		// Purpose: Reset store to initial state
		// Context: Used for testing or manual reset
		reset(): void {
			this.clearStoredAccess();
			set({
				isAccessGranted: false,
				checkingAccess: true
			});
		}
	};
}

export const accessControlStore = createAccessControlStore();
