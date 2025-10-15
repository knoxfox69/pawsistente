// Purpose: Application state management with persistence
// Context: Manages user progress and selected events with localStorage persistence

import type { ConventionEvent } from '$lib/convention/types';

export interface AppState {
  selectedDays: string[];
  selectedEvents: ConventionEvent[];
  rejectedEvents: string[];
  currentGroupIndex: number;
  currentEventIndex: number;
  currentState: 'day-selection' | 'event-browsing' | 'summary';
  lastUpdated: number;
}

const STORAGE_KEY = 'confuror-app-state';
const MAX_STORAGE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

class AppStateManager {
  private state: AppState = {
    selectedDays: [],
    selectedEvents: [],
    rejectedEvents: [],
    currentGroupIndex: 0,
    currentEventIndex: 0,
    currentState: 'day-selection',
    lastUpdated: Date.now()
  };

  constructor() {
    this.loadState();
  }

  // Load state from localStorage
  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored);
        
        // Check if state is not too old
        if (Date.now() - parsedState.lastUpdated < MAX_STORAGE_AGE) {
          this.state = {
            ...this.state,
            ...parsedState,
            lastUpdated: parsedState.lastUpdated
          };
        } else {
          // State is too old, clear it
          this.clearState();
        }
      }
    } catch (error) {
      console.warn('Failed to load app state:', error);
      this.clearState();
    }
  }

  // Save state to localStorage
  private saveState(): void {
    try {
      this.state.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.warn('Failed to save app state:', error);
    }
  }

  // Clear all state
  clearState(): void {
    this.state = {
      selectedDays: [],
      selectedEvents: [],
      rejectedEvents: [],
      currentGroupIndex: 0,
      currentEventIndex: 0,
      currentState: 'day-selection',
      lastUpdated: Date.now()
    };
    this.saveState();
  }

  // Getters
  get selectedDays(): string[] {
    return this.state.selectedDays;
  }

  get selectedEvents(): ConventionEvent[] {
    return this.state.selectedEvents;
  }

  get rejectedEvents(): string[] {
    return this.state.rejectedEvents;
  }

  get currentGroupIndex(): number {
    return this.state.currentGroupIndex;
  }

  get currentEventIndex(): number {
    return this.state.currentEventIndex;
  }

  get currentState(): string {
    return this.state.currentState;
  }

  // Setters
  setSelectedDays(days: string[]): void {
    this.state.selectedDays = days;
    this.saveState();
  }

  setSelectedEvents(events: ConventionEvent[]): void {
    this.state.selectedEvents = events;
    this.saveState();
  }

  addSelectedEvent(event: ConventionEvent): void {
    if (!this.state.selectedEvents.some(e => e.id === event.id)) {
      this.state.selectedEvents = [...this.state.selectedEvents, event];
      this.saveState();
    }
  }

  removeSelectedEvent(eventId: string): void {
    this.state.selectedEvents = this.state.selectedEvents.filter(e => e.id !== eventId);
    this.saveState();
  }

  addRejectedEvent(eventId: string): void {
    if (!this.state.rejectedEvents.includes(eventId)) {
      this.state.rejectedEvents = [...this.state.rejectedEvents, eventId];
      this.saveState();
    }
  }

  setCurrentGroupIndex(index: number): void {
    this.state.currentGroupIndex = index;
    this.saveState();
  }

  setCurrentEventIndex(index: number): void {
    this.state.currentEventIndex = index;
    this.saveState();
  }

  setCurrentState(state: 'day-selection' | 'event-browsing' | 'summary'): void {
    this.state.currentState = state;
    this.saveState();
  }

  // Reset navigation state but keep selections
  resetNavigation(): void {
    this.state.currentGroupIndex = 0;
    this.state.currentEventIndex = 0;
    this.state.currentState = 'day-selection';
    this.saveState();
  }

  // Check if user has any progress
  hasProgress(): boolean {
    return this.state.selectedDays.length > 0 || 
           this.state.selectedEvents.length > 0 || 
           this.state.rejectedEvents.length > 0;
  }

  // Get progress summary
  getProgressSummary(): { days: number; selected: number; rejected: number } {
    return {
      days: this.state.selectedDays.length,
      selected: this.state.selectedEvents.length,
      rejected: this.state.rejectedEvents.length
    };
  }
}

// Export singleton instance
export const appState = new AppStateManager();
