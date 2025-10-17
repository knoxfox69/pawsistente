<!--
  Purpose: Day selection interface for choosing which convention days to view
  Context: Allows users to select Thursday, Friday, Saturday, or Sunday for event browsing
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Calendar, Check } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { languageStore } from '$lib/stores/language';
  import { formatDayWithDate, getDayAbbreviation } from '$lib/utils/dateUtils';

  type Day = 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

  interface Props {
    selectedDays: Day[];
    onDaysChange: (days: Day[]) => void;
    onContinue: () => void;
  }

  const { selectedDays, onDaysChange, onContinue }: Props = $props();
  let t = $state(languageStore.translations);
  let currentLanguage = $state(languageStore.currentLanguage);

  const days = $derived([
    { 
      day: 'Thursday' as Day, 
      label: formatDayWithDate('Thursday', currentLanguage), 
      dayName: currentLanguage === 'es' ? 'Jueves' : 'Thursday',
      short: 'Thu', 
      abbreviation: getDayAbbreviation('Thursday'), 
      date: '23' 
    },
    { 
      day: 'Friday' as Day, 
      label: formatDayWithDate('Friday', currentLanguage), 
      dayName: currentLanguage === 'es' ? 'Viernes' : 'Friday',
      short: 'Fri', 
      abbreviation: getDayAbbreviation('Friday'), 
      date: '24' 
    },
    { 
      day: 'Saturday' as Day, 
      label: formatDayWithDate('Saturday', currentLanguage), 
      dayName: currentLanguage === 'es' ? 'Sábado' : 'Saturday',
      short: 'Sat', 
      abbreviation: getDayAbbreviation('Saturday'), 
      date: '25' 
    },
    { 
      day: 'Sunday' as Day, 
      label: formatDayWithDate('Sunday', currentLanguage), 
      dayName: currentLanguage === 'es' ? 'Domingo' : 'Sunday',
      short: 'Sun', 
      abbreviation: getDayAbbreviation('Sunday'), 
      date: '26' 
    }
  ]);

  const toggleDay = (day: Day) => {
    if (selectedDays.includes(day)) {
      onDaysChange(selectedDays.filter(d => d !== day));
    } else {
      onDaysChange([...selectedDays, day]);
    }
  };

  let canContinue = $derived(selectedDays.length > 0);
  let unsubscribe: (() => void) | undefined;

  onMount(() => {
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

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-6">
  <div class="w-full max-w-2xl">
    <!-- Header with return button -->
    <div class="flex items-center gap-4 mb-8" in:fade={{ duration: 800 }}>
      <div class="text-center flex-1">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-blue-400/20 rounded-full mb-6">
          <Calendar class="w-10 h-10 text-blue-400" />
        </div>
        <h1 class="text-4xl font-serif text-white mb-4">
          {t.chooseDays}
        </h1>
        <p class="text-xl text-gray-300 font-serif">
          {t.selectConventionDays}
        </p>
      </div>
    </div>

    <!-- Day Selection List -->
    <div class="space-y-3 mb-8" in:scale={{ duration: 600, delay: 200 }}>
      {#each days as { day, label, dayName, short, abbreviation, date }, index}
        <button
          onclick={() => toggleDay(day)}
          class="relative group w-full p-4 rounded-xl bg-gray-800/50 backdrop-blur-sm border-2 transition-all duration-300 hover:bg-gray-700/50 {selectedDays.includes(day) 
            ? 'border-blue-400 bg-blue-400/20' 
            : 'border-gray-700 hover:border-gray-600'}"
          in:scale={{ duration: 400, delay: 300 + index * 100 }}
        >
          <div class="flex items-center justify-between">
            <div class="text-left">
              <h3 class="text-xl font-serif text-white">
                {dayName} ({label})
              </h3>
            </div>
            
            <!-- Selection indicator on the right -->
            {#if selectedDays.includes(day)}
              <div class="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                <Check class="w-4 h-4 text-white" />
              </div>
            {/if}
          </div>

          <!-- Hover effect -->
          <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      {/each}
    </div>


    <!-- Continue Button -->
    <div class="mt-12 text-center" in:scale={{ duration: 600, delay: 1000 }}>
      <button
        onclick={onContinue}
        disabled={!canContinue}
        class="px-12 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
      >
        {t.continueToEvents}
      </button>
      
      {#if !canContinue}
        <p class="text-sm text-gray-400 mt-3 font-mono">
          {t.selectOneDay}
        </p>
      {/if}
    </div>

    <!-- Selected Days Summary -->
    {#if selectedDays.length > 0}
      <div class="mt-8 text-center" in:fade={{ duration: 400 }}>
        <p class="text-gray-400 font-mono text-sm mb-2">{t.selectedDays}</p>
        <div class="flex flex-wrap justify-center gap-2">
          {#each selectedDays as day}
            <span class="px-3 py-1 bg-blue-400/20 text-blue-400 rounded-full text-sm font-mono">
              {days.find(d => d.day === day)?.label || day}
            </span>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Custom animations */
  @keyframes pulse-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
    }
    50% {
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
    }
  }

</style>
