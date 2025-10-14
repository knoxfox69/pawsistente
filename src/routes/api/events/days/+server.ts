// Purpose: API endpoint for fetching available days
// Context: Returns all unique days that have events

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEventsCollection } from '$lib/db/mongodb';

export const GET: RequestHandler = async () => {
  try {
    const eventsCollection = await getEventsCollection();
    
    // Get distinct days from events
    const days = await eventsCollection.distinct('day');
    
    return json(days);
  } catch (error) {
    console.error('Error fetching days:', error);
    return json({ error: 'Failed to fetch days' }, { status: 500 });
  }
};
