// Purpose: Root layout configuration for static site generation
// Context: Needed to enable prerendering for GitHub Pages deployment
import posthog from 'posthog-js'
import { browser } from '$app/environment';
import { languageStore } from '$lib/stores/language';

export const prerender = true;
export const ssr = false;


export const load = async () => {
  // Load language from storage
  if (browser) {
    languageStore.loadFromStorage();
  }

  // Temporarily disable PostHog to prevent CORS issues
  // TODO: Re-enable with proper configuration once CORS issues are resolved
  if (browser && false) { // Disabled for now
    try {
      posthog.init(
        'phc_Fcp58Qw6TH48to35dd0wtJxZ8QpBxbLjsOqHER6OpJq',
        {
          api_host: 'https://eu.i.posthog.com',
          person_profiles: 'always',
          disable_session_recording: true,
          autocapture: false,
          loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
              posthog.debug();
            }
          }
        }
      );
    } catch (error) {
      console.warn('PostHog initialization failed:', error);
    }
  }

  return {};
};