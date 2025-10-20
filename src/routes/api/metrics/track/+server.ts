// Purpose: Client-side metrics tracking endpoint
// Context: Receives metrics data from client-side JavaScript and updates Prometheus metrics

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
  trackPageView, 
  trackAppVisit, 
  trackPageLoadTime,
  trackEventAdded,
  trackEventRemoved 
} from '$lib/utils/metrics';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { type, page, userAgent, duration, entryPoint, eventId, eventName, day } = data;

    switch (type) {
      case 'page_view':
        if (page && userAgent) {
          trackPageView(page, userAgent);
        }
        break;
        
      case 'app_visit':
        if (entryPoint) {
          trackAppVisit(entryPoint);
        }
        break;
        
      case 'page_load':
        if (page && userAgent && duration !== undefined) {
          trackPageLoadTime(page, userAgent, duration);
        }
        break;
        
      case 'event_added':
        if (eventId && eventName && day) {
          trackEventAdded(eventId, eventName, day);
        }
        break;
        
      case 'event_removed':
        if (eventId && eventName && day) {
          trackEventRemoved(eventId, eventName, day);
        }
        break;
        
      default:
        console.warn('Unknown metrics tracking type:', type);
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error tracking metrics:', error);
    return json({ error: 'Failed to track metrics' }, { status: 500 });
  }
};
