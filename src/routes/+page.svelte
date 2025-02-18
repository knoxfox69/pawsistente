<!--
  Purpose: Landing page that automatically redirects based on topic selection status
  Context: Entry point of the application that manages initial user flow
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { topicsStore } from '$lib/stores/topics';

  onMount(() => {
    const unsubscribe = topicsStore.subscribe(d => {
      const hasTopics = d.selected.size > 0 || d.custom.length > 0;
      // Automatically redirect based on topic selection status
      // goto(hasTopics ? '/feed' : '/setup');
    });

    return () => unsubscribe();
  });
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black p-6">
  <div class="glass-card text-center p-8 max-w-md w-full">
    <h1 class="text-4xl font-serif mb-6 text-white">Welcome to GitTok</h1>
    <div class="space-y-4 text-gray-300 font-serif">
      <p class="text-xl mb-4">Finally, a scrolling addiction you can put on your resume! 🚀</p>

      <div class="text-left space-y-3">
        <p class="flex items-center">
          <span class="text-yellow-400 mr-2">✓</span>
          "No, I'm not procrastinating, I'm researching coding patterns!"
        </p>
        <p class="flex items-center">
          <span class="text-yellow-400 mr-2">✓</span>
          "It's like TikTok, but instead of dance moves, you're stealing code snippets"
        </p>
        <p class="flex items-center">
          <span class="text-yellow-400 mr-2">✓</span>
          "The only infinite scroll that makes you better at your job*"
        </p>
      </div>

      <p class="text-sm text-gray-400 mt-6 italic">
        *Results may vary. Side effects include improved git skills and random urges to refactor everything.
      </p>
    </div>
    <p class="text-blue-400 mt-8 animate-pulse">Loading your productivity boost...</p>
  </div>
</div>

<style>
  .glass-card {
    background: rgba(31, 41, 55, 0.5);
    backdrop-filter: blur(12px);
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
</style>
