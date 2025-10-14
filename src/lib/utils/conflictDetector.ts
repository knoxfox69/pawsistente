// Purpose: Conflict detection utility for event scheduling
// Context: Detects time conflicts between selected events and current event

import type { ConfurorEvent } from '$lib/confuror/types';

export interface EventConflict {
  event: ConfurorEvent;
  conflictType: 'overlap' | 'exact';
  overlapMinutes?: number;
}

export class ConflictDetector {
  // Check if two events have time conflicts
  static hasTimeConflict(event1: ConfurorEvent, event2: ConfurorEvent): boolean {
    const start1 = new Date(event1.startTime);
    const end1 = new Date(event1.endTime);
    const start2 = new Date(event2.startTime);
    const end2 = new Date(event2.endTime);

    // Check if events overlap
    return start1 < end2 && start2 < end1;
  }

  // Get conflicting events from a list of selected events
  static getConflictingEvents(
    currentEvent: ConfurorEvent, 
    selectedEvents: ConfurorEvent[]
  ): EventConflict[] {
    const conflicts: EventConflict[] = [];

    selectedEvents.forEach(selectedEvent => {
      if (selectedEvent.id === currentEvent.id) return; // Skip self

      if (this.hasTimeConflict(currentEvent, selectedEvent)) {
        const conflictType = this.getConflictType(currentEvent, selectedEvent);
        const overlapMinutes = this.calculateOverlapMinutes(currentEvent, selectedEvent);
        
        conflicts.push({
          event: selectedEvent,
          conflictType,
          overlapMinutes
        });
      }
    });

    return conflicts;
  }

  // Determine the type of conflict
  private static getConflictType(event1: ConfurorEvent, event2: ConfurorEvent): 'overlap' | 'exact' {
    const start1 = new Date(event1.startTime);
    const end1 = new Date(event1.endTime);
    const start2 = new Date(event2.startTime);
    const end2 = new Date(event2.endTime);

    // Check if events have exact same time
    if (start1.getTime() === start2.getTime() && end1.getTime() === end2.getTime()) {
      return 'exact';
    }

    return 'overlap';
  }

  // Calculate overlap in minutes
  private static calculateOverlapMinutes(event1: ConfurorEvent, event2: ConfurorEvent): number {
    const start1 = new Date(event1.startTime);
    const end1 = new Date(event1.endTime);
    const start2 = new Date(event2.startTime);
    const end2 = new Date(event2.endTime);

    const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
    const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

    if (overlapStart >= overlapEnd) return 0;

    return Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60));
  }

  // Check if an event conflicts with any selected events
  static hasAnyConflicts(currentEvent: ConfurorEvent, selectedEvents: ConfurorEvent[]): boolean {
    return selectedEvents.some(selectedEvent => 
      selectedEvent.id !== currentEvent.id && 
      this.hasTimeConflict(currentEvent, selectedEvent)
    );
  }

  // Get conflict summary text
  static getConflictSummary(conflicts: EventConflict[], language: 'es' | 'en' = 'es'): string {
    if (conflicts.length === 0) return '';

    const exactConflicts = conflicts.filter(c => c.conflictType === 'exact');
    const overlapConflicts = conflicts.filter(c => c.conflictType === 'overlap');

    if (language === 'es') {
      if (exactConflicts.length > 0) {
        return `Conflicto exacto con ${exactConflicts.length} evento(s)`;
      } else if (overlapConflicts.length > 0) {
        return `Se superpone con ${overlapConflicts.length} evento(s)`;
      }
    } else {
      if (exactConflicts.length > 0) {
        return `Exact conflict with ${exactConflicts.length} event(s)`;
      } else if (overlapConflicts.length > 0) {
        return `Overlaps with ${overlapConflicts.length} event(s)`;
      }
    }

    return '';
  }
}
