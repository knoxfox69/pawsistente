// Purpose: API functions for fetching Confuror event data
// Context: Handles data fetching from CSV files instead of MongoDB

import type { ConventionEvent, EventFilters } from './types';
import { CSVEventReader } from '$lib/utils/csvReader';

export class ConventionAPI {
  // Fetch all events for selected days
  static async getEventsForDays(days: string[]): Promise<ConventionEvent[]> {
    try {
      return await CSVEventReader.getEventsForDays(days);
    } catch (error) {
      console.warn('CSV loading failed, falling back to mock data:', error);
      // Fallback to mock data if CSV loading fails
      return mockEvents.filter(event => days.includes(event.day));
    }
  }

  // Fetch events with filters
  static async getFilteredEvents(filters: EventFilters): Promise<ConventionEvent[]> {
    try {
      const allEvents = await CSVEventReader.loadEvents();
      let filteredEvents = allEvents;

      // Filter by days
      if (filters.days && filters.days.length > 0) {
        filteredEvents = filteredEvents.filter(event => filters.days!.includes(event.day as any));
      }

      // Filter by tracks
      if (filters.tracks && filters.tracks.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          event.track && filters.tracks!.includes(event.track)
        );
      }

      // Filter by difficulty
      if (filters.difficulty && filters.difficulty.length > 0) {
        filteredEvents = filteredEvents.filter(event => 
          event.difficulty && filters.difficulty!.includes(event.difficulty)
        );
      }

      // Filter by time range
      if (filters.timeRange) {
        const startTime = new Date(filters.timeRange.start);
        const endTime = new Date(filters.timeRange.end);
        
        filteredEvents = filteredEvents.filter(event => {
          const eventStart = new Date(event.startTime);
          return eventStart >= startTime && eventStart <= endTime;
        });
      }

      return filteredEvents;
    } catch (error) {
      console.error('Error filtering events:', error);
      return [];
    }
  }

  // Group events by time slot for a specific day
  static async getEventsByTimeSlot(day: string): Promise<Record<string, ConventionEvent[]>> {
    const events = await CSVEventReader.getEventsForDays([day]);
    
    // Group events by time slot
    const grouped: Record<string, ConventionEvent[]> = {};
    events.forEach(event => {
      if (!grouped[event.timeSlot]) {
        grouped[event.timeSlot] = [];
      }
      grouped[event.timeSlot].push(event);
    });
    
    return grouped;
  }

  // Get all available days
  static async getAvailableDays(): Promise<string[]> {
    return await CSVEventReader.getAvailableDays();
  }

  // Get event details by ID
  static async getEventById(id: string): Promise<ConventionEvent | null> {
    try {
      const allEvents = await CSVEventReader.loadEvents();
      return allEvents.find(event => event.id === id) || null;
    } catch (error) {
      console.error('Error getting event by ID:', error);
      return null;
    }
  }

  // Search events by title or description
  static async searchEvents(query: string, days?: string[]): Promise<ConventionEvent[]> {
    return await CSVEventReader.searchEvents(query, days);
  }
}

// Mock data for development/testing
export const mockEvents: ConventionEvent[] = [
  // Thursday Events
  {
    id: '1',
    title: 'Fursuit Making Basics',
    description: 'Aprende los fundamentos para crear tu propia cabeza de fursuit. Cubriremos materiales, herramientas y técnicas básicas.',
    startTime: '2024-03-23T10:00:00-06:00',
    endTime: '2024-03-23T11:30:00-06:00',
    location: 'Convention Center',
    room: 'Room A',
    track: 'Art',
    difficulty: 'Beginner',
    capacity: 30,
    currentAttendees: 15,
    imageUrl: '/images/fursuit-making.jpg',
    panelist: 'FurMaster123',
    tags: ['fursuit', 'art', 'tutorial', 'beginner'],
    day: 'Thursday',
    timeSlot: '10:00-11:30',
    isSelected: false
  },
  {
    id: '2',
    title: 'Técnicas de Arte Furry',
    description: 'Técnicas avanzadas de arte digital para artistas furry. Cubriendo sombreado, anatomía y diseño de personajes.',
    startTime: '2024-03-23T10:00:00-06:00',
    endTime: '2024-03-23T11:00:00-06:00',
    location: 'Convention Center',
    room: 'Room B',
    track: 'Art',
    difficulty: 'Advanced',
    capacity: 25,
    currentAttendees: 20,
    imageUrl: '/images/digital-art.jpg',
    panelist: 'PixelPaws',
    tags: ['digital art', 'tutorial', 'advanced', 'character design'],
    day: 'Thursday',
    timeSlot: '10:00-11:00',
    isSelected: false
  },
  {
    id: '3',
    title: 'Taller de Baile en Fursuit',
    description: 'Aprende coreografía y técnicas de movimiento específicamente diseñadas para fursuiters.',
    startTime: '2024-03-23T14:00:00-06:00',
    endTime: '2024-03-23T15:30:00-06:00',
    location: 'Convention Center',
    room: 'Main Hall',
    track: 'Social',
    difficulty: 'All Levels',
    capacity: 50,
    currentAttendees: 35,
    imageUrl: '/images/fursuit-dance.jpg',
    panelist: 'DanceWolf',
    tags: ['dance', 'fursuit', 'social', 'workshop'],
    day: 'Thursday',
    timeSlot: '14:00-15:30',
    isSelected: false
  },
  {
    id: '4',
    title: 'Construcción de Comunidad Furry',
    description: 'Cómo construir y mantener comunidades furry saludables tanto en línea como fuera de línea.',
    startTime: '2024-03-23T16:00:00-06:00',
    endTime: '2024-03-23T17:30:00-06:00',
    location: 'Convention Center',
    room: 'Room C',
    track: 'Educational',
    difficulty: 'All Levels',
    capacity: 40,
    currentAttendees: 28,
    imageUrl: '/images/community.jpg',
    panelist: 'CommunityBuilder',
    tags: ['community', 'social', 'education', 'networking'],
    day: 'Thursday',
    timeSlot: '16:00-17:30',
    isSelected: false
  },
  // Friday Events
  {
    id: '5',
    title: 'Fursuit Photography Tips',
    description: 'Consejos profesionales para fotografiar fursuits y crear contenido visual impactante.',
    startTime: '2024-03-24T09:00:00-06:00',
    endTime: '2024-03-24T10:30:00-06:00',
    location: 'Convention Center',
    room: 'Room A',
    track: 'Art',
    difficulty: 'Intermediate',
    capacity: 35,
    currentAttendees: 22,
    imageUrl: '/images/photography.jpg',
    panelist: 'PhotoFox',
    tags: ['photography', 'fursuit', 'tips', 'visual'],
    day: 'Friday',
    timeSlot: '09:00-10:30',
    isSelected: false
  },
  {
    id: '6',
    title: 'Furry Gaming Tournament',
    description: 'Torneo de videojuegos para la comunidad furry. ¡Premios y diversión garantizada!',
    startTime: '2024-03-24T11:00:00-06:00',
    endTime: '2024-03-24T13:00:00-06:00',
    location: 'Gaming Room',
    room: 'Gaming Hall',
    track: 'Social',
    difficulty: 'All Levels',
    capacity: 60,
    currentAttendees: 45,
    imageUrl: '/images/gaming.jpg',
    panelist: 'GameMaster',
    tags: ['gaming', 'tournament', 'social', 'competition'],
    day: 'Friday',
    timeSlot: '11:00-13:00',
    isSelected: false
  },
  {
    id: '7',
    title: 'Fursuit Maintenance Workshop',
    description: 'Aprende a mantener y reparar tu fursuit para que dure años. Técnicas de limpieza y reparación.',
    startTime: '2024-03-24T14:00:00-06:00',
    endTime: '2024-03-24T15:30:00-06:00',
    location: 'Convention Center',
    room: 'Room B',
    track: 'Educational',
    difficulty: 'Beginner',
    capacity: 25,
    currentAttendees: 18,
    imageUrl: '/images/maintenance.jpg',
    panelist: 'SuitDoctor',
    tags: ['maintenance', 'fursuit', 'care', 'repair'],
    day: 'Friday',
    timeSlot: '14:00-15:30',
    isSelected: false
  },
  // Saturday Events
  {
    id: '8',
    title: 'Furry Art Show & Tell',
    description: 'Muestra tu arte y recibe feedback de la comunidad. ¡Todos los niveles son bienvenidos!',
    startTime: '2024-03-25T10:00:00-06:00',
    endTime: '2024-03-25T12:00:00-06:00',
    location: 'Art Gallery',
    room: 'Gallery Hall',
    track: 'Art',
    difficulty: 'All Levels',
    capacity: 40,
    currentAttendees: 32,
    imageUrl: '/images/art-show.jpg',
    panelist: 'ArtCurator',
    tags: ['art show', 'feedback', 'community', 'gallery'],
    day: 'Saturday',
    timeSlot: '10:00-12:00',
    isSelected: false
  },
  {
    id: '9',
    title: 'Fursuit Parade',
    description: '¡El evento más esperado! Desfile de fursuits por el centro de convenciones.',
    startTime: '2024-03-25T14:00:00-06:00',
    endTime: '2024-03-25T15:30:00-06:00',
    location: 'Main Lobby',
    room: 'Parade Route',
    track: 'Social',
    difficulty: 'All Levels',
    capacity: 200,
    currentAttendees: 150,
    imageUrl: '/images/parade.jpg',
    panelist: 'ParadeMaster',
    tags: ['parade', 'fursuit', 'social', 'main event'],
    day: 'Saturday',
    timeSlot: '14:00-15:30',
    isSelected: false
  },
  {
    id: '10',
    title: 'Furry Music Jam Session',
    description: 'Sesión de improvisación musical para músicos furry. Trae tu instrumento o solo ven a escuchar.',
    startTime: '2024-03-25T16:00:00-06:00',
    endTime: '2024-03-25T18:00:00-06:00',
    location: 'Music Room',
    room: 'Jam Space',
    track: 'Social',
    difficulty: 'All Levels',
    capacity: 30,
    currentAttendees: 25,
    imageUrl: '/images/music.jpg',
    panelist: 'MusicWolf',
    tags: ['music', 'jam session', 'social', 'performance'],
    day: 'Saturday',
    timeSlot: '16:00-18:00',
    isSelected: false
  },
  // Sunday Events
  {
    id: '11',
    title: 'Furry Writing Workshop',
    description: 'Taller de escritura creativa para historias furry. Desde fanfiction hasta novelas originales.',
    startTime: '2024-03-26T09:00:00-06:00',
    endTime: '2024-03-26T11:00:00-06:00',
    location: 'Convention Center',
    room: 'Room C',
    track: 'Educational',
    difficulty: 'Intermediate',
    capacity: 20,
    currentAttendees: 15,
    imageUrl: '/images/writing.jpg',
    panelist: 'WriterFox',
    tags: ['writing', 'creative', 'workshop', 'literature'],
    day: 'Sunday',
    timeSlot: '09:00-11:00',
    isSelected: false
  },
  {
    id: '12',
    title: 'Fursuit Meet & Greet',
    description: 'Última oportunidad para conocer a otros fursuiters y hacer nuevas amistades antes de que termine la con.',
    startTime: '2024-03-26T11:30:00-06:00',
    endTime: '2024-03-26T13:00:00-06:00',
    location: 'Main Hall',
    room: 'Meet & Greet Area',
    track: 'Social',
    difficulty: 'All Levels',
    capacity: 100,
    currentAttendees: 75,
    imageUrl: '/images/meet-greet.jpg',
    panelist: 'SocialCoordinator',
    tags: ['meet & greet', 'social', 'networking', 'finale'],
    day: 'Sunday',
    timeSlot: '11:30-13:00',
    isSelected: false
  },
  {
    id: '13',
    title: 'Closing Ceremony',
    description: 'Ceremonia de clausura de Confuror 2025. ¡Gracias por ser parte de esta increíble experiencia!',
    startTime: '2024-03-26T14:00:00-06:00',
    endTime: '2024-03-26T15:00:00-06:00',
    location: 'Main Hall',
    room: 'Main Stage',
    track: 'Social',
    difficulty: 'All Levels',
    capacity: 500,
    currentAttendees: 400,
    imageUrl: '/images/closing.jpg',
    panelist: 'ConChair',
    tags: ['closing', 'ceremony', 'finale', 'thanks'],
    day: 'Sunday',
    timeSlot: '14:00-15:00',
    isSelected: false
  }
];
