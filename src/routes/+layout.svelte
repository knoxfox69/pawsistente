<!-- Purpose: Main layout with access control system
     Context: Blocks app access until launch date or valid beta code -->
<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import CountdownTimer from '$lib/components/CountdownTimer.svelte';
	import { accessControlStore } from '$lib/stores/accessControl';

	let { children } = $props();
	
	// Purpose: Access control state management
	// Context: Manages whether user has access to the app
	let hasAccess = $state(false);
	let isCheckingAccess = $state(true);
	
	// Purpose: Initialize access control on app start
	// Context: Checks for valid access and initializes the store
	onMount(() => {
		if (browser) {
			// Subscribe to access control store
			const unsubscribe = accessControlStore.subscribe((state) => {
				hasAccess = state.isAccessGranted;
				isCheckingAccess = state.checkingAccess;
			});
			
			// Initialize access control
			accessControlStore.initialize();
			
			return unsubscribe;
		}
	});

	// Purpose: Handle access granted callback
	// Context: Called when user successfully gains access through beta code
	function handleAccessGranted() {
		hasAccess = true;
		isCheckingAccess = false;
	}
</script>

{#if isCheckingAccess}
	<!-- Loading state -->
	<div class="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
			<p class="text-gray-300 text-lg font-mono">Verificando acceso...</p>
		</div>
	</div>
{:else if !hasAccess}
	<!-- Access blocked - show countdown timer -->
	<CountdownTimer onAccessGranted={handleAccessGranted} />
{:else}
	<!-- Access granted - show app content -->
	{@render children()}
{/if}
