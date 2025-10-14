// Purpose: API endpoint for fetching events from MongoDB
// Context: Handles GET requests to fetch events with optional filtering by days

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEventsCollection } from '$lib/db/mongodb';
import type { ConfurorEvent } from '$lib/confuror/types';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const eventsCollection = await getEventsCollection();
    const days = url.searchParams.getAll('days');
    
    // Build query filter
    const filter: any = {};
    if (days.length > 0) {
      filter.day = { $in: days };
    }
    
    // Fetch events from MongoDB
    const events = await eventsCollection.find(filter).toArray();
    
    // Convert MongoDB documents to ConfurorEvent format
    const formattedEvents: ConfurorEvent[] = events.map(event => ({
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      room: event.room,
      track: event.track,
      difficulty: event.difficulty,
      capacity: event.capacity,
      currentAttendees: event.currentAttendees,
      imageUrl: event.imageUrl,
      panelist: event.panelist,
      tags: event.tags || [],
      day: event.day,
      timeSlot: event.timeSlot,
      isSelected: false
    }));
    
    return json(formattedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return json({ error: 'Failed to fetch events' }, { status: 500 });
  }
};
