<!--
  Purpose: Manual event addition page with summarized list view
  Context: Allows users to manually add events by selecting from a list of available events
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { ArrowLeft, Clock, MapPin, Star, Plus, Check } from 'lucide-svelte';
  import { languageStore } from '$lib/stores/language';
  import { goto } from '$app/navigation';
  import type { ConventionEvent } from '$lib/convention/types';
  import { ConfurorAPI } from '$lib/convention/api';

  let allEvents: ConventionEvent[] = $state([]);
  let selectedEvents: ConventionEvent[] = $state([]);
  let isLoading = $state(false);
  let error: string | null = $state(null);
  let searchQuery = $state('');

  let t = $state(languageStore.translations);
  let currentLanguage = $state(languageStore.currentLanguage);

  // Load all available events
  const loadAllEvents = async () => {
    isLoading = true;
    error = null;
    
    try {
      // Get events for all days
      const allDays: ('Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
      allEvents = await ConfurorAPI.getEventsForDays(allDays);
    } catch (err) {
      error = 'Failed to load events. Please try again.';
      console.error('Error loading events:', err);
    } finally {
      isLoading = false;
    }
  };

  // Filter events based on search query
  let filteredEvents: ConventionEvent[] = $state([]);
  
  // Update filtered events when allEvents or searchQuery changes
  $effect(() => {
    if (!searchQuery.trim()) {
      filteredEvents = allEvents;
    } else {
      filteredEvents = allEvents.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.panelist && event.panelist.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
  });

  // Toggle event selection
  const toggleEventSelection = (event: ConventionEvent) => {
    if (selectedEvents.some(e => e.id === event.id)) {
      selectedEvents = selectedEvents.filter(e => e.id !== event.id);
    } else {
      selectedEvents = [...selectedEvents, { ...event, isSelected: true }];
    }
  };

  // Check if event is selected
  const isEventSelected = (event: ConventionEvent) => {
    return selectedEvents.some(e => e.id === event.id);
  };

  // Add selected events to calendar
  const addSelectedEvents = () => {
    if (selectedEvents.length === 0) {
      // If no events selected, just go back
      goto('/events');
      return;
    }
    
    // Store selected events in localStorage for the main app to pick up
    localStorage.setItem('manually-added-events', JSON.stringify(selectedEvents));
    // Navigate back to events page
    goto('/events');
  };

  // Format time
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format day name
  const formatDayName = (day: string) => {
    const dayNames = {
      'Thursday': currentLanguage === 'es' ? 'Jueves' : 'Thursday',
      'Friday': currentLanguage === 'es' ? 'Viernes' : 'Friday',
      'Saturday': currentLanguage === 'es' ? 'Sábado' : 'Saturday',
      'Sunday': currentLanguage === 'es' ? 'Domingo' : 'Sunday'
    };
    return dayNames[day as keyof typeof dayNames] || day;
  };

  // Language store subscription
  let unsubscribe: (() => void) | undefined;

  onMount(() => {
    loadAllEvents();
    
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

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-black">
  <!-- Header -->
  <div class="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
    <div class="flex items-center justify-between p-4">
      <button
        onclick={() => goto('/events')}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goto('/events');
          }
        }}
        class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft class="w-5 h-5" />
        <span class="font-mono text-sm">{currentLanguage === 'es' ? 'Volver' : 'Back'}</span>
      </button>
      
      <h1 class="text-xl font-serif text-white">
        {currentLanguage === 'es' ? 'Agregar Eventos' : 'Add Events'}
      </h1>
      
      {#if selectedEvents.length > 0}
        <button
          onclick={addSelectedEvents}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              addSelectedEvents();
            }
          }}
          class="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
          aria-label="Add selected events to calendar"
        >
          <Plus class="w-4 h-4" />
          <span class="font-mono text-sm">
            {selectedEvents.length} {currentLanguage === 'es' ? 'eventos' : 'events'}
          </span>
        </button>
      {:else}
        <div class="w-20"></div>
      {/if}
    </div>
  </div>

  <!-- Search -->
  <div class="p-4">
    <input
      bind:value={searchQuery}
      type="text"
      placeholder={currentLanguage === 'es' ? 'Buscar eventos...' : 'Search events...'}
      class="w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
    />
  </div>

  <!-- Content -->
  <div class="p-4">
    {#if isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else if error}
      <div class="text-center py-12">
        <div class="text-red-400 text-xl mb-4">⚠️</div>
        <div class="text-white text-lg mb-4">{error}</div>
        <button
          onclick={loadAllEvents}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              loadAllEvents();
            }
          }}
          class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-transform"
        >
          {currentLanguage === 'es' ? 'Intentar de Nuevo' : 'Try Again'}
        </button>
      </div>
    {:else}
      <!-- Events List -->
      <div class="space-y-3">
        {#each filteredEvents as event, index}
          <button
            onclick={() => toggleEventSelection(event)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleEventSelection(event);
              }
            }}
            class="w-full text-left bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer hover:scale-[1.02] {isEventSelected(event) ? 'border-blue-400 bg-blue-400/10' : ''}"
            in:scale={{ duration: 300, delay: index * 50 }}
            aria-pressed={isEventSelected(event)}
            aria-label={`${isEventSelected(event) ? 'Deselect' : 'Select'} event: ${event.title}`}
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-serif text-white mb-2">{event.title}</h3>
                
                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-2">
                  <div class="flex items-center gap-2">
                    <Clock class="w-4 h-4" />
                    <span class="font-mono">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <MapPin class="w-4 h-4" />
                    <span class="font-mono">
                      {event.location}{event.room ? ` - ${event.room}` : ''}
                    </span>
                  </div>
                  
                  {#if event.panelist}
                    <div class="flex items-center gap-2">
                      <Star class="w-4 h-4 text-yellow-400" />
                      <span class="font-mono">{event.panelist}</span>
                    </div>
                  {/if}
                </div>
                
                <p class="text-sm text-gray-500 font-mono">
                  {formatDayName(event.day)} • {event.track || 'General'}
                </p>
              </div>
              
              <!-- Selection indicator -->
              <div class="ml-4">
                {#if isEventSelected(event)}
                  <div class="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                    <Check class="w-4 h-4 text-white" />
                  </div>
                {:else}
                  <div class="w-6 h-6 border-2 border-gray-600 rounded-full"></div>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
      
      {#if filteredEvents.length === 0}
        <div class="text-center py-12">
          <div class="text-gray-400 text-lg mb-4">
            {currentLanguage === 'es' ? 'No se encontraron eventos' : 'No events found'}
          </div>
          <p class="text-gray-500">
            {currentLanguage === 'es' ? 'Intenta con otros términos de búsqueda' : 'Try different search terms'}
          </p>
        </div>
      {/if}
    {/if}
  </div>
</div>
