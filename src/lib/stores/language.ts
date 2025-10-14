// Purpose: Language store for Spanish/English switching
// Context: Manages application language state and translations

export type Language = 'es' | 'en';

export interface Translations {
  // Landing page
  appTitle: string;
  appSubtitle: string;
  browseEvents: string;
  viewGitHubProjects: string;
  
  // Day selection
  chooseDays: string;
  selectConventionDays: string;
  continueToEvents: string;
  selectOneDay: string;
  selectAll: string;
  clearAll: string;
  selectedDays: string;
  
  // Event browsing
  loadingEvents: string;
  noMoreEvents: string;
  viewSelectedEvents: string;
  eventProgress: string;
  selected: string;
  skipped: string;
  eventOf: string;
  of: string;
  
  // Event card
  addToCalendar: string;
  skipEvent: string;
  swipeInstructions: string;
  level: string;
  attendees: string;
  hostedBy: string;
  
  // Summary
  yourSchedule: string;
  eventsSelected: string;
  exportToCalendar: string;
  addMoreDays: string;
  startOver: string;
  noEventsSelected: string;
  startBrowsing: string;
  calendarExported: string;
  
  // Settings
  settings: string;
  language: string;
  about: string;
  version: string;
  projectDescription: string;
  madeFor: string;
  
  // Days
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

const translations: Record<Language, Translations> = {
  es: {
    appTitle: '🐾 Pawsistente',
    appSubtitle: 'Confuror Calendar - Planifica tu horario perfecto',
    browseEvents: 'Explorar Eventos',
    viewGitHubProjects: 'Ver Proyectos GitHub',
    
    chooseDays: 'Elige Tus Días',
    selectConventionDays: 'Selecciona qué días de Confuror 2024 asistirás',
    continueToEvents: 'Continuar a Eventos',
    selectOneDay: 'Porfavor selecciona al menos un día para continuar',
    selectAll: 'Seleccionar Todo',
    clearAll: 'Limpiar Todo',
    selectedDays: 'Días seleccionados:',
    
    loadingEvents: 'Cargando eventos...',
    noMoreEvents: '¡Todo Listo!',
    viewSelectedEvents: 'Ver Eventos Seleccionados',
    eventProgress: 'Progreso del evento',
    selected: 'Seleccionados',
    skipped: 'Omitidos',
    eventOf: 'Evento',
    of: 'de',
    
    addToCalendar: 'Agregar al Calendario',
    skipEvent: 'Omitir Evento',
    swipeInstructions: 'Desliza izquierda para omitir • Desliza derecha para agregar',
    level: 'Nivel',
    attendees: 'asistentes',
    hostedBy: 'Presentado por',
    
    yourSchedule: 'Tu Horario de Confuror',
    eventsSelected: 'eventos seleccionados',
    exportToCalendar: 'Exportar al Calendario',
    addMoreDays: 'Agregar Más Días',
    startOver: 'Empezar de Nuevo',
    noEventsSelected: 'No hay eventos seleccionados',
    startBrowsing: 'Explorar Eventos',
    calendarExported: '¡Calendario exportado exitosamente!',
    
    settings: 'Configuración',
    language: 'Idioma',
    about: 'Acerca de',
    version: 'Versión',
    projectDescription: 'Una aplicación estilo TikTok para que los furries mexicanos planifiquen su horario de Confuror 2025. Desliza, selecciona y sincroniza con tu calendario favorito.',
    madeFor: 'Hecho con ❤️ para la comunidad furry mexicana • Contacto: @knoxfox69',
    
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  },
  en: {
    appTitle: '🐾 Pawsistente',
    appSubtitle: 'Confuror Calendar - Plan your perfect schedule',
    browseEvents: 'Browse Events',
    viewGitHubProjects: 'View GitHub Projects',
    
    chooseDays: 'Choose Your Days',
    selectConventionDays: 'Select which days of Confuror 2024 you\'ll be attending',
    continueToEvents: 'Continue to Events',
    selectOneDay: 'Please select at least one day to continue',
    selectAll: 'Select All',
    clearAll: 'Clear All',
    selectedDays: 'Selected days:',
    
    loadingEvents: 'Loading events...',
    noMoreEvents: 'All Done!',
    viewSelectedEvents: 'View Selected Events',
    eventProgress: 'Event progress',
    selected: 'Selected',
    skipped: 'Skipped',
    eventOf: 'Event',
    of: 'of',
    
    addToCalendar: 'Add to Calendar',
    skipEvent: 'Skip Event',
    swipeInstructions: 'Swipe left to skip • Swipe right to add',
    level: 'Level',
    attendees: 'attendees',
    hostedBy: 'Hosted by',
    
    yourSchedule: 'Your Confuror Schedule',
    eventsSelected: 'events selected',
    exportToCalendar: 'Export to Calendar',
    addMoreDays: 'Add More Days',
    startOver: 'Start Over',
    noEventsSelected: 'No Events Selected',
    startBrowsing: 'Browse Events',
    calendarExported: 'Calendar exported successfully!',
    
    settings: 'Settings',
    language: 'Language',
    about: 'About',
    version: 'Version',
    projectDescription: 'A TikTok-style app for Mexican furries to plan their Confuror 2025 schedule. Swipe, select, and sync with your favorite calendar app.',
    madeFor: 'Built with ❤️ for the Mexican furry community :3',
    
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  }
};

class LanguageStore {
  private _currentLanguage: Language = 'es'; // Default to Spanish
  private _subscribers: Set<() => void> = new Set();
  
  get currentLanguage(): Language {
    return this._currentLanguage;
  }
  
  get translations(): Translations {
    return translations[this._currentLanguage];
  }
  
  setLanguage(language: Language): void {
    this._currentLanguage = language;
    localStorage.setItem('confuror-language', language);
    this._notifySubscribers();
  }
  
  loadFromStorage(): void {
    const stored = localStorage.getItem('confuror-language') as Language;
    if (stored && (stored === 'es' || stored === 'en')) {
      this._currentLanguage = stored;
      this._notifySubscribers();
    }
  }
  
  subscribe(callback: () => void): () => void {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }
  
  private _notifySubscribers(): void {
    this._subscribers.forEach(callback => callback());
  }
}

export const languageStore = new LanguageStore();
