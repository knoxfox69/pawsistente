// Purpose: Redirect to events page (add-event is now an overlay)
// Context: This route now redirects to maintain backward compatibility

import { redirect } from '@sveltejs/kit';

export const load = () => {
  throw redirect(307, '/events');
};

