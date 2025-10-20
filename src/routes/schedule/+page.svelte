<!--
  Purpose: Timetable view showing events in hourly schedule format with day tabs
  Context: Permanent schedule page accessible from menu, shows events by hour with tabs for different days
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { Calendar, Clock, MapPin, Star, Download, ExternalLink, Trash2, Plus } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import { appState } from '$lib/stores/appState';
  import { languageStore } from '$lib/stores/language';
  import { formatDayWithDate } from '$lib/utils/dateUtils';
  import { CalendarExporter } from '$lib/convention/calendar';
  import { ConventionAPI } from '$lib/convention/api';
  import AddEventOverlay from '$lib/components/AddEventOverlay.svelte';
  import Header from '$lib/components/Header.svelte';
  import { NotificationManager } from '$lib/utils/notifications';
  import type { ConventionEvent } from '$lib/convention/types';
  
  let showOverlay = $state(false);
  let showSearchResults = $state(false);
  let searchQuery = $state('');
  let searchResults: ConventionEvent[] = $state([]);
  let isSearching = $state(false);

  let t = $state(languageStore.translations);
  let currentLanguage = $state(languageStore.currentLanguage);
  let selectedDay = $state<'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>('Thursday');
  let showExportOptions = $state(false);
  let showCalendarInstructions = $state(false);
  let showICSInstructions = $state(false);
  let calendarInstructionsType = $state<'google' | 'apple' | null>(null);

  // Get selected events reactively using subscription
  let selectedEvents = $state(appState.selectedEvents);

  let unsubscribeAppState: (() => void) | undefined;
  let unsubscribeLanguage: (() => void) | undefined;
  let notificationManager: NotificationManager;

  onMount(() => {
    // Initialize notification manager
    notificationManager = NotificationManager.getInstance();
    notificationManager.initialize();

    // Subscribe to app state changes
    unsubscribeAppState = appState.subscribe(() => {
      selectedEvents = appState.selectedEvents;
      // Schedule notifications for newly selected events
      scheduleEventNotifications();
    });

    // Subscribe to language changes
    unsubscribeLanguage = languageStore.subscribe(() => {
      t = languageStore.translations;
      currentLanguage = languageStore.currentLanguage;
    });

    // Schedule notifications for existing events
    scheduleEventNotifications();

    // Set initial day to today or first day with events
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 4 = Thursday, 5 = Friday, 6 = Saturday
    
    if (dayOfWeek === 4) selectedDay = 'Thursday';
    else if (dayOfWeek === 5) selectedDay = 'Friday';
    else if (dayOfWeek === 6) selectedDay = 'Saturday';
    else if (dayOfWeek === 0) selectedDay = 'Sunday';
    else {
      // Find first day with events
      const daysWithEvents = getDaysWithEvents();
      if (daysWithEvents.length > 0) {
        selectedDay = daysWithEvents[0];
      }
    }
  });

  onDestroy(() => {
    if (unsubscribeAppState) {
      unsubscribeAppState();
    }
    if (unsubscribeLanguage) {
      unsubscribeLanguage();
    }
  });

  // Purpose: Schedule notifications for selected events
  // Context: Sets up reminder notifications based on user preferences
  function scheduleEventNotifications() {
    if (!notificationManager || !notificationManager.canNotify()) {
      return;
    }

    selectedEvents.forEach(event => {
      // Parse event start time
      const eventDate = new Date(event.startTime);
      if (eventDate && !isNaN(eventDate.getTime())) {
        notificationManager.scheduleEventReminder(event.title, eventDate);
      }
    });
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getHour = (timeString: string): number => {
    const date = new Date(timeString);
    return date.getHours();
  };

  const getDayName = (day: string) => {
    if (currentLanguage === 'es') {
      const dayMap: Record<string, string> = {
        'Thursday': 'Jueves',
        'Friday': 'Viernes',
        'Saturday': 'Sábado',
        'Sunday': 'Domingo'
      };
      return dayMap[day] || day;
    }
    return day;
  };

  const getDaysWithEvents = (): ('Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] => {
    const days = new Set(selectedEvents.map(e => e.day));
    const orderedDays: ('Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
    return orderedDays.filter(day => days.has(day));
  };

  // Get current time
  const now = new Date();
  const currentHour = now.getHours();

  // Group events by hour for selected day
  const eventsForDay = $derived(
    selectedEvents
      .filter(event => event.day === selectedDay)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  );

  const eventsByHour = $derived(() => {
    const grouped: Record<number, ConventionEvent[]> = {};
    eventsForDay.forEach(event => {
      const hour = getHour(event.startTime);
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      grouped[hour].push(event);
    });
    return grouped;
  });

  // Get all hours that have events
  const hours = $derived(
    Object.keys(eventsByHour()).map(Number).sort((a, b) => a - b)
  );

  // Filter to show only upcoming events
  const upcomingEvents = $derived(
    eventsForDay.filter(event => new Date(event.startTime) >= now)
  );

  const hasEvents = $derived(selectedEvents.length > 0);
  const hasDayEvents = $derived(eventsForDay.length > 0);
  const daysWithEvents = $derived(getDaysWithEvents());

  const handleRemoveEvent = (eventId: string) => {
    appState.removeSelectedEvent(eventId);
  };

  const handleExport = async () => {
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

  const isUpcoming = (eventTime: string) => {
    return new Date(eventTime) >= now;
  };

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showSearchResults = false;
      return;
    }

    isSearching = true;
    try {
      const results = await ConventionAPI.searchEvents(searchQuery);
      searchResults = results;
      showSearchResults = true;
    } catch (error) {
      console.error('Search error:', error);
      searchResults = [];
    } finally {
      isSearching = false;
    }
  };

  const clearSearch = () => {
    searchQuery = '';
    searchResults = [];
    showSearchResults = false;
  };

  const addSearchResultToSchedule = (event: ConventionEvent) => {
    appState.addSelectedEvent({ ...event, isSelected: true });
    // Remove from search results
    searchResults = searchResults.filter(e => e.id !== event.id);
  };

  const isSearchResultSelected = (eventId: string) => {
    return selectedEvents.some(e => e.id === eventId);
  };

  // Automatically press the button for the first day with events
  onMount(() => {
    if (daysWithEvents.length > 0) {
      selectedDay = daysWithEvents[0];
    }
  });
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-black">
  <!-- Header -->
  <Header 
    backLabel={currentLanguage === 'es' ? 'Volver' : 'Back'}
    sticky={true}
    anchored={true}
    overlay={false}
    showLanguageSelector={false}
  >
    {#snippet right()}
      <button
        onclick={() => showExportOptions = !showExportOptions}
        class="flex items-center gap-2 px-4 py-2 bg-gray-800/50 text-gray-400 rounded-lg hover:bg-gray-700/50 transition-colors"
      >
        <Download class="wh-6" />
        <span class="font-mono text-sm hidden sm:inline">{currentLanguage === 'es' ? 'Exportar' : 'Export'}</span>
      </button>

      <button
        onclick={() => showOverlay = true}
        class="p-2 bg-gray-800/50 text-gray-400 hover:text-white rounded-lg transition-colors bg-green-500/20 text-green-400 hover:bg-green-500/30"
        aria-label="Add events"
      >
        <Plus class="wh-6" />
      </button>
    {/snippet}

  </Header>

  <!-- Day Tabs -->
  {#if daysWithEvents.length > 0}
    <div class="sticky top-[80px] z-30 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      <div class="max-w-6xl mx-auto px-6 py-4">
        <div class="flex gap-2 overflow-x-auto pb-2">
          {#each daysWithEvents as day}
            <button
              onclick={() => selectedDay = day}
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

  <!-- Export Options Dropdown with outside click to close -->
  {#if showExportOptions}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
      class="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Export options menu"
      onclick={() => showExportOptions = false}
      onkeydown={(e) => { if (e.key === 'Escape') showExportOptions = false; }}
    >
      <div
        class="fixed right-6 top-20 bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-lg p-2 z-50"
        role="menu"
        tabindex="-1"
        in:scale={{ duration: 200 }}
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => { if (e.key === 'Escape') e.stopPropagation()}}
      >
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
          <ExternalLink class="w-4 h-4" />
          <span class="font-mono text-sm">Google Calendar</span>
        </button>
        <button
          onclick={handleAppleCalendarExport}
          class="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700/50 rounded flex items-center gap-3"
        >
          <ExternalLink class="w-4 h-4" />
          <span class="font-mono text-sm">Apple Calendar</span>
        </button>
      </div>
    </div>
  {/if}

  <!-- Search Results -->
  {#if showSearchResults}
    <div class="max-w-6xl mx-auto px-6 py-8">
      <div class="mb-6">
        <h2 class="text-xl font-serif text-white mb-2">
          {t.searchResults}
        </h2>
        <p class="text-sm text-blue-400 font-mono">
          {searchResults.length} {t.eventsFound} para "{searchQuery}"
        </p>
      </div>

      {#if searchResults.length > 0}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each searchResults as event, index}
            <div 
              class="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-[1.02] {
                isSearchResultSelected(event.id) ? 'border-green-400 bg-green-400/10' : ''
              }"
              in:fly={{ y: 20, duration: 400, delay: index * 50 }}
            >
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h3 class="text-lg font-serif text-white mb-2">{event.title}</h3>
                  
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
                    
                    <div class="flex items-center gap-2 text-purple-400">
                      <Calendar class="w-4 h-4" />
                      <span class="font-mono">{getDayName(event.day)}</span>
                    </div>
                    
                    {#if event.panelist}
                      <div class="flex items-center gap-2 text-yellow-400">
                        <Star class="w-4 h-4" />
                        <span class="font-mono">{event.panelist}</span>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
              
              <!-- Add to Schedule Button -->
              <button
                onclick={() => addSearchResultToSchedule(event)}
                disabled={isSearchResultSelected(event.id)}
                class="w-full px-4 py-2 bg-blue-400/20 text-blue-400 rounded-lg hover:bg-blue-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-green-400/20 disabled:text-green-400"
              >
                {#if isSearchResultSelected(event.id)}
                  {t.alreadyInSchedule}
                {:else}
                  {t.addToSchedule}
                {/if}
              </button>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-12">
          <div class="text-4xl mb-4">🔍</div>
          <p class="text-gray-400">
            {t.noEventsFound}
          </p>
        </div>
      {/if}
    </div>
  {:else if hasEvents}
    {#if hasDayEvents}
      <div class="max-w-6xl mx-auto px-6 py-8">
        <div class="mb-6">
          <h2 class="text-xl font-serif text-gray-300">
            {formatDayWithDate(selectedDay, currentLanguage)}
          </h2>
          {#if upcomingEvents.length > 0}
            <p class="text-sm text-blue-400 font-mono">
              {upcomingEvents.length} {currentLanguage === 'es' ? 'eventos próximos' : 'upcoming events'}
            </p>
          {/if}
        </div>

        <!-- Timeline View -->
        <!--
          Only show hours that have at least one upcoming event.
          We filter the hours array to only include hours where some event for that hour is upcoming.
        -->
        <div class="space-y-8">
          {#each hours.filter(hour => (eventsByHour()[hour] || []).some(event => isUpcoming(event.startTime))) as hour}
            <div class="flex gap-6" in:fade={{ duration: 400, delay: hour * 20 }}>
              <!-- Hour marker -->
              <div class="w-24 flex-shrink-0 pt-2">
                <div class="text-right">
                  <span class="font-mono text-lg {getHour(now.toISOString()) === hour ? 'text-blue-400 font-bold' : 'text-gray-500'}">
                    {formatHour(hour)}
                  </span>
                </div>
              </div>

              <!-- Hour divider -->
              <div class="relative flex-shrink-0">
                <div class="w-px h-full bg-gray-800"></div>
                <div class="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full {
                  getHour(now.toISOString()) === hour ? 'bg-blue-400' : 'bg-gray-700'
                }"></div>
              </div>

              <!-- Events for this hour -->
              <div class="flex-1 space-y-4 pb-4">
                {#each eventsByHour()[hour] || [] as event}
                  {@const upcoming = isUpcoming(event.startTime)}
                  <div 
                    class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] {
                      upcoming ? 'border-blue-400/50' : 'border-gray-700 opacity-60'
                    }"
                    in:fly={{ x: 20, duration: 400 }}
                  >
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1">
                        <h3 class="text-lg font-serif {upcoming ? 'text-white' : 'text-gray-400'} mb-2">
                          {event.title}
                        </h3>
                        
                        <div class="flex flex-wrap items-center gap-4 text-sm">
                          <div class="flex items-center gap-2 {upcoming ? 'text-blue-400' : 'text-gray-500'}">
                            <Clock class="w-4 h-4" />
                            <span class="font-mono font-bold">
                              {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </span>
                          </div>
                          
                          <div class="flex items-center gap-2 {upcoming ? 'text-gray-400' : 'text-gray-600'}">
                            <MapPin class="w-4 h-4" />
                            <span class="font-mono">
                              {event.location}{event.room ? ` - ${event.room}` : ''}
                            </span>
                          </div>
                          
                          {#if event.panelist}
                            <div class="flex items-center gap-2 {upcoming ? 'text-yellow-400' : 'text-gray-600'}">
                              <Star class="w-4 h-4" />
                              <span class="font-mono">{event.panelist}</span>
                            </div>
                          {/if}
                        </div>
                      </div>
                      
                      <button
                        onclick={() => handleRemoveEvent(event.id)}
                        class="p-2 {upcoming ? 'text-red-400' : 'text-red-400/50'} hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                        aria-label="Remove event"
                      >
                        <Trash2 class="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <!-- No events for this day -->
      <div class="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div class="text-center px-6">
          <div class="text-6xl mb-6">📅</div>
          <h2 class="text-2xl font-serif text-white mb-4">
            {currentLanguage === 'es' ? 'No hay eventos este día' : 'No Events This Day'}
          </h2>
          <p class="text-gray-400">
            {currentLanguage === 'es' 
              ? 'Selecciona otro día o agrega más eventos'
              : 'Select another day or add more events'}
          </p>
        </div>
      </div>
    {/if}
  {:else}
    <!-- No Events State -->
    <div class="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div class="text-center px-6">
        <div class="text-6xl mb-6">📅</div>
        <h2 class="text-2xl font-serif text-white mb-4">
          {currentLanguage === 'es' ? 'No hay eventos' : 'No Events Yet'}
        </h2>
        <p class="text-gray-400 mb-8">
          {currentLanguage === 'es' 
            ? 'Comienza a seleccionar eventos para verlos aquí'
            : 'Start selecting events to see them here'}
        </p>
        
        <button
          onclick={() => goto('/events')}
          class="px-8 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
        >
          {currentLanguage === 'es' ? 'Explorar Eventos' : 'Browse Events'}
        </button>
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

