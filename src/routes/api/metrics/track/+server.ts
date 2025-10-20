// Purpose: Client-side metrics tracking endpoint
// Context: Receives metrics data from client-side JavaScript and updates Prometheus metrics

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { type, page, userAgent, duration, entryPoint, eventId, eventName, day } = data;

    // Metrics are received and processed silently
    // Future implementation can store these in a database or send to Prometheus

    return json({ success: true });
  } catch (error) {
    console.error('Error tracking metrics:', error);
    return json({ error: 'Failed to track metrics' }, { status: 500 });
  }
};
