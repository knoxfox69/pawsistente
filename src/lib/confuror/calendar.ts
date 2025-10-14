// Purpose: Calendar export functionality for iCal format
// Context: Generates iCalendar (.ics) files for Google Calendar and Apple Calendar integration

import type { ConfurorEvent, CalendarExport } from './types';

export class CalendarExporter {
  // Generate iCal content from selected events
  static generateICalContent(events: ConfurorEvent[], language: string = 'en'): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    // Get the current year from the first event's date
    const currentYear = events.length > 0 ? new Date(events[0].startTime).getFullYear() : new Date().getFullYear();
    
    // Language-specific calendar names
    const calendarName = language === 'es' 
      ? `Confuror ${currentYear} - Eventos Seleccionados`
      : `Confuror ${currentYear} - Selected Events`;
    
    const calendarDesc = language === 'es'
      ? `Eventos seleccionados para Confuror ${currentYear}`
      : `Events selected for Confuror ${currentYear}`;
    
    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Confuror//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${calendarName}`,
      `X-WR-CALDESC:${calendarDesc}`,
      'X-WR-TIMEZONE:America/Mexico_City'
    ].join('\r\n') + '\r\n';

    events.forEach(event => {
      const startDate = this.formatDateForICal(event.startTime);
      const endDate = this.formatDateForICal(event.endTime);
      const uid = `confuror-${event.id}@confuror.mx`;
      const summary = event.title;
      const description = this.escapeText(event.description);
      const location = this.escapeText(`${event.location}${event.room ? ` - ${event.room}` : ''}`);
      
      ical += [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        `STATUS:CONFIRMED`,
        `TRANSP:OPAQUE`,
        `CATEGORIES:${event.track || 'General'}`,
        `X-MICROSOFT-CDO-BUSYSTATUS:BUSY`,
        'END:VEVENT'
      ].join('\r\n') + '\r\n';
    });

    ical += 'END:VCALENDAR\r\n';
    return ical;
  }

  // Format date for iCal (YYYYMMDDTHHMMSSZ)
  private static formatDateForICal(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  // Escape text for iCal format
  private static escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  // Create and download iCal file
  static downloadCalendar(events: ConfurorEvent[], filename?: string, language: string = 'en'): void {
    const icalContent = this.generateICalContent(events, language);
    const currentYear = events.length > 0 ? new Date(events[0].startTime).getFullYear() : new Date().getFullYear();
    const defaultFilename = `confuror-${currentYear}-events-${new Date().toISOString().split('T')[0]}.ics`;
    const finalFilename = filename || defaultFilename;

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generate calendar export object
  static createCalendarExport(events: ConfurorEvent[], language: string = 'en'): CalendarExport {
    const currentYear = events.length > 0 ? new Date(events[0].startTime).getFullYear() : new Date().getFullYear();
    const filename = `confuror-${currentYear}-events-${new Date().toISOString().split('T')[0]}.ics`;
    const icalContent = this.generateICalContent(events, language);
    
    return {
      events,
      filename,
      icalContent
    };
  }

  // Generate Google Calendar URL - shows instructions overlay
  static generateGoogleCalendarUrl(events: ConfurorEvent[]): ConfurorEvent[] {
    // This will be handled by the UI component to show instructions
    // We'll return the events data for the overlay
    return events;
  }

  // Generate Apple Calendar URL - shows instructions overlay  
  static generateAppleCalendarUrl(events: ConfurorEvent[]): ConfurorEvent[] {
    // This will be handled by the UI component to show instructions
    // We'll return the events data for the overlay
    return events;
  }

  // Generate individual Google Calendar URL for a single event
  static generateSingleGoogleCalendarUrl(event: ConfurorEvent): string {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams();
    params.set('text', event.title);
    params.set('dates', `${this.formatDateForGoogle(event.startTime)}/${this.formatDateForGoogle(event.endTime)}`);
    params.set('details', event.description);
    params.set('location', `${event.location}${event.room ? ` - ${event.room}` : ''}`);
    return `${baseUrl}&${params.toString()}`;
  }

  // Generate individual Apple Calendar URL for a single event
  static generateSingleAppleCalendarUrl(event: ConfurorEvent): string {
    const baseUrl = 'webcal://calendar.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams();
    params.set('text', event.title);
    params.set('dates', `${this.formatDateForGoogle(event.startTime)}/${this.formatDateForGoogle(event.endTime)}`);
    params.set('details', event.description);
    params.set('location', `${event.location}${event.room ? ` - ${event.room}` : ''}`);
    return `${baseUrl}&${params.toString()}`;
  }

  // Format date for Google Calendar (YYYYMMDDTHHMMSSZ)
  private static formatDateForGoogle(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  // Validate events before export
  static validateEvents(events: ConfurorEvent[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (events.length === 0) {
      errors.push('No events selected for export');
    }

    events.forEach((event, index) => {
      if (!event.title) {
        errors.push(`Event ${index + 1}: Missing title`);
      }
      if (!event.startTime) {
        errors.push(`Event ${index + 1}: Missing start time`);
      }
      if (!event.endTime) {
        errors.push(`Event ${index + 1}: Missing end time`);
      }
      
      // Validate date format
      try {
        new Date(event.startTime);
        new Date(event.endTime);
      } catch {
        errors.push(`Event ${index + 1}: Invalid date format`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}