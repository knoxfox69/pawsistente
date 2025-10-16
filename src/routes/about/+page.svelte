<!--
  Purpose: About page with project information and version details
  Context: Provides information about Pawsistente
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { RotateCcw } from 'lucide-svelte';
  import { languageStore, APP_VERSION } from '$lib/stores/language';
  import { appState } from '$lib/stores/appState';
  import { goto } from '$app/navigation';
  import { MessageCircle } from 'lucide-svelte';
  import Header from '$lib/components/Header.svelte';

  let t = $derived(languageStore.translations);
  let showResetConfirm = $state(false);

  onMount(() => {
    languageStore.loadFromStorage();
  });

  const handleReset = () => {
    showResetConfirm = true;
  };

  const confirmReset = () => {
    appState.clearState();
    localStorage.removeItem('manually-added-events');
    showResetConfirm = false;
    goto('/');
  };

  const cancelReset = () => {
    showResetConfirm = false;
  };
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-black">
  <Header 
    title="{t.about} 🐾 Pawsistente"
    showVersion={true}
    padding="sm"
  />
  
  <div class="max-w-4xl mx-auto p-6">

    <!-- Main Content -->
    <div class="space-y-8">
      <!-- Project Description -->
      <div class="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8" in:scale={{ duration: 600, delay: 200 }}>
        <p class="text-lg text-gray-300 font-serif leading-relaxed mb-4">
          {t.projectDescription}
        </p>
        <p class="text-gray-400 font-mono text-sm">
          {t.madeFor}
        </p>
        
        <!-- Disclaimer -->
        <div class="mt-6 pt-6 border-t border-gray-700">
          <div class="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-4">
            <p class="text-yellow-400 text-sm font-mono text-center">
              ⚠️ Esta no es una aplicación oficial de Confuror
            </p>
          </div>
        </div>

        <!-- Contact Section -->
        <div class="mt-6 pt-6 border-t border-gray-700">
          <div class="flex flex-col sm:flex-row items-center justify-center gap-5">
            <a
              href="https://t.me/knoxfox69"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-transform"
            >
              <MessageCircle class="w-5 h-5" />
              <span>@knoxfox69</span>
            </a>
            
          </div>
        </div>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-5 mt-4">
            <button
              onclick={handleReset}
              class="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 rounded-lg border border-red-400/30 hover:bg-red-500/30 transition-colors"
            >
              <RotateCcw class="w-4 h-4" />
              <span>{languageStore.currentLanguage === 'es' ? 'Resetear Progreso' : 'Reset Progress'}</span>
            </button>
          </div>
      </div>
    </div>
  </div>

  <!-- Reset Confirmation Dialog -->
  {#if showResetConfirm}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" in:fade={{ duration: 500 }}>
      <div class="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 text-center max-w-lg mx-4" in:scale={{ duration: 600 }}>
        <div class="text-6xl mb-6">⚠️</div>
        <h3 class="text-2xl font-serif text-white mb-6">
          {languageStore.currentLanguage === 'es' ? '¿Resetear Progreso?' : 'Reset Progress?'}
        </h3>
        <p class="text-gray-300 mb-8">
          {languageStore.currentLanguage === 'es' 
            ? 'Esto eliminará todos tus eventos seleccionados y progreso guardado. Esta acción no se puede deshacer.'
            : 'This will remove all your selected events and saved progress. This action cannot be undone.'}
        </p>
        <div class="flex gap-4 justify-center">
          <button
            onclick={cancelReset}
            class="px-6 py-3 bg-gray-400/20 text-gray-400 rounded-lg border border-gray-400/30 hover:bg-gray-400/30 transition-colors"
          >
            {languageStore.currentLanguage === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            onclick={confirmReset}
            class="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25"
          >
            {languageStore.currentLanguage === 'es' ? 'Resetear' : 'Reset'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>