<!--
  Purpose: Overlay component for manually adding events
  Context: Provides a searchable list of all events that users can select and add to their schedule
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale, fly } from 'svelte/transition';
  import { X, Clock, MapPin, Star, Plus, Check, Search } from 'lucide-svelte';
  import { languageStore } from '$lib/stores/language';
  import { appState } from '$lib/stores/appState';
  import type { ConventionEvent } from '$lib/convention/types';
  import { ConfurorAPI } from '$lib/convention/api';

  interface Props {
    onClose: () => void;
  }

  const { onClose }: Props = $props();

  let allEvents: ConventionEvent[] = $state([]);
  let selectedEvents: ConventionEvent[] = $state([]);
  let isLoading = $state(false);
  let error: string | null = $state(null);
  let searchQuery = $state('');

  let t = $derived(languageStore.translations);
  let currentLanguage = $derived(languageStore.currentLanguage);

  // Load all available events
  const loadAllEvents = async () => {
    isLoading = true;
    error = null;
    
    try {
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
  let filteredEvents = $derived(() => {
    if (!searchQuery.trim()) {
      return allEvents;
    }
    return allEvents.filter(event => 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.panelist && event.panelist.toLowerCase().includes(searchQuery.toLowerCase()))
    );
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
      onClose();
      return;
    }
    
    // Add events to app state
    selectedEvents.forEach(event => {
      appState.addSelectedEvent(event);
    });
    
    onClose();
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

  onMount(() => {
    loadAllEvents();
  });
</script>

<!-- Backdrop -->
<div 
  class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  role="button"
  tabindex="0"
  onclick={onClose}
  onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
  aria-label="Close overlay"
  in:fade={{ duration: 300 }}
>
  <!-- Overlay Content -->
  <div 
    class="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    in:scale={{ duration: 400, start: 0.95 }}
  >
    <!-- Header -->
    <div class="bg-gray-800/50 border-b border-gray-700 p-4 flex items-center justify-between">
      <h2 class="text-2xl font-serif text-white">
        {currentLanguage === 'es' ? 'Agregar Eventos' : 'Add Events'}
      </h2>
      
      <div class="flex items-center gap-3">
        {#if selectedEvents.length > 0}
          <button
            onclick={addSelectedEvents}
            class="flex items-center gap-2 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
            aria-label="Add selected events"
          >
            <Plus class="w-4 h-4" />
            <span class="font-mono text-sm">
              {selectedEvents.length}
            </span>
          </button>
        {/if}
        
        <button
          onclick={onClose}
          class="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="p-4 border-b border-gray-800">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          bind:value={searchQuery}
          type="text"
          placeholder={currentLanguage === 'es' ? 'Buscar eventos...' : 'Search events...'}
          class="w-full pl-10 pr-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
        />
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
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
            class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-transform"
          >
            {currentLanguage === 'es' ? 'Intentar de Nuevo' : 'Try Again'}
          </button>
        </div>
      {:else}
        <!-- Events List -->
        <div class="space-y-3">
          {#each filteredEvents() as event, index}
            <button
              onclick={() => toggleEventSelection(event)}
              class="w-full text-left bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer hover:scale-[1.02] {isEventSelected(event) ? 'border-blue-400 bg-blue-400/10' : ''}"
              in:fly={{ y: 20, duration: 300, delay: index * 30 }}
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
                <div class="ml-4 flex-shrink-0">
                  {#if isEventSelected(event)}
                    <div class="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center" in:scale={{ duration: 200 }}>
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
        
        {#if filteredEvents().length === 0}
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

    <!-- Footer with action buttons -->
    {#if selectedEvents.length > 0}
      <div class="bg-gray-800/50 border-t border-gray-700 p-4" in:fade={{ duration: 200 }}>
        <div class="flex items-center justify-between">
          <span class="text-gray-400 font-mono text-sm">
            {selectedEvents.length} {selectedEvents.length === 1 ? (currentLanguage === 'es' ? 'evento seleccionado' : 'event selected') : (currentLanguage === 'es' ? 'eventos seleccionados' : 'events selected')}
          </span>
          
          <div class="flex gap-3">
            <button
              onclick={() => selectedEvents = []}
              class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              {currentLanguage === 'es' ? 'Limpiar' : 'Clear'}
            </button>
            
            <button
              onclick={addSelectedEvents}
              class="px-6 py-2 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-medium rounded-lg hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
            >
              <Plus class="w-4 h-4" />
              {currentLanguage === 'es' ? 'Agregar' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

