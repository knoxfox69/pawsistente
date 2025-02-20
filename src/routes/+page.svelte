<!--
  Purpose: Landing page that automatically redirects based on topic selection status
  Context: Entry point of the application that manages initial user flow
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade, fly } from 'svelte/transition';

  let hasVisited = false;
  let visible = false;

  onMount(() => {
    // Check if user has visited before
    hasVisited = localStorage.getItem('hasVisitedGitTok') === 'true';
    visible = true;

    if (hasVisited) {
      // goto('/feed');
    } else {
      localStorage.setItem('hasVisitedGitTok', 'true');
    }
  });

  const features = [
    { icon: '🚀', text: '"No, I\'m not procrastinating, I\'m researching coding patterns!"' },
    { icon: '💡', text: '"It\'s like TikTok, but instead of dance moves, you\'re stealing code snippets"' },
    { icon: '⚡', text: '"The only infinite scroll that makes you better at your job*"' },
    { icon: '🎯', text: '"Where developers come for inspiration and stay for the algorithms"' },
  ];
</script>

<div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-black">
  <!-- Animated background elements -->
  <div class="absolute inset-0 overflow-hidden">
    {#each Array(20) as _, i}
      <div
        class="absolute rounded-full mix-blend-screen animate-float"
        style="
          left: {Math.random() * 100}%;
          top: {Math.random() * 100}%;
          width: {Math.random() * 300 + 50}px;
          height: {Math.random() * 300 + 50}px;
          background: radial-gradient(circle at center,
            rgba(59, 130, 246, 0.1) 0%,
            rgba(59, 130, 246, 0) 70%);
          animation-delay: -{Math.random() * 5}s;
          animation-duration: {Math.random() * 10 + 15}s;
        "
      >
      </div>
    {/each}
  </div>

  <!-- Main content -->
  <div class="relative min-h-screen flex flex-col items-center justify-center p-6">
    {#if visible}
      <div
        class="glass-card text-center p-8 max-w-md w-full"
        in:fly={{ y: 50, duration: 1000 }}
      >
        <div in:fade={{ delay: 200, duration: 800 }}>
          <h1 class="text-5xl font-serif mb-2 text-white font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            GitTok
          </h1>
          <p class="text-xl mb-8 text-gray-300">Where Code Meets Creativity</p>

          <div class="space-y-6 text-gray-300 font-serif">
            {#each features as feature, i}
              <div
                class="text-left transform hover:scale-105 transition-transform duration-200"
                in:fly={{ y: 20, delay: 300 + i * 100, duration: 800 }}
              >
                <p class="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5">
                  <span class="text-2xl">{feature.icon}</span>
                  <span>{feature.text}</span>
                </p>
              </div>
            {/each}

            <p
              class="text-sm text-gray-400 mt-6 italic"
              in:fade={{ delay: 800, duration: 800 }}
            >
              *Results may vary. Side effects include improved git skills and random urges to refactor everything.
            </p>
          </div>

          <a
            href="/feed"
            class="inline-block mt-8 px-8 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            in:fade={{ delay: 1000, duration: 800 }}
          >
            Start Scrolling
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .glass-card {
    background: rgba(31, 41, 55, 0.3);
    backdrop-filter: blur(12px);
    border-radius: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-20px) scale(1.1);
    }
  }

  .animate-float {
    animation: float linear infinite;
  }

  /* Add hover effects to the glass card */
  .glass-card:hover {
    background: rgba(31, 41, 55, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }
</style>
