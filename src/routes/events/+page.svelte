<!--
  Purpose: Main event selection interface with TikTok-style swiping
  Context: Primary page for browsing and selecting Confuror events with swipe gestures
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import { HelpCircle, Calendar, RotateCcw, ArrowLeft, Check, Plus } from 'lucide-svelte';
  import { languageStore } from '$lib/stores/language';
  import { appState } from '$lib/stores/appState';
  import Header from '$lib/components/Header.svelte';
  import AddEventOverlay from '$lib/components/AddEventOverlay.svelte';
  import type { ConventionEvent, DaySelection, EventGroup } from '$lib/convention/types';
  import { ConfurorAPI, mockEvents } from '$lib/convention/api';
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
  let eventGroups: EventGroup[] = $state([]);
  let currentGroupIndex = $state(appState.currentGroupIndex);
  let currentEventIndex = $state(appState.currentEventIndex);
  let isLoading = $state(false);
  let error: string | null = $state(null);
  let showSwipeOverlay = $state(false);
  let currentDay = $state<Day | null>(null);
  let showAddEventOverlay = $state(false);
  let currentLanguage = $state(languageStore.currentLanguage);

  let t = $state(languageStore.translations);

  // Load events for selected days
  const loadEvents = async (dayToLoad?: Day) => {
    isLoading = true;
    error = null;
    
    try {
      // Use real API with fallback to mock data
      const events = await ConfurorAPI.getEventsForDays(selectedDays);
      allEventsCache = events;
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
      
      // Set current day
      if (dayToLoad) {
        currentDay = dayToLoad;
      } else if (selectedDays.length > 0) {
        currentDay = selectedDays[0];
      }
      
      // Group events by time slot
      groupEventsByTimeSlot();
      
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

  // Check if we should load events on mount
  onMount(() => {
    // If we have selected days and no events loaded, load them
    if (selectedDays.length > 0 && allEvents.length === 0) {
      loadEvents();
    }
    
    unsubscribe = languageStore.subscribe(() => {
      t = languageStore.translations;
      currentLanguage = languageStore.currentLanguage;
    });
  });

  // Group events by time slot for navigation
  const groupEventsByTimeSlot = () => {
    // Simple grouping by time slot with chronological sorting
    const grouped: Record<string, ConventionEvent[]> = {};
    
    allEvents.forEach(event => {
      if (!grouped[event.timeSlot]) {
        grouped[event.timeSlot] = [];
      }
      grouped[event.timeSlot].push(event);
    });

    eventGroups = Object.entries(grouped).map(([timeSlot, events]) => ({
      timeSlot,
      events: events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
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
    rejectedEvents.add(event.id);
    appState.addRejectedEvent(event.id);
    nextEvent();
  };

  const handleSwipeRight = (event: ConventionEvent) => {
    const newEvent = { ...event, isSelected: true };
    selectedEvents = [...selectedEvents, newEvent];
    appState.addSelectedEvent(newEvent);
    nextEvent();
  };

  // Navigation functions
  const nextEvent = () => {
    if (currentEventIndex < currentGroup.events.length - 1) {
      currentEventIndex++;
      appState.setCurrentEventIndex(currentEventIndex);
    } else {
      // Move to next time slot
      if (currentGroupIndex < eventGroups.length - 1) {
        currentGroupIndex++;
        currentEventIndex = 0;
        appState.setCurrentGroupIndex(currentGroupIndex);
        appState.setCurrentEventIndex(currentEventIndex);
      } else {
        // All events viewed, go to feed page
        goto('/feed');
      }
    }
  };

  // Navigation actions
  const handleAddMoreDays = () => {
    currentState = 'day-selection';
    appState.setCurrentState('day-selection');
  };

  const handleStartOver = () => {
    selectedDays = [];
    selectedEvents = [];
    rejectedEvents.clear();
    currentGroupIndex = 0;
    currentEventIndex = 0;
    currentState = 'day-selection';
    appState.clearState();
  };





  // Language store subscription
  let unsubscribe: (() => void) | undefined;

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
</script>

<div 
  class="h-screen w-full overflow-hidden bg-gradient-to-b from-gray-900 to-black" 
  role="main"
>
  <!-- Header with controls -->
  <Header 
    showBackButton={false}
    anchored={false}
    overlay={true}
    className="top-4 left-4 right-4"
  >
    {#snippet left()}
      {#if currentState === 'event-browsing'}
        <!-- Event counter -->
        <div class="bg-gray-800/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div class="font-mono text-sm text-gray-300">
            {t.eventOf} {currentGroupIndex + 1} {t.of} {eventGroups.length}
          </div>
        </div>
        
        <!-- View Selected Events Buttons -->
        {#if selectedEvents.length > 0}
          <a
            href="/schedule"
            class="bg-green-500/20 backdrop-blur-sm rounded-lg px-4 py-2 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-2"
            title={languageStore.currentLanguage === 'es' ? 'Ver horario' : 'View schedule'}
          >
            <Calendar class="w-4 h-4" />
            <span class="font-mono text-sm">{selectedEvents.length}</span>
          </a>
          <a
            href="/feed"
            class="bg-blue-500/20 backdrop-blur-sm rounded-lg px-4 py-2 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-2"
            title={languageStore.currentLanguage === 'es' ? 'Ver todos los eventos' : 'View all events'}
          >
            <Calendar class="w-4 h-4" />
          </a>
        {/if}
      {/if}
    {/snippet}

    {#snippet right()}
      {#if currentState === 'event-browsing'}
        <button
          onclick={() => showAddEventOverlay = true}
          class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50 flex items-center justify-center"
          aria-label="Add events manually"
        >
          <Plus class="h-5 w-5 text-gray-400" />
        </button>
      {/if}
      <a
        href="/about"
        class="rounded-full bg-gray-800/50 p-2 backdrop-blur-sm transition-colors hover:bg-gray-700/50 flex items-center justify-center"
        aria-label="About"
      >
        <HelpCircle class="h-5 w-5 text-gray-400" />
      </a>
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
        <div class="relative flex h-screen w-full snap-start items-center justify-center pt-20 pb-20">
          <EventCard
            event={currentEvent}
            isSelected={selectedEvents.some(e => e.id === currentEvent.id)}
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
            
            <a
              href="/feed"
              class="px-8 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-3 justify-center"
            >
              <Calendar class="w-5 h-5" />
              {currentLanguage === 'es' ? 'Ver Todos los Eventos' : 'View All Events'}
            </a>
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
