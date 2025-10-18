# Pawsistente - Confuror Calendar

A TikTok-style event browsing app for Mexican furries attending Confuror 2025. Swipe through events, select your favorites, and export to your calendar.

## 🚧 Alpha Release

This is an **ALPHA VERSION** of Pawsistente. It may contain bugs and incomplete features. Use at your own risk.

## ⚠️ Disclaimer

This is **NOT** an official Confuror application. It's a community project built with ❤️ for the Mexican furry community.

## ✨ Features

- **TikTok-style Interface**: Swipe through events like you're browsing social media
- **Smart Event Selection**: Add events to your calendar with simple swipe gestures
- **Slack-style Animations**: Beautiful circular progress indicators during swipes
- **Bilingual Support**: Spanish and English language switching
- **Calendar Export**: Export selected events to Google Calendar, Apple Calendar, or any iCal-compatible app
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **CSV-based Data**: Reads event data from CSV files (no database required)
- **Conflict Detection**: Shows time conflicts with previously selected events

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pawsistente.git
   cd pawsistente
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📊 Data Source

The app reads event data from CSV files located in the `static/` directory:

- `static/schedule.csv` - Spanish events (fallback)
- `static/schedule_english.csv` - English events

### CSV Format

The CSV files should have these columns:
```
day,start_time,end_time,location,title,hosted_by,category,description
```

Example:
```
thursday,14:00,15:00,Main Hall,Workshop,John Doe,Educational,Learn something new
```

### Event Data Structure

Events are parsed from CSV and converted to this format:

```typescript
interface ConfurorEvent {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  location: string;
  room?: string;
  track?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  capacity?: number;
  currentAttendees?: number;
  imageUrl?: string;
  panelist?: string;
  tags: string[];
  day: 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeSlot: string; // e.g., "10:00-11:00"
  isSelected?: boolean;
}
```

## 🔌 API Endpoints

The app provides several API endpoints for event management:

### GET `/api/events`
Fetch events with optional day filtering.

**Query Parameters:**
- `days[]`: Array of days to filter by (Thursday, Friday, Saturday, Sunday)

**Example:**
```bash
curl "http://localhost:5173/api/events?days[]=Friday&days[]=Saturday"
```

### GET `/api/events/days`
Get all available days that have events.

**Response:**
```json
["Thursday", "Friday", "Saturday", "Sunday"]
```

### GET `/api/events/[id]`
Fetch a specific event by ID.

**Example:**
```bash
curl "http://localhost:5173/api/events/507f1f77bcf86cd799439011"
```

## 🛠️ Development

### Project Structure

```
src/
├── lib/
│   ├── components/          # Svelte components
│   │   ├── DaySelector.svelte
│   │   ├── EventCard.svelte
│   │   ├── EventSummary.svelte
│   │   └── LanguageSelector.svelte
│   ├── confuror/           # Confuror-specific logic
│   │   ├── api.ts          # API client
│   │   ├── calendar.ts     # Calendar export
│   │   └── types.ts        # Type definitions
│   ├── db/                 # Database utilities
│   │   └── mongodb.ts      # MongoDB connection
│   └── stores/             # State management
│       └── language.ts     # Language store
├── routes/
│   ├── api/                # API endpoints
│   │   └── events/
│   ├── about/              # About page
│   ├── events/             # Main events page
│   └── +page.svelte        # Landing page
└── app.html                # HTML template
```

### Adding New Events

#### Method 1: Using the Seed Script
1. Edit `scripts/seed-events.ts`
2. Add your events to the `sampleEvents` array
3. Run `npm run seed`

#### Method 2: Direct Database Insert
```javascript
// Connect to MongoDB
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');

async function addEvent() {
  await client.connect();
  const db = client.db('confuror_calendar');
  const events = db.collection('events');
  
  await events.insertOne({
    title: 'Your Event Title',
    description: 'Event description...',
    startTime: '2024-03-23T10:00:00-06:00',
    endTime: '2024-03-23T11:00:00-06:00',
    location: 'Convention Center',
    room: 'Room A',
    track: 'Art',
    difficulty: 'Beginner',
    capacity: 30,
    currentAttendees: 0,
    panelist: 'Speaker Name',
    tags: ['tag1', 'tag2'],
    day: 'Thursday',
    timeSlot: '10:00-11:00'
  });
  
  await client.close();
}
```

#### Method 3: Using MongoDB Compass
1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `events` collection
4. Click "Add Data" → "Insert Document"
5. Paste your event JSON

### Customizing the App

#### Adding New Languages
1. Edit `src/lib/stores/language.ts`
2. Add your language to the `Language` type
3. Add translations to the `translations` object
4. Update the language selector component

#### Modifying Event Cards
Edit `src/lib/components/EventCard.svelte` to customize:
- Event display layout
- Swipe animations
- Action buttons
- Visual styling

#### Changing the Color Scheme
Update `tailwind.config.js` and component styles to match your brand colors.

## 🚀 Deployment

### Option 1: Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables:**
   - `MONGODB_URI`: Your MongoDB connection string
   - `MONGODB_DB`: Your database name

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### Option 2: Docker

1. **Build the Docker image:**
   ```bash
   docker build -t pawsistente .
   ```

2. **Run with MongoDB:**
   ```bash
   docker-compose up -d
   ```

### Option 3: Traditional VPS

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm run preview
   ```

3. **Use a process manager like PM2:**
   ```bash
   npm install -g pm2
   pm2 start build/index.js --name pawsistente
   ```

## 📱 Mobile App (Future)

The app is designed to be mobile-first and could be easily converted to a native app using:
- **Capacitor**: For hybrid mobile apps
- **Tauri**: For desktop apps
- **PWA**: For installable web apps

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for the Mexican furry community
- Inspired by TikTok's intuitive interface
- Powered by SvelteKit 5 and MongoDB
- Special thanks to the Confuror team for the inspiration

## 📞 Contact

- **Developer**: @knoxfox69
- **Telegram**: [@knoxfox69](https://t.me/knoxfox69)
- **Project**: [GitHub Repository](https://github.com/yourusername/pawsistente)

---

**Made with 🐾 for the furry community**