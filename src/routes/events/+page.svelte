<!--
  Purpose: Main event selection interface with TikTok-style swiping
  Context: Primary page for browsing and selecting Confuror events with swipe gestures
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { HelpCircle, Calendar, Plus } from 'lucide-svelte';
  import { languageStore } from '$lib/stores/language';
  import { appState } from '$lib/stores/appState';
  import { trackClientPageView, trackClientPageLoad } from '$lib/utils/clientMetrics';
  import Header from '$lib/components/Header.svelte';
  import AddEventOverlay from '$lib/components/AddEventOverlay.svelte';
  import type { ConventionEvent } from '$lib/convention/types';
  import { ConventionAPI } from '$lib/convention/api';
  import DaySelector from '$lib/components/DaySelector.svelte';
  import EventCard from '$lib/components/EventCard.svelte';

  type AppState = 'day-selection' | 'event-browsing';
  type Day = 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

  let currentState: AppState = $state(appState.currentState as AppState);
  let selectedDays: Day[] = $state(appState.selectedDays as Day[]);
  let allEvents: ConventionEvent[] = $state([]);
  let allEventsCache: ConventionEvent[] = $state([]);
  let selectedEvents: ConventionEvent[] = $state(appState.selectedEvents);
  let rejectedEvents: Set<string> = $state(new Set(appState.rejectedEvents));
  let unseenEvents: Set<string> = $state(new Set(appState.unseenEvents));
  let isLoading = $state(false);
  let error: string | null = $state(null);
  let showSwipeOverlay = $state(false);
  let currentDay = $state<Day | null>(null);
  let showAddEventOverlay = $state(false);
  let currentLanguage = $state(languageStore.currentLanguage);
  let includeRejectedAgain = $state(false); // When true, re-include skipped (rejected) events but still exclude selected

  let t = $state(languageStore.translations);

  // Apply filters when events are loaded or when explicitly needed
  const applyFiltersIfNeeded = () => {
    if (allEventsCache.length > 0) {
      applyEventFilters();
    }
  };

  // Load events for selected days
  const loadEvents = async (dayToLoad?: Day) => {
    isLoading = true;
    error = null;
    
    try {
      // Use real API with fallback to mock data
      const events = await ConventionAPI.getEventsForDays(selectedDays);
      allEventsCache = events;
      
      // Sync with app state
      selectedEvents = appState.selectedEvents;
      rejectedEvents = new Set(appState.rejectedEvents);
      unseenEvents = new Set(appState.unseenEvents);
      
      // Initialize unseen events if empty (first time loading)
      if (unseenEvents.size === 0) {
        const allEventIds = events.map(e => e.id);
        const selectedIds = new Set(selectedEvents.map(e => e.id));
        const rejectedIds = new Set(rejectedEvents);
        const initialUnseen = allEventIds.filter(id => !selectedIds.has(id) && !rejectedIds.has(id));
        appState.setUnseenEvents(initialUnseen);
        unseenEvents = new Set(initialUnseen);
      }
      
      // Set current day
      if (dayToLoad) {
        currentDay = dayToLoad;
      } else if (selectedDays.length > 0) {
        currentDay = selectedDays[0];
      }
      
      // Apply filters after syncing with app state
      applyFiltersIfNeeded();
      
      currentState = 'event-browsing';
      // Show swipe overlay with delay only if user has no selected events
      if (selectedEvents.length === 0) {
        setTimeout(() => {
          showSwipeOverlay = true;
        }, 500); // Reduced from 1000ms to 500ms
      }
    } catch (err) {
      error = 'Failed to load events. Please try again.';
      console.error('Error loading events:', err);
    } finally {
      isLoading = false;
    }
  };

  // Apply filters to events based on user progress
  const applyEventFilters = () => {
    // Purpose: Produce the working list of events considering selections and skips
    // Context: Show only unseen events by default; optionally re-include rejected (skipped) ones
    const selectedIds = new Set(selectedEvents.map(e => e.id));
    
    allEvents = allEventsCache.filter((e) => {
      if (selectedIds.has(e.id)) return false; // never show chosen events again
      if (!includeRejectedAgain && !unseenEvents.has(e.id)) return false; // only show unseen events unless revisiting
      return true;
    });
  };

  // Check if we should load events on mount
  onMount(() => {
    // Track page metrics
    trackClientPageView('events');
    trackClientPageLoad('events');
    
    // Sync with app state
    selectedEvents = appState.selectedEvents;
    rejectedEvents = new Set(appState.rejectedEvents);
    unseenEvents = new Set(appState.unseenEvents);
    currentState = appState.currentState as AppState;
    
    // Subscribe to app state changes to keep everything in sync
    unsubscribeAppState = appState.subscribe(() => {
      selectedEvents = appState.selectedEvents;
      rejectedEvents = new Set(appState.rejectedEvents);
      unseenEvents = new Set(appState.unseenEvents);
      currentState = appState.currentState as AppState;
    });
    
    // If we have selected days and no events loaded, load them
    if (selectedDays.length > 0 && allEvents.length === 0) {
      loadEvents();
    }
    
    unsubscribeLanguage = languageStore.subscribe(() => {
      t = languageStore.translations;
      currentLanguage = languageStore.currentLanguage;
    });
  });


  // Remaining unseen events counter
  const remainingUnseen = $derived(unseenEvents.size);

  // Get current event from filtered events (first one)
  let currentEvent: ConventionEvent | null = $state(null);
  
  // Update current event when allEvents changes
  $effect(() => {
    currentEvent = allEvents.length > 0 ? allEvents[0] : null;
  });

  // Handle day selection
  const handleDaysChange = (days: Day[]) => {
    selectedDays = days;
    appState.setSelectedDays(days);
  };

  const handleContinueFromDays = () => {
    if (selectedDays.length > 0) {
      // Add a nice transition animation before loading events
      currentState = 'event-browsing';
      appState.setCurrentState('event-browsing');
      setTimeout(() => {
        loadEvents();
      }, 500);
    }
  };

  // Handle event swipes
  const handleSwipeLeft = (event: ConventionEvent) => {
    // Track event removal
    fetch('/api/metrics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'event_removed',
        eventId: event.id,
        eventName: event.title,
        day: event.day
      })
    }).catch(console.error);
    
    // Remove from unseen and add to rejected
    unseenEvents.delete(event.id);
    rejectedEvents.add(event.id);
    appState.removeUnseenEvent(event.id);
    appState.addRejectedEvent(event.id);
    
    // Remove from filtered events array
    allEvents = allEvents.filter(e => e.id !== event.id);
  };

  const handleSwipeRight = (event: ConventionEvent) => {
    // Track event addition
    fetch('/api/metrics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'event_added',
        eventId: event.id,
        eventName: event.title,
        day: event.day
      })
    }).catch(console.error);
    
    const newEvent = { ...event, isSelected: true };
    selectedEvents = [...selectedEvents, newEvent];
    // addSelectedEvent will automatically remove from unseen events
    appState.addSelectedEvent(newEvent);
    
    // Remove from filtered events array
    allEvents = allEvents.filter(e => e.id !== event.id);
  };

  // Revisit skipped events: show all non-chosen events again
  const revisitSkippedEvents = () => {
    includeRejectedAgain = true;
    // Move all rejected events back to unseen
    appState.moveRejectedToUnseen();
    unseenEvents = new Set(appState.unseenEvents);
    // Re-apply filters to show all non-selected events
    applyEventFilters();
    currentState = 'event-browsing';
    appState.setCurrentState('event-browsing');
  };

  // Store subscriptions
  let unsubscribeAppState: (() => void) | undefined;
  let unsubscribeLanguage: (() => void) | undefined;

  onDestroy(() => {
    if (unsubscribeAppState) {
      unsubscribeAppState();
    }
    if (unsubscribeLanguage) {
      unsubscribeLanguage();
    }
  });
</script>

<div 
  class="h-screen w-full overflow-hidden bg-gradient-to-b from-gray-900 to-black" 
  role="main"
>
  <!-- Header with controls -->
  <Header 
    showBackButton={true}
    showLanguageSelector={false}
    {currentState}
    showBackground={true}
    showOutline={true}
    showSeparator={true}
    anchored={false}
    overlay={true}
    className=""
  >
    {#snippet center()}
      {#if currentState === 'event-browsing' && remainingUnseen > 0}
        <!-- Unseen events counter -->
        <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div class="font-mono text-sm text-gray-300">
            {t.unseenEvents}: {remainingUnseen}
          </div>
        </div>
      {/if}
    {/snippet}

    {#snippet right()}
      {#if selectedEvents.length > 0}
        <a
          href="/schedule"
          class="bg-green-500/20 backdrop-blur-sm rounded-lg px-4 py-2 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-2"
          title={languageStore.currentLanguage === 'es' ? 'Ver horario' : 'View schedule'}
        >
          <Calendar class="w-4 h-4" />
          <span class="font-mono text-sm">{selectedEvents.length}</span>
        </a>
      {/if}
      {#if currentState !== 'event-browsing'}
      <a
        href="/about"
        class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50 flex items-center justify-center"
        aria-label="About"
      >
        <HelpCircle class="h-5 w-5 text-gray-400" />
      </a>
      {/if}
    {/snippet}
  </Header>


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
          <!--
            Purpose: Display error message and provide a retry button to reload events in case of error.
            Context: Error UI within the event browsing state; ensures accessibility and proper Svelte/TikTok-like styling.
          -->
          <div class="font-mono text-white text-lg mb-4">{error}</div>
          <button
            onclick={() => loadEvents()}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                loadEvents();
              }
            }}
            class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-transform"
            aria-label="Retry loading events"
          >
            Intentar de Nuevo
          </button>
        </div>
      </div>
    {:else if currentEvent}
      <div class="h-screen w-full snap-y snap-mandatory overflow-y-scroll">
        <div class="relative flex h-screen w-full snap-start items-center justify-center pt-25 pb-10 px-5">
          <EventCard
            event={currentEvent}
            isSelected={selectedEvents.some(e => e.id === currentEvent?.id)}
            selectedEvents={selectedEvents}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        </div>
      </div>

      <!-- Swipe instructions overlay -->
      {#if showSwipeOverlay}
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" in:fade={{ duration: 500 }}>
          <div class="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 text-center max-w-lg mx-4" in:scale={{ duration: 600, easing: quintOut }}>
            <div class="text-6xl mb-6">
              <span class="inline-block animate-swipe-horizontal">👉</span>
            </div>
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
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  showSwipeOverlay = false;
                }
              }}
              class="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-transform font-medium"
            >
              {languageStore.currentLanguage === 'es' ? 'Entendido' : 'Got it'}
            </button>
          </div>
        </div>
      {/if}
    {:else}
      <!-- No more events -->
      <div class="flex h-screen w-full items-center justify-center px-6">
        <div class="text-center max-w-md w-full">
          <div class="text-6xl mb-6">🎉</div>
          <h2 class="text-3xl font-serif text-white mb-4">{t.noMoreEvents}</h2>
          <p class="text-gray-400 mb-8">{currentLanguage === 'es' ? 'Has visto todos los eventos para los días seleccionados.' : 'You\'ve viewed all events for the selected days.'}</p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <a
              href="/schedule"
              class="px-8 py-4 bg-gradient-to-r from-green-400 to-green-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 flex items-center gap-3 justify-center"
            >
              <Calendar class="w-5 h-5" />
              {currentLanguage === 'es' ? 'Ver Horario' : 'View Schedule'}
            </a>
            
            <button
              onclick={revisitSkippedEvents}
              class="px-8 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-3 justify-center"
            >
              <Plus class="w-5 h-5" />
              {currentLanguage === 'es' ? t.revisitSkipped : t.revisitSkipped}
            </button>
          </div>
        </div>
      </div>
    {/if}
  {/if}


  <!-- Add Event Overlay -->
  {#if showAddEventOverlay}
    <AddEventOverlay onClose={() => showAddEventOverlay = false} />
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

  /* Horizontal swipe animation for hand emoji */
  @keyframes swipe-horizontal {
    0%, 100% {
      transform: translateX(-20px);
    }
    50% {
      transform: translateX(20px);
    }
  }

  .animate-swipe-horizontal {
    animation: swipe-horizontal 2s ease-in-out infinite;
  }
</style>
