<!--
  Purpose: About page with project information and version details
  Context: Provides information about Pawsistente
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { languageStore, APP_VERSION } from '$lib/stores/language';
  import { MessageCircle } from 'lucide-svelte';
  import Header from '$lib/components/Header.svelte';

  let t = $derived(languageStore.translations);

  onMount(() => {
    languageStore.loadFromStorage();
  });
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-black">
  <Header 
    title="{t.about} Pawsistente"
    showVersion={true}
    padding="sm"
  />
  
  <div class="max-w-4xl mx-auto p-6">

    <!-- Main Content -->
    <div class="space-y-8">

      <!-- Project Description -->
      <div class="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8" in:scale={{ duration: 600, delay: 200 }}>
          <img 
            src="/icons/logo.svg" 
            alt="Pawsistente Logo" 
            class="w-24 h-24 mx-auto mb-4"
          />
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
      </div>
    </div>
  </div>
</div>