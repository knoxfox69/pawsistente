// Purpose: Manage overlay state across different pages
// Context: Allows triggering the add event overlay from any page

import { writable } from 'svelte/store';

export const showAddEventOverlay = writable(false);

