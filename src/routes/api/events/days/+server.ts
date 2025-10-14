// Purpose: API endpoint for fetching available days
// Context: Returns all unique days that have events

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CSVEventReader } from '$lib/utils/csvReader';

export const GET: RequestHandler = async () => {
  try {
    // Get available days from CSV
    const days = await CSVEventReader.getAvailableDays();
    
    return json(days);
  } catch (error) {
    console.error('Error fetching days:', error);
    return json({ error: 'Failed to fetch days' }, { status: 500 });
  }
};
