<!-- Purpose: Countdown timer component until December 8, 2025
     Context: Blocks app access until the specified launch date for Posada Furcan 2025 -->
<script lang="ts">
	// Purpose: Countdown timer state management
	// Context: Displays countdown until Posada Furcan 2025
	import { onMount } from 'svelte';
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
					Pawsistente estará disponible para:
				</p>
				<p class="text-yellow-400 text-2xl md:text-3xl font-bold font-serif mt-2">
					Posada Furcan 2025
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
					})}
				</p>
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-8 text-center">
			<p class="text-gray-500 text-sm font-mono">
				© 2025 Pawsistente
			</p>
		</div>
	</div>
</div>
