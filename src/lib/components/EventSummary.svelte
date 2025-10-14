<!--
  Purpose: Summary screen showing selected events with calendar export options
  Context: Final screen where users can review selected events and export to calendar
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Calendar, Download, Plus, ArrowLeft, Clock, MapPin, Star, Trash2 } from 'lucide-svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import type { ConfurorEvent } from '$lib/confuror/types';
  import { CalendarExporter } from '$lib/confuror/calendar';
  import { languageStore } from '$lib/stores/language';
  import { formatDayWithDate, getDayAbbreviation } from '$lib/utils/dateUtils';

  interface Props {
    selectedEvents: ConfurorEvent[];
    onRemoveEvent: (eventId: string) => void;
    onAddMoreDays: () => void;
    onStartOver: () => void;
    onExportCalendar: (events: ConfurorEvent[]) => void;
  }

  const { selectedEvents, onRemoveEvent, onAddMoreDays, onStartOver, onExportCalendar }: Props = $props();

  let isExporting = $state(false);
  let exportSuccess = $state(false);
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

  const groupEventsByDay = (events: ConfurorEvent[]) => {
    const grouped: Record<string, ConfurorEvent[]> = {};
    events.forEach(event => {
      if (!grouped[event.day]) {
        grouped[event.day] = [];
      }
      grouped[event.day].push(event);
    });
    return grouped;
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

      // Export calendar
      CalendarExporter.downloadCalendar(selectedEvents);
      exportSuccess = true;
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        exportSuccess = false;
      }, 3000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export calendar. Please try again.');
    } finally {
      isExporting = false;
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
              
              <!-- Add event button -->
              <button
                onclick={() => window.location.href = '/add-event'}
                class="rounded-full bg-blue-400/20 p-3 backdrop-blur-sm transition-colors hover:bg-blue-400/30 border border-blue-400/30 hover:scale-110 transition-transform duration-200"
                aria-label="Add event"
              >
                <Plus class="w-6 h-6 text-blue-400" />
              </button>
            </div>

            <div class="space-y-4">
              {#each events as event, eventIndex}
                <div class="bg-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors" in:fade={{ duration: 400, delay: eventIndex * 50 }}>
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="text-xl font-serif text-white mb-2">{event.title}</h3>
                      <p class="text-gray-300 mb-3">{event.description}</p>
                      
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
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8" in:scale={{ duration: 600, delay: 800 }}>
        <button
          onclick={handleExport}
          disabled={isExporting}
          class="px-8 py-4 bg-gradient-to-r from-green-400 to-green-500 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
        >
          {#if isExporting}
            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Exporting...
          {:else}
            <Download class="w-5 h-5" />
            {t.exportToCalendar}
          {/if}
        </button>

        <button
          onclick={onAddMoreDays}
          class="px-8 py-4 bg-blue-400/20 text-blue-400 rounded-lg border border-blue-400/30 hover:bg-blue-400/30 transition-colors flex items-center gap-3"
        >
          <Plus class="w-5 h-5" />
          {t.addMoreDays}
        </button>

        <button
          onclick={onStartOver}
          class="px-8 py-4 bg-gray-400/20 text-gray-400 rounded-lg border border-gray-400/30 hover:bg-gray-400/30 transition-colors flex items-center gap-3"
        >
          <ArrowLeft class="w-5 h-5" />
          {t.startOver}
        </button>
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
