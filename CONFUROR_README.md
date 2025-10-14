# Confuror Calendar App

A TikTok-style event selection app designed specifically for Mexican furries attending Confuror 2024. This app allows users to browse convention events through an intuitive swipe interface and export their selected events to Google Calendar or Apple Calendar.

## Features

### 🎯 Core Functionality
- **Day Selection**: Choose which convention days to browse (Thursday, Friday, Saturday, Sunday)
- **Swipe Interface**: TikTok-style swiping for event selection
  - Swipe right to add event to calendar
  - Swipe left to skip event
  - Swipe up/down to navigate events at the same time slot
- **Calendar Export**: Generate iCal (.ics) files compatible with Google Calendar and Apple Calendar
- **Event Management**: Review, remove, and modify selected events before export

### 🎨 User Experience
- **Dark Mode Design**: Optimized for convention environments
- **Glassmorphic UI**: Modern, clean interface with backdrop blur effects
- **Responsive Design**: Works on mobile and desktop devices
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Accessibility**: ARIA labels and keyboard navigation support

### 📱 Interface Components

#### Day Selector
- Grid-based day selection with visual feedback
- Select all/clear all functionality
- Emoji indicators for each day
- Validation to ensure at least one day is selected

#### Event Card
- Full event information display
- Swipe gesture recognition
- Navigation arrows for same-time events
- Visual feedback for swipe actions
- Desktop fallback buttons

#### Event Summary
- Grouped display by day
- Event details and metadata
- Calendar export functionality
- Add more days or start over options

## Technical Implementation

### Architecture
- **Frontend**: SvelteKit with Svelte 5
- **Styling**: Tailwind CSS with custom glassmorphic design
- **State Management**: Svelte stores and reactive statements
- **API**: RESTful endpoints for event data
- **Calendar Export**: iCal format generation

### File Structure
```
src/
├── lib/
│   ├── confuror/
│   │   ├── types.ts          # TypeScript interfaces
│   │   ├── api.ts            # API client and mock data
│   │   ├── calendar.ts       # iCal export functionality
│   │   └── index.ts          # Module exports
│   └── components/
│       ├── DaySelector.svelte    # Day selection interface
│       ├── EventCard.svelte      # Event display with swipe
│       └── EventSummary.svelte   # Final review and export
├── routes/
│   ├── events/
│   │   └── +page.svelte      # Main event browsing page
│   └── api/
│       └── confuror/
│           └── events/
│               └── +server.ts    # API endpoint
└── +page.svelte              # Landing page
```

### Data Model

#### ConfurorEvent Interface
```typescript
interface ConfurorEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;        // ISO 8601 format
  endTime: string;          // ISO 8601 format
  location: string;
  room?: string;
  track?: string;           // Art, Social, Educational, etc.
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  capacity?: number;
  currentAttendees?: number;
  imageUrl?: string;
  panelist?: string;
  tags: string[];
  day: 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeSlot: string;         // e.g., "10:00-11:00"
  isSelected?: boolean;
}
```

## Usage

### Getting Started
1. Navigate to the app homepage
2. Click "Browse Confuror Events"
3. Select the days you'll be attending
4. Swipe through events to build your schedule
5. Review and export your calendar

### Swipe Gestures
- **Swipe Right**: Add event to your calendar
- **Swipe Left**: Skip this event
- **Swipe Up/Down**: Navigate between events at the same time slot
- **Tap Navigation Arrows**: Alternative navigation for same-time events

### Calendar Export
1. Complete event selection
2. Review your selected events in the summary screen
3. Click "Export to Calendar"
4. Download the generated .ics file
5. Import into Google Calendar, Apple Calendar, or any iCal-compatible app

## Development

### Prerequisites
- Node.js 18+
- npm or bun package manager

### Installation
```bash
npm install
# or
bun install
```

### Development Server
```bash
npm run dev
# or
bun dev
```

### Building for Production
```bash
npm run build
# or
bun build
```

## API Integration

The app is designed to work with a MongoDB backend. To integrate with your database:

1. Update the API endpoints in `src/routes/api/confuror/events/+server.ts`
2. Replace mock data in `src/lib/confuror/api.ts` with actual database queries
3. Ensure your MongoDB schema matches the `ConfurorEvent` interface

### Example MongoDB Query
```javascript
// Get events for specific days
const events = await db.collection('events').find({
  day: { $in: selectedDays }
}).toArray();
```

## Customization

### Styling
- Modify Tailwind classes in component files
- Update color palette in `.cursorrules`
- Adjust glassmorphic effects in component styles

### Event Data
- Add new event fields to the `ConfurorEvent` interface
- Update mock data in `api.ts`
- Modify display components as needed

### Swipe Sensitivity
- Adjust swipe threshold in `EventCard.svelte`
- Modify gesture recognition logic
- Customize visual feedback

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Proprietary - All rights reserved

## Contributing

This is a specialized application for Confuror 2024. For modifications or improvements, please contact the development team.

---

**Built with ❤️ for the Mexican furry community**
