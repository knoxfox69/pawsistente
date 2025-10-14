// Purpose: MongoDB initialization script for Confuror Calendar
// Context: Creates initial database structure and sample events

// Switch to the confuror_calendar database
db = db.getSiblingDB('confuror_calendar');

// Create collections
db.createCollection('events');
db.createCollection('users');
db.createCollection('schedules');

// Create indexes for better performance
db.events.createIndex({ "day": 1 });
db.events.createIndex({ "startTime": 1 });
db.events.createIndex({ "track": 1 });
db.events.createIndex({ "timeSlot": 1 });

// Insert sample events (Spanish)
db.events.insertMany([
  {
    id: '1',
    title: 'Fursuit Making Basics',
    description: 'Aprende los fundamentos para crear tu propia cabeza de fursuit. Cubriremos materiales, herramientas y técnicas básicas.',
    startTime: new Date('2024-03-23T10:00:00-06:00'),
    endTime: new Date('2024-03-23T11:30:00-06:00'),
    location: 'Convention Center',
    room: 'Room A',
    track: 'Art',
    difficulty: 'Beginner',
    capacity: 30,
    currentAttendees: 15,
    imageUrl: '/images/fursuit-making.jpg',
    panelist: 'FurMaster123',
    tags: ['fursuit', 'art', 'tutorial', 'beginner'],
    day: 'Thursday',
    timeSlot: '10:00-11:30',
    isSelected: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    title: 'Técnicas de Arte Furry',
    description: 'Técnicas avanzadas de arte digital para artistas furry. Cubriendo sombreado, anatomía y diseño de personajes.',
    startTime: new Date('2024-03-23T10:00:00-06:00'),
    endTime: new Date('2024-03-23T11:00:00-06:00'),
    location: 'Convention Center',
    room: 'Room B',
    track: 'Art',
    difficulty: 'Advanced',
    capacity: 25,
    currentAttendees: 20,
    imageUrl: '/images/digital-art.jpg',
    panelist: 'PixelPaws',
    tags: ['digital art', 'tutorial', 'advanced', 'character design'],
    day: 'Thursday',
    timeSlot: '10:00-11:00',
    isSelected: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    title: 'Taller de Baile en Fursuit',
    description: 'Aprende coreografía y técnicas de movimiento específicamente diseñadas para fursuiters.',
    startTime: new Date('2024-03-23T14:00:00-06:00'),
    endTime: new Date('2024-03-23T15:30:00-06:00'),
    location: 'Convention Center',
    room: 'Main Hall',
    track: 'Social',
    difficulty: 'All Levels',
    capacity: 50,
    currentAttendees: 35,
    imageUrl: '/images/fursuit-dance.jpg',
    panelist: 'DanceWolf',
    tags: ['dance', 'fursuit', 'social', 'workshop'],
    day: 'Thursday',
    timeSlot: '14:00-15:30',
    isSelected: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    title: 'Fursuit Parade',
    description: '¡El evento más esperado! Desfile de fursuits por el centro de convenciones.',
    startTime: new Date('2024-03-25T14:00:00-06:00'),
    endTime: new Date('2024-03-25T15:30:00-06:00'),
    location: 'Main Lobby',
    room: 'Parade Route',
    track: 'Social',
    difficulty: 'All Levels',
    capacity: 200,
    currentAttendees: 150,
    imageUrl: '/images/parade.jpg',
    panelist: 'ParadeMaster',
    tags: ['parade', 'fursuit', 'social', 'main event'],
    day: 'Saturday',
    timeSlot: '14:00-15:30',
    isSelected: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    title: 'Closing Ceremony',
    description: 'Ceremonia de clausura de Confuror 2024. ¡Gracias por ser parte de esta increíble experiencia!',
    startTime: new Date('2024-03-26T14:00:00-06:00'),
    endTime: new Date('2024-03-26T15:00:00-06:00'),
    location: 'Main Hall',
    room: 'Main Stage',
    track: 'Social',
    difficulty: 'All Levels',
    capacity: 500,
    currentAttendees: 400,
    imageUrl: '/images/closing.jpg',
    panelist: 'ConChair',
    tags: ['closing', 'ceremony', 'finale', 'thanks'],
    day: 'Sunday',
    timeSlot: '14:00-15:00',
    isSelected: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Confuror Calendar database initialized successfully!');
print('Sample events inserted:', db.events.countDocuments());
