<!--
  Purpose: Simple language selector with single flag button
  Context: Provides a simple flag button that toggles between Spanish and English
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { languageStore } from '$lib/stores/language';

  let currentLanguage = $state(languageStore.currentLanguage);

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'es' ? 'en' : 'es';
    languageStore.setLanguage(newLang);
  };

  const getCurrentFlag = () => {
    return currentLanguage === 'es' ? '🇲🇽' : '🇺🇸';
  };

  let unsubscribe: (() => void) | undefined;

  onMount(() => {
    unsubscribe = languageStore.subscribe(() => {
      currentLanguage = languageStore.currentLanguage;
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
</script>

<button
  onclick={toggleLanguage}
  class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50 flex items-center gap-2"
  aria-label="Change language"
>
  <span class="text-lg">{getCurrentFlag()}</span>
</button>
