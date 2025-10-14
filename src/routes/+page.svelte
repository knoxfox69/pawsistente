<!--
  Purpose: Landing page that automatically redirects based on topic selection status
  Context: Entry point of the application that manages initial user flow
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { Twitter, MessageSquareQuote, HelpCircle } from 'lucide-svelte';
  import { languageStore } from '$lib/stores/language';
  import LanguageSelector from '$lib/components/LanguageSelector.svelte';

  let hasVisited = $state(false);
  let visible = $state(false);
  let t = $state(languageStore.translations);
  let currentLanguage = $state(languageStore.currentLanguage);

  // Language store subscription
  let unsubscribe: (() => void) | undefined;

  onMount(() => {
    hasVisited = localStorage.getItem('hasVisitedGitTok') === 'true';
    visible = true;
    languageStore.loadFromStorage();
    
    unsubscribe = languageStore.subscribe(() => {
      t = languageStore.translations;
      currentLanguage = languageStore.currentLanguage;
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  let features = $derived([
    { 
      icon: '📅', 
      text: currentLanguage === 'es' 
        ? '"Desliza por eventos como si fuera Tindr, ¡pero para seleccionar que eventos quieres atender!"' 
        : '"Swipe through events as if it was Tindr, to select which events you want to attend!"' 
    },
    { 
      icon: '⚡', 
      text: currentLanguage === 'es' 
        ? '"No te pierdas de tus paneles favoritos!"' 
        : '"Don\'t miss your favorite panels!"' 
    },
    { 
      icon: '🎉', 
      text: currentLanguage === 'es' 
        ? '"Exporta a Google Calendar o Apple Calendar en un clic"' 
        : '"Export to Google Calendar or Apple Calendar in one click"' 
    },
  ]);
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

  <!-- Language Selector -->
  <div class="fixed top-4 right-4 z-50">
    <LanguageSelector />
  </div>

  <!-- Main content -->
  <div class="relative min-h-screen flex flex-col items-center justify-center p-6">
    {#if visible}
      <div
        class="glass-card text-center p-8 max-w-md w-full"
        in:fly={{ y: 50, duration: 1000 }}
      >
        <div in:fade={{ delay: 200, duration: 800 }}>
          <h1 class="text-5xl font-serif mb-2 text-white font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🐾 Pawsistente
          </h1>
          <p class="text-xl text-gray-300 mb-8">{t.appSubtitle}</p>

          <!-- Disclaimer -->
          <div class="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-6">
            <p class="text-yellow-400 text-sm font-mono">
              ⚠️ {currentLanguage === 'es' ? 'Esta no es una aplicación oficial de Confuror' : 'This is not an official Confuror application'}
            </p>
          </div>

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
              {currentLanguage === 'es' 
                ? 'Perfecto para furros asistiendo a Confuror 2025. ¡Desliza, selecciona y genera tu calendario!'
                : 'Perfect for furries attending Confuror 2025. Swipe, select and generate your calendar!'
              }
            </p>
          </div>

          <div class="flex flex-col items-center gap-4 mt-8">
            <a
              href="/events"
              class="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              in:fade={{ delay: 1000, duration: 800 }}
            >
              {t.browseEvents}
            </a>
            <a
              href="/about"
              class="px-6 py-3 bg-gray-400/20 text-gray-400 rounded-lg border border-gray-400/30 hover:bg-gray-400/30 transition-colors"
              in:fade={{ delay: 1200, duration: 800 }}
            >
              {t.about}
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer with contact and version -->
  <div class="relative z-10 pb-6 px-6">
    <div class="text-center text-gray-400 text-sm">
      <div class="flex items-center justify-center gap-4 mb-2">
        <a
          href="https://t.me/knoxfox69"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 hover:text-purple-400 transition-colors duration-200 group"
        >
          <span class="text-lg">📱</span>
          <span class="font-mono group-hover:text-purple-400 transition-colors duration-200">@knoxfox69</span>
        </a>
        <span class="text-gray-500">•</span>
        <span class="font-mono">v1.0.0</span>
      </div>
      <p class="text-xs text-gray-500">
        {t.madeFor}
      </p>
    </div>
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
