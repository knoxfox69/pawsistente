<!-- Purpose: Countdown timer component until Oct 20, 2025 3pm GMT-6
     Context: Blocks app access until the specified launch date -->
<script lang="ts">
	// Purpose: Access control state management
	// Context: Manages beta access codes and device tracking
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { LAUNCH_DATE } from '$lib/config/launchDate';

	interface Props {
		onAccessGranted?: () => void;
	}

	let { onAccessGranted }: Props = $props();

	// Target date from centralized configuration
	const targetDate = new Date(LAUNCH_DATE);
	
	let timeLeft = $state({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0
	});
	
	let showBetaCodeInput = $state(false);
	let betaCode = $state('');
	let betaCodeError = $state('');
	let isLoading = $state(false);

	// Purpose: Calculate time remaining until target date
	// Context: Updates every second to show live countdown
	function updateCountdown() {
		const now = new Date();
		const difference = targetDate.getTime() - now.getTime();
		
		if (difference <= 0) {
			timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
			if (onAccessGranted) {
				onAccessGranted();
			}
			return;
		}
		
		timeLeft = {
			days: Math.floor(difference / (1000 * 60 * 60 * 24)),
			hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
			minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
			seconds: Math.floor((difference % (1000 * 60)) / 1000)
		};
	}

	// Purpose: Handle beta code submission
	// Context: Validates and processes early access codes
	async function handleBetaCodeSubmit() {
		if (!betaCode.trim()) {
			betaCodeError = 'Por favor ingresa un código de acceso';
			return;
		}

		isLoading = true;
		betaCodeError = '';

		try {
			const response = await fetch('/api/access/validate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ code: betaCode.trim() }),
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Store access in localStorage
				if (browser) {
					localStorage.setItem('beta_access_code', betaCode.trim());
					localStorage.setItem('beta_access_device_id', result.deviceId);
					localStorage.setItem('beta_access_expires', result.expiresAt);
				}
				if (onAccessGranted) {
					onAccessGranted();
				}
			} else {
				betaCodeError = result.error || 'Código de acceso inválido';
			}
		} catch (error) {
			betaCodeError = 'Error de conexión. Por favor intenta de nuevo.';
			console.error('Beta code validation error:', error);
		} finally {
			isLoading = false;
		}
	}

	// Purpose: Toggle beta code input visibility
	// Context: Allows users to enter early access codes
	function toggleBetaCodeInput() {
		showBetaCodeInput = !showBetaCodeInput;
		betaCodeError = '';
		betaCode = '';
	}

	onMount(() => {
		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		
		return () => clearInterval(interval);
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-6">
	<div class="max-w-2xl w-full text-center">
		<!-- Main Content Card -->
		<div class="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
			<!-- Header -->
			<div class="mb-8">
				<h1 class="text-4xl md:text-5xl font-bold text-white mb-4 font-serif">
					¡Próximamente!
				</h1>
				<p class="text-gray-300 text-lg md:text-xl font-mono">
					Pawsistente se lanzará en:
				</p>
			</div>

			<!-- Countdown Timer -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
				<div class="bg-gray-900/50 rounded-xl p-4 border border-gray-600/30">
					<div class="text-3xl md:text-4xl font-bold text-yellow-400 font-mono mb-1">
						{timeLeft.days}
					</div>
					<div class="text-gray-400 text-sm uppercase tracking-wider">
						Días
					</div>
				</div>
				
				<div class="bg-gray-900/50 rounded-xl p-4 border border-gray-600/30">
					<div class="text-3xl md:text-4xl font-bold text-yellow-400 font-mono mb-1">
						{timeLeft.hours}
					</div>
					<div class="text-gray-400 text-sm uppercase tracking-wider">
						Horas
					</div>
				</div>
				
				<div class="bg-gray-900/50 rounded-xl p-4 border border-gray-600/30">
					<div class="text-3xl md:text-4xl font-bold text-yellow-400 font-mono mb-1">
						{timeLeft.minutes}
					</div>
					<div class="text-gray-400 text-sm uppercase tracking-wider">
						Minutos
					</div>
				</div>
				
				<div class="bg-gray-900/50 rounded-xl p-4 border border-gray-600/30">
					<div class="text-3xl md:text-4xl font-bold text-yellow-400 font-mono mb-1">
						{timeLeft.seconds}
					</div>
					<div class="text-gray-400 text-sm uppercase tracking-wider">
						Segundos
					</div>
				</div>
			</div>

			<!-- Launch Date -->
			<div class="mb-8">
				<p class="text-gray-400 text-sm font-mono">
					{targetDate.toLocaleDateString('es-ES', { 
						day: 'numeric', 
						month: 'long', 
						year: 'numeric' 
					})} • {targetDate.toLocaleTimeString('es-ES', { 
						hour: 'numeric', 
						minute: '2-digit',
						timeZone: 'America/Mexico_City'
					})} GMT-6
				</p>
			</div>

			<!-- Beta Access Section -->
			<div class="space-y-4">
				<p class="text-gray-300 text-sm">
					¿Tienes un código de acceso beta?
				</p>
				
				{#if !showBetaCodeInput}
					<button 
						onclick={toggleBetaCodeInput}
						class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-blue-400/30"
					>
						Ingresar Código Beta
					</button>
				{:else}
					<div class="space-y-4">
						<div>
							<input 
								bind:value={betaCode}
								type="text"
								placeholder="Ingresa tu código de acceso"
								class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								onkeydown={(e) => e.key === 'Enter' && handleBetaCodeSubmit()}
							/>
							{#if betaCodeError}
								<p class="text-red-400 text-sm mt-2">{betaCodeError}</p>
							{/if}
						</div>
						
						<div class="flex gap-3 justify-center">
							<button 
								onclick={handleBetaCodeSubmit}
								disabled={isLoading}
								class="bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-green-400/30 disabled:cursor-not-allowed"
							>
								{isLoading ? 'Verificando...' : 'Acceder'}
							</button>
							
							<button 
								onclick={toggleBetaCodeInput}
								class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-gray-500/30"
							>
								Cancelar
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-8 text-center">
			<p class="text-gray-500 text-sm font-mono">
				© 2025 Pawsistente • Acceso Restringido
			</p>
		</div>
	</div>
</div>
