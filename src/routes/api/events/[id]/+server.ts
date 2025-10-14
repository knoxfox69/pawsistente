// Purpose: API endpoint for fetching a specific event by ID
// Context: Handles GET requests for individual event details

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CSVEventReader } from '$lib/utils/csvReader';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const eventId = params.id;
    
    if (!eventId) {
      return json({ error: 'Event ID is required' }, { status: 400 });
    }
    
    // Get event by ID from CSV
    const event = await CSVEventReader.getEventById(eventId);
    
    if (!event) {
      return json({ error: 'Event not found' }, { status: 404 });
    }
    
    return json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return json({ error: 'Failed to fetch event' }, { status: 500 });
  }
};
