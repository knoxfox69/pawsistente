<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initDatabase } from '$lib/db/client';
	let { children } = $props();


	onMount(async () => {
		await initDatabase('/data/db.sqlite');
	});
</script>

{@render children()}
