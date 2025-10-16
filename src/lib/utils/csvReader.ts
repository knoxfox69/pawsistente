// Purpose: CSV file reader for event data
// Context: Replaces MongoDB with CSV file reading for event data

import type { ConventionEvent } from '$lib/convention/types';

export interface CSVEvent {
  day: string;
  start_time: string;
  end_time: string;
  location: string;
  title: string;
  hosted_by: string;
  category: string;
  description: string;
}

export class CSVEventReader {
  private static events: ConventionEvent[] = [];
  private static loaded = false;

  // Load events from CSV file
  static async loadEvents(language: 'es' | 'en' = 'es'): Promise<ConventionEvent[]> {
    if (this.loaded && this.events.length > 0) {
      return this.events;
    }

    try {
      // Try to load the appropriate language file, fallback to Spanish
      const csvPath = language === 'es' ? '/schedule_spanish.csv' : '/schedule_english.csv';
      const response = await fetch(csvPath);
      
      if (!response.ok) {
        // Fallback to Spanish if language-specific file doesn't exist
        const fallbackResponse = await fetch('/schedule_spanish.csv');
        if (!fallbackResponse.ok) {
          throw new Error('No CSV file found');
        }
        const csvText = await fallbackResponse.text();
        this.events = this.parseCSV(csvText);
      } else {
        const csvText = await response.text();
        this.events = this.parseCSV(csvText);
      }

      this.loaded = true;
      return this.events;
    } catch (error) {
      console.error('Error loading CSV events:', error);
      // Return empty array if CSV loading fails
      return [];
    }
  }

  // Parse CSV text into ConfurorEvent objects
  private static parseCSV(csvText: string): ConventionEvent[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const events: ConventionEvent[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = this.parseCSVLine(line);
      if (values.length !== headers.length) continue;

      const csvEvent: CSVEvent = {
        day: values[0]?.trim() || '',
        start_time: values[1]?.trim() || '',
        end_time: values[2]?.trim() || '',
        location: values[3]?.trim() || '',
        title: values[4]?.trim() || '',
        hosted_by: values[5]?.trim() || '',
        category: values[6]?.trim() || '',
        description: values[7]?.trim() || ''
      };

      // Skip events with empty titles
      if (!csvEvent.title) continue;

      const event = this.convertToConfurorEvent(csvEvent, i);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  // Parse a single CSV line handling quoted values
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  // Convert CSV event to ConfurorEvent format
  private static convertToConfurorEvent(csvEvent: CSVEvent, index: number): ConventionEvent | null {
    try {
      // Parse day
      const dayMap: Record<string, 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'> = {
        'thursday': 'Thursday',
        'friday': 'Friday',
        'saturday': 'Saturday',
        'sunday': 'Sunday'
      };

      const day = dayMap[csvEvent.day.toLowerCase()];
      if (!day) return null;

      // Parse times and create ISO strings
      const startTime = this.parseTime(csvEvent.start_time, day);
      const endTime = this.parseTime(csvEvent.end_time, day);
      
      if (!startTime || !endTime) return null;

      // Create time slot string
      const timeSlot = `${startTime.format('HH:mm')}-${endTime.format('HH:mm')}`;

      // Generate event ID
      const id = `event_${index}`;

      // Map category to track
      const trackMap: Record<string, string> = {
        'art': 'Art',
        'social': 'Social',
        'educational': 'Educational',
        'fursuit': 'Fursuit',
        'gaming': 'Gaming',
        'music': 'Music',
        'workshop': 'Workshop'
      };

      const track = trackMap[csvEvent.category.toLowerCase()] || 'General';

      return {
        id,
        title: csvEvent.title,
        description: csvEvent.description || "",
        startTime: startTime.toISO(),
        endTime: endTime.toISO(),
        location: csvEvent.location,
        room: csvEvent.location.split(':')[1]?.trim() || undefined,
        track,
        difficulty: 'All Levels',
        capacity: undefined,
        currentAttendees: undefined,
        imageUrl: undefined,
        panelist: csvEvent.hosted_by || undefined,
        tags: [csvEvent.category.toLowerCase(), day.toLowerCase()],
        day,
        timeSlot,
        isSelected: false
      };
    } catch (error) {
      console.error('Error converting CSV event:', error, csvEvent);
      return null;
    }
  }

  // Parse time string to DateTime
  private static parseTime(timeStr: string, day: 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'): any | null {
    try {
      const [hours, minutes] = timeStr.trim().split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes || '0');
      const date = new Date(2025, 9, day === 'Thursday' ? 23 : day === 'Friday' ? 24 : day === 'Saturday' ? 25 : 26, hour, minute);
      return {
        toISO: () => date.toISOString(),
        format: (format: string) => {
          if (format === 'HH:mm') {
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          }
          return date.toISOString();
        }
      };
    } catch (error) {
      console.error('Error parsing time:', timeStr, error);
      return null;
    }
  }

  // Get events for specific days
  static async getEventsForDays(days: string[]): Promise<ConventionEvent[]> {
    const allEvents = await this.loadEvents();
    return allEvents.filter(event => days.includes(event.day));
  }

  // Get all available days
  static async getAvailableDays(): Promise<string[]> {
    const allEvents = await this.loadEvents();
    const days = new Set(allEvents.map(event => event.day));
    return Array.from(days).sort();
  }

  // Search events
  static async searchEvents(query: string, days?: string[]): Promise<ConventionEvent[]> {
    const allEvents = await this.loadEvents();
    let filteredEvents = allEvents;

    if (days && days.length > 0) {
      filteredEvents = filteredEvents.filter(event => days.includes(event.day));
    }

    if (query) {
      const searchQuery = query.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(searchQuery) ||
        event.description.toLowerCase().includes(searchQuery) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchQuery))
      );
    }

    return filteredEvents;
  }

  // Clear cache (useful for testing)
  static clearCache(): void {
    this.events = [];
    this.loaded = false;
  }
}
