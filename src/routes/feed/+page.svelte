<!--
  Purpose: Event feed page showing all available events with day filtering and selection functionality
  Context: Main page for browsing and selecting events, replaces the summary screen functionality
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { Calendar, Clock, MapPin, Star, ArrowLeft, Plus, Check, Filter, Download } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { appState } from '$lib/stores/appState';
  import { languageStore } from '$lib/stores/language';
  import { ConfurorAPI } from '$lib/convention/api';
  import { CalendarExporter } from '$lib/convention/calendar';
  import AddEventOverlay from '$lib/components/AddEventOverlay.svelte';
  import Header from '$lib/components/Header.svelte';
  import type { ConventionEvent } from '$lib/convention/types';
  
  let showOverlay = $state(false);
  let showExportOptions = $state(false);
  let showCalendarInstructions = $state(false);
  let showICSInstructions = $state(false);
  let calendarInstructionsType = $state<'google' | 'apple' | null>(null);
  let isExporting = $state(false);

  let t = $state(languageStore.translations);
  let currentLanguage = $state(languageStore.currentLanguage);

  // State for events and filtering
  let allEvents: ConventionEvent[] = $state([]);
  let filteredEvents: ConventionEvent[] = $state([]);
  let selectedDay = $state<'All' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('All');
  let isLoading = $state(false);
  let error: string | null = $state(null);

  // Get selected events reactively
  let selectedEvents = $derived(appState.selectedEvents);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getDayName = (day: string) => {
    if (currentLanguage === 'es') {
      const dayMap: Record<string, string> = {
        'Thursday': 'Jueves',
        'Friday': 'Viernes',
        'Saturday': 'Sábado',
        'Sunday': 'Domingo',
        'All': 'Todos'
      };
      return dayMap[day] || day;
    }
    return day;
  };

  const getAvailableDays = () => {
    const days = new Set(allEvents.map(e => e.day));
    const orderedDays: ('All' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = ['All', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return orderedDays.filter(day => day === 'All' || days.has(day as 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'));
  };

  const loadAllEvents = async () => {
    isLoading = true;
    error = null;
    
    try {
      const days = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
      const events = await ConfurorAPI.getEventsForDays(days);
      allEvents = events;
      filterEvents();
    } catch (err) {
      error = 'Failed to load events. Please try again.';
      console.error('Error loading events:', err);
    } finally {
      isLoading = false;
    }
  };

  const filterEvents = () => {
    if (selectedDay === 'All') {
      filteredEvents = [...allEvents];
    } else {
      filteredEvents = allEvents.filter(event => event.day === selectedDay);
    }
    
    // Sort events by start time
    filteredEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const handleDayFilter = (day: 'All' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday') => {
    selectedDay = day;
    filterEvents();
  };

  const handleEventSelect = (event: ConventionEvent) => {
    const isAlreadySelected = selectedEvents.some(e => e.id === event.id);
    
    if (isAlreadySelected) {
      appState.removeSelectedEvent(event.id);
    } else {
      appState.addSelectedEvent({ ...event, isSelected: true });
    }
  };

  const isEventSelected = (eventId: string) => {
    return selectedEvents.some(e => e.id === eventId);
  };

  const handleExport = async () => {
    isExporting = true;
    try {
      const validation = CalendarExporter.validateEvents(selectedEvents);
      if (!validation.valid) {
        alert('Error: ' + validation.errors.join(', '));
        return;
      }

      CalendarExporter.downloadCalendar(selectedEvents, undefined, currentLanguage);
      
      setTimeout(() => {
        showICSInstructions = true;
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export calendar. Please try again.');
    } finally {
      isExporting = false;
    }
  };

  const handleGoogleCalendarExport = () => {
    calendarInstructionsType = 'google';
    showCalendarInstructions = true;
  };

  const handleAppleCalendarExport = () => {
    calendarInstructionsType = 'apple';
    showCalendarInstructions = true;
  };

  const openSingleEvent = (event: ConventionEvent) => {
    if (calendarInstructionsType === 'google') {
      const url = CalendarExporter.generateSingleGoogleCalendarUrl(event);
      window.open(url, '_blank');
    } else if (calendarInstructionsType === 'apple') {
      const url = CalendarExporter.generateSingleAppleCalendarUrl(event);
      window.open(url, '_blank');
    }
  };

  const groupEventsByDay = (events: ConventionEvent[]) => {
    const grouped: Record<string, ConventionEvent[]> = {};
    
    events.forEach(event => {
      if (!grouped[event.day]) {
        grouped[event.day] = [];
      }
      grouped[event.day].push(event);
    });

    // Sort events within each day by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });
    
    return grouped;
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

  // Reactive updates
  $effect(() => {
    filterEvents();
  });

  const availableDays = $derived(getAvailableDays());
  const eventsByDay = $derived(groupEventsByDay(filteredEvents));
  const hasEvents = $derived(filteredEvents.length > 0);
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-black">
  <!-- Header -->
  <Header 
    backHref="/"
    backLabel={currentLanguage === 'es' ? 'Volver' : 'Back'}
    sticky={true}
    anchored={true}
    overlay={false}
    title={currentLanguage === 'es' ? 'Explorar Eventos' : 'Explore Events'}
    subtitle="{selectedEvents.length} {currentLanguage === 'es' ? 'eventos seleccionados' : 'events selected'}"
  >
    {#snippet left()}
      <button
        onclick={() => showOverlay = true}
        class="p-2 bg-gray-800/50 text-gray-400 hover:text-white rounded-lg transition-colors"
        aria-label="Add events"
      >
        <Plus class="w-5 h-5" />
      </button>
    {/snippet}

    {#snippet right()}
      <button
        onclick={() => showExportOptions = !showExportOptions}
        class="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
      >
        <Download class="w-4 h-4" />
        <span class="font-mono text-sm hidden sm:inline">{currentLanguage === 'es' ? 'Exportar' : 'Export'}</span>
      </button>
    {/snippet}
  </Header>

  <!-- Day Filter Tabs -->
  {#if availableDays.length > 1}
    <div class="sticky top-[80px] z-30 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div class="max-w-6xl mx-auto px-6 py-4">
        <div class="flex gap-2 overflow-x-auto pb-2">
          {#each availableDays as day}
            <button
              onclick={() => handleDayFilter(day as any)}
              class="px-6 py-3 rounded-lg font-serif transition-all duration-200 whitespace-nowrap {
                selectedDay === day 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
              }"
            >
              {getDayName(day)}
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Export Options Dropdown -->
  {#if showExportOptions}
    <div class="fixed right-6 top-20 bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-lg p-2 z-50" in:scale={{ duration: 200 }}>
      <button
        onclick={handleExport}
        class="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 rounded flex items-center gap-3"
      >
        <Download class="w-4 h-4" />
        <span class="font-mono text-sm">{currentLanguage === 'es' ? 'Importar todo (.ics)' : 'Import all (.ics)'}</span>
      </button>
      <button
        onclick={handleGoogleCalendarExport}
        class="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 rounded flex items-center gap-3"
      >
        <Calendar class="w-4 h-4" />
        <span class="font-mono text-sm">Google Calendar</span>
      </button>
      <button
        onclick={handleAppleCalendarExport}
        class="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 rounded flex items-center gap-3"
      >
        <Calendar class="w-4 h-4" />
        <span class="font-mono text-sm">Apple Calendar</span>
      </button>
    </div>
  {/if}

  {#if isLoading}
    <div class="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div class="font-mono text-white text-lg">{t.loadingEvents}</div>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div class="text-center">
        <div class="text-red-400 text-xl mb-4">⚠️</div>
        <div class="font-mono text-white text-lg mb-4">{error}</div>
        <button
          onclick={loadAllEvents}
          class="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition-transform"
        >
          {currentLanguage === 'es' ? 'Intentar de Nuevo' : 'Try Again'}
        </button>
      </div>
    </div>
  {:else if hasEvents}
    <div class="max-w-6xl mx-auto px-6 py-8">
      {#if selectedDay === 'All'}
        <!-- Show events grouped by day when "All" is selected -->
        {#each Object.entries(eventsByDay) as [day, events], dayIndex}
          <div class="mb-12" in:fly={{ y: 20, duration: 400, delay: dayIndex * 100 }}>
            <!-- Day Header -->
            <div class="flex items-center gap-3 mb-6 sticky top-20 z-30 bg-gray-900/80 backdrop-blur-sm py-2">
              <Calendar class="w-6 h-6 text-blue-400" />
              <h2 class="text-2xl font-serif text-white">
                {getDayName(day)}
              </h2>
              <span class="px-3 py-1 bg-blue-400/20 text-blue-400 rounded-full text-sm font-mono">
                {events.length} {events.length === 1 ? 'evento' : 'eventos'}
              </span>
            </div>

            <!-- Events for this day -->
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {#each events as event, eventIndex}
            <button 
              class="w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-[1.02] text-left {
                isEventSelected(event.id) ? 'border-green-400 bg-green-400/10' : ''
              }"
              onclick={() => handleEventSelect(event)}
              in:fly={{ y: 20, duration: 400, delay: eventIndex * 50 }}
            >
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                      <h3 class="text-lg font-serif text-white mb-2">{event.title}</h3>
                      
                      {#if event.description}
                        <p class="text-gray-300 text-sm mb-3 line-clamp-2">{event.description}</p>
                      {/if}

                      <div class="flex flex-wrap items-center gap-3 text-sm">
                        <div class="flex items-center gap-2 text-blue-400">
                          <Clock class="w-4 h-4" />
                          <span class="font-mono font-bold">
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </span>
                        </div>
                        
                        <div class="flex items-center gap-2 text-gray-400">
                          <MapPin class="w-4 h-4" />
                          <span class="font-mono">
                            {event.location}{event.room ? ` - ${event.room}` : ''}
                          </span>
                        </div>
                        
                        {#if event.panelist}
                          <div class="flex items-center gap-2 text-yellow-400">
                            <Star class="w-4 h-4" />
                            <span class="font-mono">{event.panelist}</span>
                          </div>
                        {/if}
                      </div>
                    </div>
                    
                    <!-- Selection indicator -->
                    <div class="ml-4 flex-shrink-0">
                      {#if isEventSelected(event.id)}
                        <div class="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                          <Check class="w-5 h-5 text-white" />
                        </div>
                      {:else}
                        <div class="w-8 h-8 border-2 border-gray-600 rounded-full"></div>
                      {/if}
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      {:else}
        <!-- Show events for selected day -->
        <div class="mb-6">
          <h2 class="text-xl font-serif text-gray-300 mb-2">
            {getDayName(selectedDay)}
          </h2>
          <p class="text-sm text-blue-400 font-mono">
            {filteredEvents.length} {currentLanguage === 'es' ? 'eventos disponibles' : 'events available'}
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each filteredEvents as event, index}
            <button 
              class="w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-[1.02] text-left {
                isEventSelected(event.id) ? 'border-green-400 bg-green-400/10' : ''
              }"
              onclick={() => handleEventSelect(event)}
              in:fly={{ y: 20, duration: 400, delay: index * 50 }}
            >
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h3 class="text-lg font-serif text-white mb-2">{event.title}</h3>
                  
                  {#if event.description}
                    <p class="text-gray-300 text-sm mb-3 line-clamp-2">{event.description}</p>
                  {/if}

                  <div class="flex flex-wrap items-center gap-3 text-sm">
                    <div class="flex items-center gap-2 text-blue-400">
                      <Clock class="w-4 h-4" />
                      <span class="font-mono font-bold">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </span>
                    </div>
                    
                    <div class="flex items-center gap-2 text-gray-400">
                      <MapPin class="w-4 h-4" />
                      <span class="font-mono">
                        {event.location}{event.room ? ` - ${event.room}` : ''}
                      </span>
                    </div>
                    
                    {#if event.panelist}
                      <div class="flex items-center gap-2 text-yellow-400">
                        <Star class="w-4 h-4" />
                        <span class="font-mono">{event.panelist}</span>
                      </div>
                    {/if}
                  </div>
                </div>
                
                <!-- Selection indicator -->
                <div class="ml-4 flex-shrink-0">
                  {#if isEventSelected(event.id)}
                    <div class="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                      <Check class="w-5 h-5 text-white" />
                    </div>
                  {:else}
                    <div class="w-8 h-8 border-2 border-gray-600 rounded-full"></div>
                  {/if}
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
    </div>
  {:else}
    <!-- No Events State -->
    <div class="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div class="text-center px-6">
        <div class="text-6xl mb-6">📅</div>
        <h2 class="text-2xl font-serif text-white mb-4">
          {currentLanguage === 'es' ? 'No hay eventos' : 'No Events Found'}
        </h2>
        <p class="text-gray-400">
          {currentLanguage === 'es' 
            ? 'No se encontraron eventos para el día seleccionado'
            : 'No events found for the selected day'}
        </p>
      </div>
    </div>
  {/if}

  <!-- Calendar Instructions Overlay (Google/Apple) -->
  {#if showCalendarInstructions}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Calendar instructions overlay">
      <div class="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" in:scale={{ duration: 400 }}>
        <h3 class="text-2xl font-serif text-white mb-6 text-center">
          {calendarInstructionsType === 'google' 
            ? (currentLanguage === 'es' ? 'Agregar a Google Calendar' : 'Add to Google Calendar')
            : (currentLanguage === 'es' ? 'Agregar a Apple Calendar' : 'Add to Apple Calendar')
          }
        </h3>

        <p class="text-gray-300 mb-6">
          {currentLanguage === 'es' 
            ? 'Haz clic en cada evento para agregarlo a tu calendario:'
            : 'Click on each event to add it to your calendar:'}
        </p>

        <div class="space-y-3 max-h-96 overflow-y-auto">
          {#each selectedEvents as event}
            <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <h4 class="text-lg font-serif text-white mb-1">{event.title}</h4>
                  <div class="text-sm text-gray-400">
                    <p class="font-mono">{getDayName(event.day)} - {formatTime(event.startTime)}</p>
                  </div>
                </div>
                <button
                  onclick={() => openSingleEvent(event)}
                  class="ml-4 px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium"
                >
                  {currentLanguage === 'es' ? 'Agregar' : 'Add'}
                </button>
              </div>
            </div>
          {/each}
        </div>

        <button
          onclick={() => showCalendarInstructions = false}
          class="mt-6 w-full px-6 py-3 bg-gray-600/50 text-gray-300 rounded-lg hover:bg-gray-600/70 transition-colors"
        >
          {currentLanguage === 'es' ? 'Cerrar' : 'Close'}
        </button>
      </div>
    </div>
  {/if}

  <!-- ICS Instructions Overlay -->
  {#if showICSInstructions}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Download instructions overlay">
      <div class="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 text-center max-w-2xl mx-4" in:scale={{ duration: 400 }}>
        <div class="text-6xl mb-6">📥</div>
        
        <h3 class="text-2xl font-serif text-white mb-6">
          {currentLanguage === 'es' ? 'Archivo descargado' : 'File Downloaded'}
        </h3>

        <p class="text-gray-300 mb-8 text-left">
          {currentLanguage === 'es' 
            ? 'El archivo .ics se ha descargado. Ábrelo para importar todos tus eventos a tu calendario.'
            : 'The .ics file has been downloaded. Open it to import all your events to your calendar.'}
        </p>

        <button
          onclick={() => showICSInstructions = false}
          class="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105"
        >
          {currentLanguage === 'es' ? 'Entendido' : 'Got it'}
        </button>
      </div>
    </div>
  {/if}

  <!-- Add Event Overlay -->
  {#if showOverlay}
    <AddEventOverlay onClose={() => showOverlay = false} />
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>