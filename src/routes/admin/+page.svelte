<!-- Purpose: Admin dashboard for access code usage statistics
     Context: Displays real-time usage information for all access codes -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	interface UsageStats {
		code: string;
		maxDevices: number;
		description?: string;
		currentDevices: number;
		availableSlots: number;
		usagePercentage: number;
		activeDevices: Array<{
			deviceId: string;
			lastAccess: string;
			expiresAt: string;
		}>;
	}

	interface AdminResponse {
		success: boolean;
		totalCodes: number;
		codes: UsageStats[];
		timestamp: string;
		error?: string;
	}

	let stats: UsageStats[] = [];
	let loading = true;
	let error = '';
	let lastUpdated = '';

	// Purpose: Fetch usage statistics from admin API
	// Context: Retrieves real-time usage data for all access codes
	async function fetchStats() {
		try {
			loading = true;
			error = '';
			
			const response = await fetch('/api/access/admin');
			const data: AdminResponse = await response.json();
			
			if (data.success) {
				stats = data.codes;
				lastUpdated = new Date(data.timestamp).toLocaleString();
			} else {
				error = data.error || 'Error fetching statistics';
			}
		} catch (err) {
			error = 'Failed to fetch statistics';
			console.error('Admin stats error:', err);
		} finally {
			loading = false;
		}
	}

	// Purpose: Format time remaining until session expires
	// Context: Shows how much time is left for each active session
	function getTimeRemaining(expiresAt: string): string {
		const now = new Date();
		const expires = new Date(expiresAt);
		const diff = expires.getTime() - now.getTime();
		
		if (diff <= 0) return 'Expired';
		
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		
		return `${hours}h ${minutes}m`;
	}

	// Purpose: Get usage status color based on percentage
	// Context: Visual indicator for usage levels
	function getUsageColor(percentage: number): string {
		if (percentage >= 90) return 'text-red-400';
		if (percentage >= 70) return 'text-yellow-400';
		return 'text-green-400';
	}

	// Purpose: Get progress bar color based on usage
	// Context: Visual progress indicator
	function getProgressColor(percentage: number): string {
		if (percentage >= 90) return 'bg-red-500';
		if (percentage >= 70) return 'bg-yellow-500';
		return 'bg-green-500';
	}

	onMount(() => {
		if (browser) {
			fetchStats();
			// Auto-refresh every 30 seconds
			const interval = setInterval(fetchStats, 30000);
			return () => clearInterval(interval);
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-4xl font-bold text-white mb-2 font-serif">
				Access Code Admin Dashboard
			</h1>
			<p class="text-gray-400 font-mono">
				Real-time usage statistics for beta access codes
			</p>
			{#if lastUpdated}
				<p class="text-gray-500 text-sm font-mono mt-2">
					Last updated: {lastUpdated}
				</p>
			{/if}
		</div>

		<!-- Loading State -->
		{#if loading}
			<div class="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 border border-gray-700/50 text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
				<p class="text-gray-300 text-lg font-mono">Loading statistics...</p>
			</div>
		{:else if error}
			<!-- Error State -->
			<div class="bg-red-900/20 backdrop-blur-md rounded-2xl p-8 border border-red-700/50 text-center">
				<p class="text-red-400 text-lg font-mono mb-4">{error}</p>
				<button 
					onclick={fetchStats}
					class="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
				>
					Retry
				</button>
			</div>
		{:else}
			<!-- Statistics Cards -->
			<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
				{#each stats as stat}
					<div class="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50">
						<!-- Code Header -->
						<div class="mb-4">
							<h3 class="text-xl font-bold text-white font-mono mb-1">
								{stat.code}
							</h3>
							{#if stat.description}
								<p class="text-gray-400 text-sm">
									{stat.description}
								</p>
							{/if}
						</div>

						<!-- Usage Stats -->
						<div class="space-y-3">
							<!-- Usage Bar -->
							<div>
								<div class="flex justify-between text-sm font-mono mb-2">
									<span class="text-gray-400">Usage</span>
									<span class="{getUsageColor(stat.usagePercentage)}">
										{stat.currentDevices}/{stat.maxDevices} ({stat.usagePercentage}%)
									</span>
								</div>
								<div class="w-full bg-gray-700 rounded-full h-2">
									<div 
										class="h-2 rounded-full {getProgressColor(stat.usagePercentage)}"
										style="width: {stat.usagePercentage}%"
									></div>
								</div>
							</div>

							<!-- Available Slots -->
							<div class="flex justify-between text-sm font-mono">
								<span class="text-gray-400">Available</span>
								<span class="text-blue-400">
									{stat.availableSlots} slots
								</span>
							</div>

							<!-- Active Devices -->
							{#if stat.activeDevices.length > 0}
								<div class="mt-4">
									<h4 class="text-sm font-bold text-gray-300 mb-2 font-mono">
										Active Devices ({stat.activeDevices.length})
									</h4>
									<div class="space-y-2">
										{#each stat.activeDevices as device}
											<div class="bg-gray-900/50 rounded-lg p-3 border border-gray-600/30">
												<div class="flex justify-between items-center mb-1">
													<span class="text-xs font-mono text-gray-400">
														{device.deviceId}
													</span>
													<span class="text-xs font-mono text-green-400">
														{getTimeRemaining(device.expiresAt)}
													</span>
												</div>
												<div class="text-xs text-gray-500 font-mono">
													Last: {new Date(device.lastAccess).toLocaleString()}
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Refresh Button -->
			<div class="text-center">
				<button 
					onclick={fetchStats}
					class="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 border border-blue-400/30"
				>
					Refresh Statistics
				</button>
			</div>
		{/if}
	</div>
</div>
