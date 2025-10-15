// Purpose: Type definitions for Confuror event data structure
// Context: Defines the data model for convention events, panels, and calendar integration

export interface ConventionEvent {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  location: string;
  room?: string;
  track?: string; // e.g., "Art", "Fursuit", "Social", "Educational"
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  capacity?: number;
  currentAttendees?: number;
  imageUrl?: string;
  panelist?: string;
  tags: string[];
  day: 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeSlot: string; // e.g., "10:00-11:00", "14:00-15:30"
  isSelected?: boolean;
}

export interface DaySelection {
  day: 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  selected: boolean;
  events: ConventionEvent[];
}

export interface CalendarExport {
  events: ConventionEvent[];
  filename: string;
  icalContent: string;
}

export interface EventFilters {
  days: ('Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
  tracks?: string[];
  difficulty?: string[];
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface SwipeAction {
  type: 'add' | 'reject';
  eventId: string;
  timestamp: number;
}

export interface EventGroup {
  timeSlot: string;
  events: ConventionEvent[];
  currentIndex: number;
}
