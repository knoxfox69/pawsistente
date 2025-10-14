// Purpose: API endpoint for fetching events from CSV files
// Context: Handles GET requests to fetch events with optional filtering by days

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CSVEventReader } from '$lib/utils/csvReader';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const days = url.searchParams.getAll('days');
    
    // Load events from CSV
    let events = await CSVEventReader.loadEvents();
    
    // Filter by days if specified
    if (days.length > 0) {
      events = events.filter(event => days.includes(event.day));
    }
    
    return json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return json({ error: 'Failed to fetch events' }, { status: 500 });
  }
};
