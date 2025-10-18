<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { languageStore, APP_VERSION } from '$lib/stores/language';
  import Header from '$lib/components/Header.svelte';

  let hasVisited = $state(false);
  let visible = $state(false);
  let t = $state(languageStore.translations);
  let currentLanguage = $state(languageStore.currentLanguage);

  // Language store subscription
  let unsubscribe: (() => void) | undefined;

  onMount(() => {
    hasVisited = localStorage.getItem('hasVisitedPawsistente') === 'true';
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


  <div class="relative min-h-screen flex flex-col items-center justify-start p-6">

    {#if visible}
      <!-- Decorative elements -->
      <div class="absolute top-32 left-8 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
      <div class="absolute top-40 right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-lg animate-pulse" style="animation-delay: 1s;"></div>
      <div class="absolute bottom-32 left-16 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl animate-pulse" style="animation-delay: 2s;"></div>
      
      <div
        class="glass-card text-center p-8 max-w-md w-full relative z-10"
        in:fly={{ y: 50, duration: 1000 }}
      >

        <!-- Header without back button -->
        <Header 
          showBackButton={false} 
          padding="sm"
          anchored={false}
          sticky={true}
          overlay={true}
          glassmorphic={false}
          showSeparator={false}
          showBackground={false}
          showOutline={false}
          bottomPadding=""
          className="mb-2"
        />
        <div in:fade={{ delay: 200, duration: 800 }}>
          <img 
            src="/icons/logo.svg" 
            alt="Pawsistente Logo" 
            class="w-24 h-24 mx-auto mb-4"
          />
          <h1 class="text-5xl font-sans mb-2 text-white font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Pawsistente
          </h1>
          <p class="text-xl text-gray-300 mb-8">{t.appSubtitle}</p>

          <!-- Alpha Release Banner -->
          <div class="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/50 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-center gap-2 mb-2">
              <span class="text-orange-400 text-lg font-bold">🚧</span>
              <p class="text-orange-400 text-sm font-mono font-bold">
                {currentLanguage === 'es' ? 'VERSIÓN BETA' : 'BETA VERSION'}
              </p>
              <span class="text-orange-400 text-lg font-bold">🚧</span>
            </div>
            <p class="text-orange-300 text-xs text-center">
              {currentLanguage === 'es' 
                ? 'Esta es una versión beta. Puede contener errores y funcionalidades incompletas.' 
                : 'This is a beta version. It may contain bugs and incomplete features.'}
            </p>
          </div>

          <!-- Disclaimer -->
          <div class="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-6">
            <p class="text-yellow-400 text-sm font-mono">
              ⚠️ {currentLanguage === 'es' ? 'Esta no es una aplicación oficial de Confuror' : 'This is not an official Confuror application'}
            </p>
          </div>

          <div class="space-y-6 text-gray-300 font-sans">
            <p
              class="text-sm text-gray-400 mt-6 italic"
              in:fade={{ delay: 800, duration: 800 }}
            >
              {currentLanguage === 'es' 
                ? 'Perfecto para furros asistiendo a Confuror 2025. ¡Desliza, selecciona y genera tu calendario!'
                : 'Perfect for furries attending Confuror 2025. Swipe, select and generate your calendar!'
              }
            </p>
            
            <!-- Feature highlights -->
          </div>

          <div class="flex flex-col items-center gap-4 mt-6">
            <a
              href="/events"
              class="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              in:fade={{ delay: 1000, duration: 800 }}
            >
              {currentLanguage === 'es' ? 'Añadir eventos' : 'Add events'}
            </a>
            
            <a
              href="/schedule"
              class="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
              in:fade={{ delay: 1100, duration: 800 }}
            >
              {currentLanguage === 'es' ? 'Ver mi horario' : 'View my schedule'}
            </a>

            <div class="h-2"></div>
            
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
