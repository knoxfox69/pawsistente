// Purpose: API endpoint for fetching a specific event by ID
// Context: Handles GET requests for individual event details

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEventsCollection } from '$lib/db/mongodb';
import { ObjectId } from 'mongodb';
import type { ConfurorEvent } from '$lib/confuror/types';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const eventsCollection = await getEventsCollection();
    const eventId = params.id;
    
    if (!eventId) {
      return json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    // Validate ObjectId format
    if (!ObjectId.isValid(eventId)) {
      return json({ error: 'Invalid event ID format' }, { status: 400 });
    }
    
    const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!event) {
      return json({ error: 'Event not found' }, { status: 404 });
    }
    
    // Convert MongoDB document to ConfurorEvent format
    const formattedEvent: ConfurorEvent = {
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
    };
    
    return json(formattedEvent);
  } catch (error) {
    console.error('Error fetching event:', error);
    return json({ error: 'Failed to fetch event' }, { status: 500 });
  }
};
