// Purpose: Calendar export functionality for iCal format
// Context: Generates iCalendar (.ics) files for Google Calendar and Apple Calendar integration

import type { ConfurorEvent, CalendarExport } from './types';

export class CalendarExporter {
  // Generate iCal content from selected events
  static generateICalContent(events: ConfurorEvent[]): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Confuror//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Confuror 2024 - Selected Events',
      'X-WR-CALDESC:Events selected for Confuror 2024',
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
  static downloadCalendar(events: ConfurorEvent[], filename?: string): void {
    const icalContent = this.generateICalContent(events);
    const defaultFilename = `confuror-2024-events-${new Date().toISOString().split('T')[0]}.ics`;
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
  static createCalendarExport(events: ConfurorEvent[]): CalendarExport {
    const filename = `confuror-2024-events-${new Date().toISOString().split('T')[0]}.ics`;
    const icalContent = this.generateICalContent(events);
    
    return {
      events,
      filename,
      icalContent
    };
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
