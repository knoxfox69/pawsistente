<!--
  Purpose: Event card component with swipe gestures for event selection
  Context: Displays event information and handles swipe interactions (left=reject, right=add)
-->

<script lang="ts">
  import { Clock, MapPin, Star, X, AlertTriangle } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import type { ConventionEvent } from '$lib/convention/types';
  import { languageStore } from '$lib/stores/language';
  import { ConflictDetector } from '$lib/utils/conflictDetector';
  import { getDayAbbreviation } from '$lib/utils/dateUtils';

  interface Props {
    event: ConventionEvent;
    isSelected: boolean;
    selectedEvents?: ConventionEvent[];
    onSwipeLeft: (event: ConventionEvent) => void;
    onSwipeRight: (event: ConventionEvent) => void;
  }

  const { 
    event, 
    isSelected, 
    selectedEvents = [],
    onSwipeLeft, 
    onSwipeRight
  }: Props = $props();

  let startX = $state(0);
  let currentX = $state(0);
  let isDragging = $state(false);
  let cardElement: HTMLElement;
  let showConflictOverlay = $state(false);

  // Conflict detection
  const conflicts = $derived(ConflictDetector.getConflictingEvents(event, selectedEvents));
  const hasConflicts = $derived(conflicts.length > 0);
  const t = $derived(languageStore.translations);

  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    isDragging = true;
    cardElement.style.transition = 'none';
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !cardElement) return;
    
    currentX = e.touches[0].clientX - startX;
    // Limit the movement to prevent card from going too far off screen
    const maxMovement = 200;
    currentX = Math.max(-maxMovement, Math.min(maxMovement, currentX));
    
    const rotation = currentX * 0.1;
    const opacity = Math.max(0.3, 1 - Math.abs(currentX) / 200);
    
    cardElement.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;
    cardElement.style.opacity = opacity.toString();
  };

  const handleTouchEnd = () => {
    if (!isDragging || !cardElement) return;
    
    isDragging = false;
    cardElement.style.transition = 'all 0.4s ease-out';
    
    const threshold = 80; // Reduced threshold for easier swiping
    
    if (Math.abs(currentX) > threshold) {
      if (currentX > 0) {
        // Swipe right - Add event
        onSwipeRight(event);
        cardElement.style.transform = 'translateX(100vw) rotate(30deg)';
        cardElement.style.opacity = '0';
        // Reset after animation completes
        setTimeout(() => {
          if (cardElement) {
            cardElement.style.transform = '';
            cardElement.style.opacity = '';
          }
        }, 400);
      } else {
        // Swipe left - Reject event
        onSwipeLeft(event);
        cardElement.style.transform = 'translateX(-100vw) rotate(-30deg)';
        cardElement.style.opacity = '0';
        // Reset after animation completes
        setTimeout(() => {
          if (cardElement) {
            cardElement.style.transform = '';
            cardElement.style.opacity = '';
          }
        }, 400);
      }
    } else {
      // Return to center
      cardElement.style.transform = '';
      cardElement.style.opacity = '';
    }
    
    currentX = 0;
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTrackColor = (track?: string) => {
    switch (track) {
      case 'Art': return 'bg-purple-400/20 text-purple-400';
      case 'Social': return 'bg-blue-400/20 text-blue-400';
      case 'Educational': return 'bg-green-400/20 text-green-400';
      case 'Fursuit': return 'bg-orange-400/20 text-orange-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };
</script>

<div 
  class="relative w-full h-full flex flex-col"
>
  <!-- Event Card Content -->
  <div 
    bind:this={cardElement}
    class="relative w-full h-full bg-gradient-to-b from-gray-900 to-black flex flex-col border-2 border-gray-700 rounded-2xl overflow-hidden"
    style="transform: translateX({currentX}px) rotate({currentX * 0.1}deg); opacity: {Math.max(0.3, 1 - Math.abs(currentX) / 200)};"
    ontouchstart={handleTouchStart}
    ontouchmove={handleTouchMove}
    ontouchend={handleTouchEnd}
    role="button"
    tabindex="0"
    aria-label="Event card for {event.title}"
  >

  <!-- Swipe indicators with circular progress -->
  <div class="absolute inset-0 pointer-events-none">
    <!-- Swipe right indicator (Add) - Top Left -->
    <div class="absolute top-4 left-4 transition-all duration-200 {currentX > 20 ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}">
      <div class="relative">
        <!-- Circular progress background -->
        <div class="w-16 h-16 rounded-full border-4 border-green-400/30 bg-green-400/10 flex items-center justify-center">
          <!-- Circular progress stroke -->
          <svg class="w-16 h-16 absolute inset-0 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgb(34, 197, 94)"
              stroke-width="4"
              fill="none"
              stroke-dasharray="175.9"
              stroke-dashoffset="{175.9 - (175.9 * Math.min(Math.abs(currentX) / 100, 1))}"
              class="transition-none"
            />
          </svg>
          <!-- Plus icon -->
          <div class="relative z-10 flex items-center justify-center w-8 h-8">
            <div class="w-6 h-0.5 bg-white"></div>
            <div class="absolute w-0.5 h-6 bg-white"></div>
          </div>
        </div>
        <!-- Text -->
        <div class="text-center mt-2">
          <span class="font-mono text-sm text-green-400 font-bold">
            {languageStore.currentLanguage === 'es' ? 'Añadir evento' : 'Add event'}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Swipe left indicator (Skip) - Top Right -->
    <div class="absolute top-4 right-4 transition-all duration-200 {currentX < -20 ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}">
      <div class="relative">
        <!-- Circular progress background -->
        <div class="w-16 h-16 rounded-full border-4 border-red-400/30 bg-red-400/10 flex items-center justify-center">
          <!-- Circular progress stroke -->
          <svg class="w-16 h-16 absolute inset-0 transform -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgb(239, 68, 68)"
              stroke-width="4"
              fill="none"
              stroke-dasharray="175.9"
              stroke-dashoffset="{175.9 - (175.9 * Math.min(Math.abs(currentX) / 100, 1))}"
              class="transition-none"
            />
          </svg>
          <!-- X icon -->
          <div class="relative z-10 flex items-center justify-center w-8 h-8">
            <div class="w-6 h-0.5 bg-white transform rotate-45"></div>
            <div class="absolute w-6 h-0.5 bg-white transform -rotate-45"></div>
          </div>
        </div>
        <!-- Text -->
        <div class="text-center mt-2">
          <span class="font-mono text-sm text-red-400 font-bold">
            {languageStore.currentLanguage === 'es' ? 'Omitir evento' : 'Skip event'}
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Card transformation overlay -->
  {#if Math.abs(currentX) > 20}
    <div class="absolute inset-0 pointer-events-none">
      <div class="w-full h-full {currentX > 0 ? 'bg-green-400/20' : 'bg-red-400/20'} transition-colors duration-200"></div>
    </div>
  {/if}

  <!-- Conflict indicator -->
  {#if hasConflicts}
    <div class="absolute top-4 right-4 z-20">
      <button
        onclick={() => showConflictOverlay = true}
        class="p-2 bg-orange-500/20 backdrop-blur-sm rounded-full border border-orange-400/50 hover:bg-orange-500/30 transition-colors"
        aria-label="Show conflicts"
      >
        <AlertTriangle class="w-5 h-5 text-orange-400" />
      </button>
    </div>
  {/if}

  <!-- Main content -->
  <div class="flex-1 p-6 flex flex-col relative z-10">
    <!-- Header with time -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <Clock class="w-6 h-6 text-blue-400" />
        <div class="flex flex-col">
          <span class="font-mono text-white text-line-height-1">
            {getDayAbbreviation(event.day)}
          </span>
          <span class="font-mono text-white text-lg">
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </span>
        </div>
      </div>
    </div>

    <!-- Event title and description -->
    <div class="flex-1 mb-6">
      <h1 class="text-3xl font-serif text-white mb-4 leading-tight">
        {event.title}
      </h1>
      <p class="text-gray-300 font-mono">
        {event.description}
      </p>
    </div>

    <!-- Event details -->
    <div class="space-y-3 mb-6">
      <!-- Location -->
      <div class="flex items-center gap-3">
        <MapPin class="w-5 h-5 text-gray-400" />
        <span class="text-gray-300 font-mono">
          {event.location}{event.room ? ` - ${event.room}` : ''}
        </span>
      </div>

      <!-- Panelist -->
      {#if event.panelist}
        <div class="flex items-center gap-3">
          <Star class="w-5 h-5 text-yellow-400" />
          <span class="text-gray-300 font-mono">
            {t.hostedBy} {event.panelist}
          </span>
        </div>
      {/if}

      <!-- Category/Track -->
      {#if event.track}
        <div class="flex flex-wrap gap-2 mt-4">
          <span class="px-3 py-1 rounded-full text-sm font-mono {getTrackColor(event.track)}">
            {t.category}: {event.track}
          </span>
        </div>
      {/if}
    </div>
  </div>
  </div>

  <!-- Action buttons (desktop fallback) -->
  <div class="p-4 flex justify-between gap-3">
    <button
      onclick={() => onSwipeLeft(event)}
      class="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors font-mono text-sm flex-1 max-w-48"
    >
      {languageStore.currentLanguage === 'es' ? 'Omitir Evento' : 'Skip Event'}
    </button>
    <button
      onclick={() => onSwipeRight(event)}
      class="px-6 py-3 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-colors font-mono text-sm flex-1 max-w-48"
    >
      {languageStore.currentLanguage === 'es' ? 'Agregar al Calendario' : 'Add to Calendar'}
    </button>
  </div>

  <!-- Conflict Overlay Modal -->
  {#if showConflictOverlay}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" in:fade={{ duration: 300 }}>
      <div class="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 max-w-lg mx-4 w-full max-h-[80vh] overflow-y-auto" in:scale={{ duration: 400, easing: quintOut }}>
        <!-- Header -->
        <div class="flex items-center justify-between mb-4 sticky top-0 bg-gray-800/95 pb-2 z-10">
          <div class="flex items-center gap-3">
            <AlertTriangle class="w-6 h-6 text-orange-400" />
            <h3 class="text-xl font-serif text-white">{t.conflictingEvents}</h3>
          </div>
          <button
            onclick={() => showConflictOverlay = false}
            class="p-2 hover:bg-gray-700/50 rounded-full transition-colors"
            aria-label="Close conflicts"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <!-- Conflict details -->
        <div class="space-y-4">
          <p class="text-gray-300 text-sm">
            {t.youHaveSelected} <strong>{conflicts.length}</strong> {t.atSameTime}:
          </p>
          
          {#each conflicts as conflict}
            <div class="bg-gray-700/50 rounded-lg p-4 border border-orange-400/30">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="text-white font-serif text-lg mb-2">{conflict.event.title}</h4>
                  <div class="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <Clock class="w-4 h-4" />
                    <span>{formatTime(conflict.event.startTime)} - {formatTime(conflict.event.endTime)}</span>
                  </div>
                </div>
                <div class="ml-4">
                  <span class="px-2 py-1 rounded text-xs font-mono {conflict.conflictType === 'exact' ? 'bg-red-400/20 text-red-400' : 'bg-orange-400/20 text-orange-400'}">
                    {conflict.conflictType === 'exact' ? 'Exact' : 'Overlap'}
                  </span>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-6 sticky bottom-0 bg-gray-800/95 pt-2">
          <button
            onclick={() => showConflictOverlay = false}
            class="px-4 py-2 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors font-mono text-sm flex-1"
          >
            {t.closeConflicts}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Ensure smooth transitions */
  .transition-all {
    transition: all 0.3s ease-out;
  }
</style>
