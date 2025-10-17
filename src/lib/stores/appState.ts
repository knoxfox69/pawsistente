// Purpose: Application state management with persistence
// Context: Manages user progress and selected events with localStorage persistence

import type { ConventionEvent } from '$lib/convention/types';

export interface AppState {
  selectedDays: string[];
  selectedEvents: ConventionEvent[];
  rejectedEvents: string[];
  unseenEvents: string[];
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
    unseenEvents: [],
    currentState: 'day-selection',
    lastUpdated: Date.now()
  };

  private _subscribers: Set<() => void> = new Set();

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

  // Subscribe to state changes
  subscribe(callback: () => void): () => void {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  // Notify all subscribers of state changes
  private _notifySubscribers(): void {
    this._subscribers.forEach(callback => callback());
  }

  // Clear all state
  clearState(): void {
    this.state = {
      selectedDays: [],
      selectedEvents: [],
      rejectedEvents: [],
      unseenEvents: [],
      currentState: 'day-selection',
      lastUpdated: Date.now()
    };
    this.saveState();
    this._notifySubscribers();
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

  get unseenEvents(): string[] {
    return this.state.unseenEvents;
  }

  get currentState(): string {
    return this.state.currentState;
  }

  // Setters
  setSelectedDays(days: string[]): void {
    this.state.selectedDays = days;
    this.saveState();
    this._notifySubscribers();
  }

  setSelectedEvents(events: ConventionEvent[]): void {
    this.state.selectedEvents = events;
    this.saveState();
    this._notifySubscribers();
  }

  addSelectedEvent(event: ConventionEvent): void {
    if (!this.state.selectedEvents.some(e => e.id === event.id)) {
      this.state.selectedEvents = [...this.state.selectedEvents, event];
      // Remove from unseen events when selected
      this.removeUnseenEvent(event.id);
      this.saveState();
      this._notifySubscribers();
    }
  }

  removeSelectedEvent(eventId: string): void {
    this.state.selectedEvents = this.state.selectedEvents.filter(e => e.id !== eventId);
    // Move to rejected events when removed from selected
    this.addRejectedEvent(eventId);
    this.saveState();
    this._notifySubscribers();
  }

  addRejectedEvent(eventId: string): void {
    if (!this.state.rejectedEvents.includes(eventId)) {
      this.state.rejectedEvents = [...this.state.rejectedEvents, eventId];
      this.saveState();
      this._notifySubscribers();
    }
  }

  // Unseen events management
  setUnseenEvents(eventIds: string[]): void {
    this.state.unseenEvents = eventIds;
    this.saveState();
    this._notifySubscribers();
  }

  addUnseenEvent(eventId: string): void {
    if (!this.state.unseenEvents.includes(eventId)) {
      this.state.unseenEvents = [...this.state.unseenEvents, eventId];
      this.saveState();
      this._notifySubscribers();
    }
  }

  removeUnseenEvent(eventId: string): void {
    this.state.unseenEvents = this.state.unseenEvents.filter(id => id !== eventId);
    this.saveState();
    this._notifySubscribers();
  }

  // Move all rejected events to unseen (for "see all events again" functionality)
  moveRejectedToUnseen(): void {
    this.state.unseenEvents = [...this.state.rejectedEvents];
    this.saveState();
    this._notifySubscribers();
  }

  setCurrentState(state: 'day-selection' | 'event-browsing' | 'summary'): void {
    this.state.currentState = state;
    this.saveState();
    this._notifySubscribers();
  }

  // Reset navigation state but keep selections
  resetNavigation(): void {
    this.state.currentState = 'day-selection';
    this.saveState();
    this._notifySubscribers();
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
