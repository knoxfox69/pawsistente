<!--
  Purpose: Main event selection interface with TikTok-style swiping
  Context: Primary page for browsing and selecting Confuror events with swipe gestures
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { HelpCircle, Calendar, ChevronUp, ChevronDown, RotateCcw, ArrowLeft, Check } from 'lucide-svelte';
  import { languageStore } from '$lib/stores/language';
  import LanguageSelector from '$lib/components/LanguageSelector.svelte';
  import type { ConfurorEvent, DaySelection, EventGroup } from '$lib/confuror/types';
  import { ConfurorAPI, mockEvents } from '$lib/confuror/api';
  import DaySelector from '$lib/components/DaySelector.svelte';
  import EventCard from '$lib/components/EventCard.svelte';
  import EventSummary from '$lib/components/EventSummary.svelte';

  type AppState = 'day-selection' | 'event-browsing' | 'summary';
  type Day = 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

  let currentState: AppState = $state('day-selection');
  let selectedDays: Day[] = $state([]);
  let allEvents: ConfurorEvent[] = $state([]);
  let selectedEvents: ConfurorEvent[] = $state([]);
  let rejectedEvents: Set<string> = $state(new Set());
  let eventGroups: EventGroup[] = $state([]);
  let currentGroupIndex = $state(0);
  let currentEventIndex = $state(0);
  let isLoading = $state(false);
  let error: string | null = $state(null);
  let showSwipeOverlay = $state(false);
  let showDayDropdown = $state(false);
  let currentDay = $state<Day | null>(null);

  let t = $state(languageStore.translations);

  // Load events for selected days
  const loadEvents = async (dayToLoad?: Day) => {
    isLoading = true;
    error = null;
    
    try {
      // Use real API with fallback to mock data
      const events = await ConfurorAPI.getEventsForDays(selectedDays);
      allEvents = events;
      
      // Load manually added events from localStorage
      const manuallyAddedEvents = localStorage.getItem('manually-added-events');
      if (manuallyAddedEvents) {
        try {
          const parsedEvents = JSON.parse(manuallyAddedEvents);
          selectedEvents = [...selectedEvents, ...parsedEvents];
          // Clear the localStorage after loading
          localStorage.removeItem('manually-added-events');
        } catch (e) {
          console.warn('Failed to parse manually added events:', e);
        }
      }
      
      // Filter out already seen events if switching days
      if (dayToLoad && currentDay) {
        const seenEventIds = new Set([...selectedEvents.map(e => e.id), ...rejectedEvents]);
        allEvents = allEvents.filter(event => !seenEventIds.has(event.id));
      }
      
      // Set current day
      if (dayToLoad) {
        currentDay = dayToLoad;
      } else if (selectedDays.length > 0) {
        currentDay = selectedDays[0];
      }
      
      // Group events by time slot
      groupEventsByTimeSlot();
      
      currentState = 'event-browsing';
      // Show swipe overlay with delay and don't auto-close
      setTimeout(() => {
        showSwipeOverlay = true;
      }, 1000);
    } catch (err) {
      error = 'Failed to load events. Please try again.';
      console.error('Error loading events:', err);
    } finally {
      isLoading = false;
    }
  };

  // Group events by time slot for navigation
  const groupEventsByTimeSlot = () => {
    const grouped: Record<string, ConfurorEvent[]> = {};
    
    allEvents.forEach(event => {
      if (!grouped[event.timeSlot]) {
        grouped[event.timeSlot] = [];
      }
      grouped[event.timeSlot].push(event);
    });

    eventGroups = Object.entries(grouped).map(([timeSlot, events]) => ({
      timeSlot,
      events,
      currentIndex: 0
    }));

    // Sort groups by time
    eventGroups.sort((a, b) => {
      const timeA = a.events[0].startTime;
      const timeB = b.events[0].startTime;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
  };

  // Get current event
  let currentEvent = $derived(eventGroups[currentGroupIndex]?.events[currentEventIndex] || null);
  let currentGroup = $derived(eventGroups[currentGroupIndex]);
  let canNavigateUp = $derived(currentGroup && currentEventIndex > 0);
  let canNavigateDown = $derived(currentGroup && currentEventIndex < currentGroup.events.length - 1);

  // Handle day selection
  const handleDaysChange = (days: Day[]) => {
    selectedDays = days;
  };

  const handleContinueFromDays = () => {
    if (selectedDays.length > 0) {
      // Add a nice transition animation before loading events
      currentState = 'event-browsing';
      setTimeout(() => {
        loadEvents();
      }, 500);
    }
  };

  // Handle event swipes
  const handleSwipeLeft = (event: ConfurorEvent) => {
    rejectedEvents.add(event.id);
    nextEvent();
  };

  const handleSwipeRight = (event: ConfurorEvent) => {
    selectedEvents = [...selectedEvents, { ...event, isSelected: true }];
    nextEvent();
  };

  // Navigation functions
  const nextEvent = () => {
    if (canNavigateDown) {
      currentEventIndex++;
    } else {
      // Move to next time slot
      if (currentGroupIndex < eventGroups.length - 1) {
        currentGroupIndex++;
        currentEventIndex = 0;
      } else {
        // All events viewed, go to summary
        currentState = 'summary';
      }
    }
  };

  const navigateUp = () => {
    if (canNavigateUp) {
      currentEventIndex--;
    }
  };

  const navigateDown = () => {
    if (canNavigateDown) {
      currentEventIndex++;
    }
  };

  // Summary actions
  const handleRemoveEvent = (eventId: string) => {
    selectedEvents = selectedEvents.filter(event => event.id !== eventId);
  };

  const handleAddMoreDays = () => {
    currentState = 'day-selection';
  };

  const handleStartOver = () => {
    selectedDays = [];
    selectedEvents = [];
    rejectedEvents.clear();
    currentGroupIndex = 0;
    currentEventIndex = 0;
    currentState = 'day-selection';
  };

  const handleExportCalendar = (events: ConfurorEvent[]) => {
    // Calendar export is handled in EventSummary component
    console.log('Exporting calendar with events:', events);
  };

  // Manual day selection
  const showDaySelector = () => {
    currentState = 'day-selection';
  };

  // Switch to a different day
  const switchToDay = async (day: Day) => {
    showDayDropdown = false;
    await loadEvents(day);
  };

  // Get current day display name
  const getCurrentDayDisplay = () => {
    if (!currentDay) return '';
    const dayNames = {
      'Thursday': t.thursday,
      'Friday': t.friday,
      'Saturday': t.saturday,
      'Sunday': t.sunday
    };
    return dayNames[currentDay];
  };

  // Reset current time slot
  const resetCurrentSlot = () => {
    if (currentGroup) {
      currentGroup.currentIndex = 0;
      currentEventIndex = 0;
    }
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (showDayDropdown) {
      showDayDropdown = false;
    }
  };

  // Language store subscription
  let unsubscribe: (() => void) | undefined;

  onMount(() => {
    unsubscribe = languageStore.subscribe(() => {
      t = languageStore.translations;
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
</script>

<div class="h-screen w-full overflow-hidden bg-gradient-to-b from-gray-900 to-black" onclick={handleClickOutside}>
  <!-- Header with controls -->
  <div class="fixed top-4 left-4 right-4 z-50 flex justify-between items-center">
    <!-- Day indicator and event counter on the left -->
    {#if currentState === 'event-browsing'}
      <div class="flex items-center gap-4">
        <!-- Day indicator with dropdown -->
        <div class="relative">
          <button
            onclick={() => showDayDropdown = !showDayDropdown}
            class="bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white flex items-center gap-2 hover:bg-gray-700/50 transition-colors"
            aria-label="Switch day"
          >
            <span class="font-serif text-lg">{getCurrentDayDisplay()}</span>
            <ChevronDown class="h-4 w-4 text-gray-400" />
          </button>
          
          <!-- Day dropdown -->
          {#if showDayDropdown}
            <div class="absolute top-12 left-0 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700 shadow-lg z-50 min-w-48">
              <div class="p-2">
                {#each selectedDays as day}
                  <button
                    onclick={() => switchToDay(day)}
                    class="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-700/50 rounded transition-colors {currentDay === day ? 'bg-blue-400/20 text-blue-400' : 'text-white'}"
                  >
                    <span class="font-serif">
                      {day === 'Thursday' ? t.thursday : day === 'Friday' ? t.friday : day === 'Saturday' ? t.saturday : t.sunday}
                    </span>
                    {#if currentDay === day}
                      <Check class="w-4 h-4" />
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        
        <!-- Event counter -->
        <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div class="font-mono text-sm text-gray-300">
            {t.eventOf} {currentGroupIndex + 1} {t.of} {eventGroups.length}
          </div>
        </div>
      </div>
    {:else}
      <div></div>
    {/if}
    
    <!-- Controls on the right -->
    <div class="flex gap-2">
      {#if currentState === 'event-browsing'}
        <button
          onclick={showDaySelector}
          class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50"
          aria-label="Change days"
        >
          <Calendar class="h-5 w-5 text-gray-400" />
        </button>
      {/if}
      
      <a
        href="/about"
        class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50"
        aria-label="About"
      >
        <HelpCircle class="h-5 w-5 text-gray-400" />
      </a>
      <LanguageSelector />
    </div>
  </div>

  <!-- Day Selection State -->
  {#if currentState === 'day-selection'}
    <DaySelector 
      {selectedDays} 
      onDaysChange={handleDaysChange} 
      onContinue={handleContinueFromDays} 
    />
  {/if}

  <!-- Event Browsing State -->
  {#if currentState === 'event-browsing'}
    {#if isLoading}
      <div class="flex h-screen w-full items-center justify-center">
        <div class="text-center">
          <div class="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div class="font-mono text-white text-lg">{t.loadingEvents}</div>
        </div>
      </div>
    {:else if error}
      <div class="flex h-screen w-full items-center justify-center">
        <div class="text-center">
          <div class="text-red-400 text-xl mb-4">⚠️</div>
          <div class="font-mono text-white text-lg mb-4">{error}</div>
          <button
            onclick={loadEvents}
            class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-transform"
          >
            Intentar de Nuevo
          </button>
        </div>
      </div>
    {:else if currentEvent}
      <div class="h-screen w-full snap-y snap-mandatory overflow-y-scroll">
        <div class="relative flex h-screen w-full snap-start items-center justify-center pt-20 pb-20">
          <EventCard
            event={currentEvent}
            isSelected={selectedEvents.some(e => e.id === currentEvent.id)}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onNavigateUp={navigateUp}
            onNavigateDown={navigateDown}
            {canNavigateUp}
            {canNavigateDown}
            showNavigation={currentGroup.events.length > 1}
          />
        </div>
      </div>

      <!-- Swipe instructions overlay -->
      {#if showSwipeOverlay}
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" in:fade={{ duration: 500 }}>
          <div class="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 text-center max-w-lg mx-4" in:scale={{ duration: 600, easing: quintOut }}>
            <div class="text-6xl mb-6 animate-bounce">👆</div>
            <h3 class="text-2xl font-serif text-white mb-6">
              {languageStore.currentLanguage === 'es' ? 'Desliza para seleccionar' : 'Swipe to select'}
            </h3>
            <div class="flex justify-center gap-12 mb-8">
              <div class="text-center">
                <div class="w-20 h-20 rounded-full bg-red-400/20 border-4 border-red-400/30 flex items-center justify-center mb-3 relative">
                  <div class="w-8 h-0.5 bg-white transform rotate-45"></div>
                  <div class="absolute w-8 h-0.5 bg-white transform -rotate-45"></div>
                  <!-- Animated left arrow -->
                  <div class="absolute -left-8 top-1/2 transform -translate-y-1/2 text-red-400 animate-pulse">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                  </div>
                </div>
                <p class="text-red-400 font-mono text-sm font-bold">
                  {languageStore.currentLanguage === 'es' ? 'Omitir' : 'Skip'}
                </p>
              </div>
              <div class="text-center">
                <div class="w-20 h-20 rounded-full bg-green-400/20 border-4 border-green-400/30 flex items-center justify-center mb-3 relative">
                  <div class="w-8 h-0.5 bg-white"></div>
                  <div class="absolute w-0.5 h-8 bg-white"></div>
                  <!-- Animated right arrow -->
                  <div class="absolute -right-8 top-1/2 transform -translate-y-1/2 text-green-400 animate-pulse">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
                <p class="text-green-400 font-mono text-sm font-bold">
                  {languageStore.currentLanguage === 'es' ? 'Agregar' : 'Add'}
                </p>
              </div>
            </div>
            <div class="text-gray-400 text-sm mb-6">
              {languageStore.currentLanguage === 'es' ? 'Desliza la tarjeta hacia la izquierda o derecha' : 'Swipe the card left or right'}
            </div>
            <button
              onclick={() => showSwipeOverlay = false}
              class="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-transform font-medium"
            >
              {languageStore.currentLanguage === 'es' ? 'Entendido' : 'Got it'}
            </button>
          </div>
        </div>
      {/if}
    {:else}
      <!-- No more events -->
      <div class="flex h-screen w-full items-center justify-center">
        <div class="text-center">
          <div class="text-6xl mb-6">🎉</div>
          <h2 class="text-3xl font-serif text-white mb-4">{t.noMoreEvents}</h2>
          <p class="text-gray-400 mb-8">You've viewed all events for the selected days.</p>
          <button
            onclick={() => currentState = 'summary'}
            class="px-8 py-4 bg-gradient-to-r from-green-400 to-green-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
          >
            {t.viewSelectedEvents}
          </button>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Summary State -->
  {#if currentState === 'summary'}
    <EventSummary
      {selectedEvents}
      onRemoveEvent={handleRemoveEvent}
      onAddMoreDays={handleAddMoreDays}
      onStartOver={handleStartOver}
      onExportCalendar={handleExportCalendar}
    />
  {/if}
</div>

<style>
  /* Hide scrollbar for Chrome, Safari and Opera */
  .snap-y::-webkit-scrollbar {
    display: none;
  }
  
  .snap-y {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
</style>
