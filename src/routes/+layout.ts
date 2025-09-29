// Purpose: Root layout configuration for static site generation
// Context: Needed to enable prerendering for GitHub Pages deployment
import posthog from 'posthog-js'
import { browser } from '$app/environment';

export const prerender = true;
export const ssr = false;


export const load = async () => {
  if (browser) {
    posthog.init(
      'phc_Fcp58Qw6TH48to35dd0wtJxZ8QpBxbLjsOqHER6OpJq',
      {
        api_host: 'https://eu.i.posthog.com',
        defaults: '2025-05-24',
        person_profiles: 'always', // or 'always' to create profiles for anonymous users as well
      }
    )
  }

  return
};