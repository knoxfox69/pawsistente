<!--
  Purpose: Summary screen showing selected events with calendar export options
  Context: Final screen where users can review selected events and export to calendar
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Calendar, Download, Plus, ArrowLeft, Clock, MapPin, Star, Trash2, ExternalLink, Check } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { goto } from '$app/navigation';
  import type { ConventionEvent } from '$lib/convention/types';
  import { CalendarExporter } from '$lib/convention/calendar';
  import { languageStore } from '$lib/stores/language';
  import { formatDayWithDate, getDayAbbreviation } from '$lib/utils/dateUtils';

  interface Props {
    selectedEvents: ConventionEvent[];
    onRemoveEvent: (eventId: string) => void;
    onAddMoreDays: () => void;
    onStartOver: () => void;
    onExportCalendar: (events: ConventionEvent[]) => void;
  }

  const { selectedEvents, onRemoveEvent, onAddMoreDays, onStartOver, onExportCalendar }: Props = $props();

  let isExporting = $state(false);
  let exportSuccess = $state(false);
  let showCalendarInstructions = $state(false);
  let showICSInstructions = $state(false);
  let calendarInstructionsType = $state<'google' | 'apple' | null>(null);
  let t = $state(languageStore.translations);
  let currentLanguage = $state(languageStore.currentLanguage);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const groupEventsByDay = (events: ConventionEvent[]) => {
    // Simple grouping by day with chronological sorting
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
    
    // Return days in correct order
    const dayOrder = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
    const orderedGrouped: Record<string, ConventionEvent[]> = {};
    dayOrder.forEach(day => {
      if (grouped[day]) {
        orderedGrouped[day] = grouped[day];
      }
    });
    
    return orderedGrouped;
  };


  const handleExport = async () => {
    isExporting = true;
    try {
      // Validate events before export
      const validation = CalendarExporter.validateEvents(selectedEvents);
      if (!validation.valid) {
        alert('Error: ' + validation.errors.join(', '));
        return;
      }

      // Export calendar with current language
      CalendarExporter.downloadCalendar(selectedEvents, undefined, currentLanguage);
      
      // Show ICS instructions overlay after a short delay
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
    try {
      const validation = CalendarExporter.validateEvents(selectedEvents);
      if (!validation.valid) {
        alert('Error: ' + validation.errors.join(', '));
        return;
      }

      // Show instructions overlay
      calendarInstructionsType = 'google';
      showCalendarInstructions = true;
    } catch (error) {
      console.error('Google Calendar export error:', error);
      alert('Failed to export to Google Calendar. Please try again.');
    }
  };

  const handleAppleCalendarExport = () => {
    try {
      const validation = CalendarExporter.validateEvents(selectedEvents);
      if (!validation.valid) {
        alert('Error: ' + validation.errors.join(', '));
        return;
      }

      // Show instructions overlay
      calendarInstructionsType = 'apple';
      showCalendarInstructions = true;
    } catch (error) {
      console.error('Apple Calendar export error:', error);
      alert('Failed to export to Apple Calendar. Please try again.');
    }
  };

  const closeCalendarInstructions = () => {
    showCalendarInstructions = false;
    calendarInstructionsType = null;
  };

  const closeICSInstructions = () => {
    showICSInstructions = false;
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

  // Language store subscription
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

  let groupedEvents = $derived(groupEventsByDay(selectedEvents));
  let totalEvents = $derived(selectedEvents.length);
  let hasEvents = $derived(totalEvents > 0);
</script>

<div class="h-screen bg-gradient-to-b from-gray-900 to-black overflow-y-auto">
  <div class="max-w-4xl mx-auto p-6">
    <!-- Header -->
    <div class="text-center mb-8" in:fade={{ duration: 800 }}>
      <div class="inline-flex items-center justify-center w-20 h-20 bg-green-400/20 rounded-full mb-6">
        <Calendar class="w-10 h-10 text-green-400" />
      </div>
      <h1 class="text-4xl font-serif text-white mb-4">
        {t.yourSchedule}
      </h1>
      <p class="text-xl text-gray-300 font-serif">
        {totalEvents} {t.eventsSelected}
      </p>
    </div>

    {#if hasEvents}
      <!-- Events by Day -->
      <div class="space-y-8 mb-12">
        {#each Object.entries(groupedEvents) as [day, events], dayIndex}
          <div class="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6" in:scale={{ duration: 600, delay: dayIndex * 100 }}>
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-2xl font-serif text-white">
                  {day === 'Thursday' ? (currentLanguage === 'es' ? 'Jueves' : 'Thursday') : 
                   day === 'Friday' ? (currentLanguage === 'es' ? 'Viernes' : 'Friday') :
                   day === 'Saturday' ? (currentLanguage === 'es' ? 'Sábado' : 'Saturday') :
                   (currentLanguage === 'es' ? 'Domingo' : 'Sunday')}
                </h2>
                <p class="text-lg text-gray-400 font-serif">
                  {formatDayWithDate(day, currentLanguage)}
                </p>
                <p class="text-sm text-gray-500 font-mono mt-1">
                  {events.length} {events.length === 1 ? 'evento' : 'eventos'}
                </p>
              </div>
            </div>

            <!-- Events in chronological order -->
            <div class="space-y-4">
              {#each events as event, eventIndex}
                <div class="bg-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors" in:fade={{ duration: 400, delay: eventIndex * 50 }}>
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="text-xl font-serif text-white mb-2">{event.title}</h3>
                      <p class="text-gray-300 mb-3">{event.description || t.noDescriptionAvailable}</p>
                      
                      <div class="flex flex-wrap items-center gap-4 text-sm text-gray-400">
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
                    </div>
                    
                    <button
                      onclick={() => onRemoveEvent(event.id)}
                      class="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                      aria-label="Remove event"
                    >
                      <Trash2 class="w-5 h-5 transition-transform duration-200 hover:rotate-12" />
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <!-- Action Buttons -->
      <div class="space-y-6 mb-8" in:scale={{ duration: 600, delay: 800 }}>
        <!-- Calendar Export Buttons -->
        <div class="text-center">
          <h3 class="text-lg font-serif text-white mb-4">Export to Calendar</h3>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onclick={handleExport}
              disabled={isExporting}
              class="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {#if isExporting}
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {currentLanguage === 'es' ? 'Exportando...' : 'Exporting...'}
              {:else}
                <Download class="w-4 h-4" />
                {currentLanguage === 'es' ? 'Importar todo de una vez' : 'Import all at once'}
              {/if}
            </button>

            <button
              onclick={handleGoogleCalendarExport}
              class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-3"
            >
              <ExternalLink class="w-4 h-4" />
              Google Calendar
            </button>

            <button
              onclick={handleAppleCalendarExport}
              class="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-gray-500/25 flex items-center gap-3"
            >
              <ExternalLink class="w-4 h-4" />
              Apple Calendar
            </button>
          </div>
        </div>

        <!-- Other Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onclick={onAddMoreDays}
            class="px-6 py-3 bg-blue-400/20 text-blue-400 rounded-lg border border-blue-400/30 hover:bg-blue-400/30 transition-colors flex items-center gap-3"
          >
            <Plus class="w-4 h-4" />
            {t.addMoreDays}
          </button>

          <button
            onclick={onStartOver}
            class="px-6 py-3 bg-gray-400/20 text-gray-400 rounded-lg border border-gray-400/30 hover:bg-gray-400/30 transition-colors flex items-center gap-3"
          >
            <ArrowLeft class="w-4 h-4" />
            {t.startOver}
          </button>
        </div>
      </div>

      <!-- Success Message -->
      {#if exportSuccess}
        <div class="text-center" in:fade={{ duration: 400 }}>
          <div class="inline-flex items-center gap-3 px-6 py-3 bg-green-400/20 text-green-400 rounded-lg border border-green-400/30">
            <Check class="w-5 h-5" />
            <span class="font-mono">Calendar exported successfully!</span>
          </div>
        </div>
      {/if}

    {:else}
      <!-- No Events State -->
      <div class="text-center py-16" in:fade={{ duration: 800 }}>
        <div class="text-6xl mb-6">📅</div>
        <h2 class="text-2xl font-serif text-white mb-4">{t.noEventsSelected}</h2>
        <p class="text-gray-400 mb-8">You haven't selected any events yet. Start browsing to add events to your calendar!</p>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onclick={onAddMoreDays}
            class="px-8 py-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-3"
          >
            <Plus class="w-5 h-5" />
            {t.startBrowsing}
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Calendar Instructions Overlay -->
  {#if showCalendarInstructions}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" in:fade={{ duration: 500 }}>
      <div class="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 text-center max-w-4xl mx-4 max-h-[90vh] overflow-y-auto" in:scale={{ duration: 600, easing: quintOut }}>
        <div class="text-6xl mb-6">
          {calendarInstructionsType === 'google' ? '📅' : '🍎'}
        </div>
        
        <h3 class="text-2xl font-serif text-white mb-6">
          {calendarInstructionsType === 'google' 
            ? (currentLanguage === 'es' ? 'Agregar a Google Calendar' : 'Add to Google Calendar')
            : (currentLanguage === 'es' ? 'Agregar a Apple Calendar' : 'Add to Apple Calendar')
          }
        </h3>

        <div class="text-gray-300 mb-8 text-left">
          <p class="mb-4">
            {currentLanguage === 'es' 
              ? 'Para agregar tus eventos seleccionados a tu calendario, haz clic en cada evento individualmente:'
              : 'To add your selected events to your calendar, click on each event individually:'
            }
          </p>
          
          <div class="space-y-3 max-h-96 overflow-y-auto">
            {#each selectedEvents as event, index}
              <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h4 class="text-lg font-serif text-white mb-1">{event.title}</h4>
                    <div class="text-sm text-gray-400 space-y-1">
                      <p class="font-mono">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </p>
                      <p class="font-mono">
                        {event.location}{event.room ? ` - ${event.room}` : ''}
                      </p>
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
        </div>

        <div class="flex gap-4 justify-center">
          <button
            onclick={closeCalendarInstructions}
            class="px-6 py-3 bg-gray-400/20 text-gray-400 rounded-lg border border-gray-400/30 hover:bg-gray-400/30 transition-colors"
          >
            {currentLanguage === 'es' ? 'Cerrar' : 'Close'}
          </button>
          
          <button
            onclick={() => {
              closeCalendarInstructions();
              handleExport();
            }}
            class="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
          >
            {currentLanguage === 'es' ? 'Importar todo de una vez' : 'Import all at once'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ICS Instructions Overlay -->
  {#if showICSInstructions}
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" in:fade={{ duration: 500 }}>
      <div class="bg-gray-800/95 backdrop-blur-sm rounded-2xl p-8 text-center max-w-2xl mx-4" in:scale={{ duration: 600, easing: quintOut }}>
        <div class="text-6xl mb-6">📥</div>
        
        <h3 class="text-2xl font-serif text-white mb-6">
          {currentLanguage === 'es' ? 'Archivo descargado' : 'File downloaded'}
        </h3>

        <div class="text-gray-300 mb-8 text-left">
          <p class="mb-4">
            {currentLanguage === 'es' 
              ? '¡Perfecto! El archivo ICS se ha descargado. Ahora sigue estos pasos para importar todos tus eventos:'
              : 'Perfect! The ICS file has been downloaded. Now follow these steps to import all your events:'
            }
          </p>
          
          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">1</div>
              <div>
                <p class="text-white font-medium mb-1">
                  {currentLanguage === 'es' ? 'Abre el archivo descargado' : 'Open the downloaded file'}
                </p>
                <p class="text-sm text-gray-400">
                  {currentLanguage === 'es' 
                    ? 'Busca el archivo .ics en tu carpeta de descargas y ábrelo'
                    : 'Find the .ics file in your downloads folder and open it'
                  }
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">2</div>
              <div>
                <p class="text-white font-medium mb-1">
                  {currentLanguage === 'es' ? 'Selecciona Google Calendar' : 'Select Google Calendar'}
                </p>
                <p class="text-sm text-gray-400">
                  {currentLanguage === 'es' 
                    ? 'Cuando se abra, elige Google Calendar como tu aplicación de calendario'
                    : 'When it opens, choose Google Calendar as your calendar application'
                  }
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">3</div>
              <div>
                <p class="text-white font-medium mb-1">
                  {currentLanguage === 'es' ? '¡Listo!' : 'Done!'}
                </p>
                <p class="text-sm text-gray-400">
                  {currentLanguage === 'es' 
                    ? 'Todos tus eventos aparecerán en tu calendario de Google'
                    : 'All your events will appear in your Google Calendar'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-4 justify-center">
          <button
            onclick={closeICSInstructions}
            class="px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25"
          >
            {currentLanguage === 'es' ? 'Entendido' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom animations */
  @keyframes pulse-success {
    0%, 100% {
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
    }
    50% {
      box-shadow: 0 0 30px rgba(34, 197, 94, 0.5);
    }
  }

</style>
