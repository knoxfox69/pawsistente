// Purpose: Client-side metrics tracking endpoint
// Context: Receives metrics data from client-side JavaScript and updates Prometheus metrics

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateMetrics } from '$lib/utils/metricsStore';
import { withMetrics } from '$lib/utils/httpMetrics';

export const POST: RequestHandler = withMetrics(async ({ request }) => {
  try {
    const data = await request.json();
    const { type, page, userAgent, duration, entryPoint, eventId, eventName, day } = data;

    // Update metrics store based on type
    switch (type) {
      case 'page_view':
        if (page && userAgent) {
          updateMetrics(type, {
            page,
            user_agent_type: getUserAgentType(userAgent)
          });
        }
        break;
        
      case 'app_visit':
        if (entryPoint) {
          updateMetrics(type, {
            entryPoint
          });
        }
        break;
        
      case 'page_load':
        if (page && userAgent && duration !== undefined) {
          updateMetrics(type, {
            page,
            user_agent_type: getUserAgentType(userAgent),
            duration
          });
        }
        break;
        
      case 'event_added':
        if (eventId && eventName && day) {
          updateMetrics(type, {
            eventId,
            eventName,
            day
          });
        }
        break;
        
      case 'event_removed':
        if (eventId && eventName && day) {
          updateMetrics(type, {
            eventId,
            eventName,
            day
          });
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
}, { method: 'POST', path: '/api/metrics/track' });

// Purpose: Helper function to categorize user agents
// Context: Simplifies user agent strings for metrics labeling
function getUserAgentType(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}
