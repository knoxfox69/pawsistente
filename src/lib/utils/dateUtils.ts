// Purpose: Date utility functions for dynamic date generation
// Context: Provides functions to format dates for different languages and contexts

export function getConfurorDates() {
  // Confuror 2025 dates: October 23-26, 2025
  const dates = {
    'Thursday': { day: 23, month: 10, year: 2025 },
    'Friday': { day: 24, month: 10, year: 2025 },
    'Saturday': { day: 25, month: 10, year: 2025 },
    'Sunday': { day: 26, month: 10, year: 2025 }
  };
  
  return dates;
}

export function formatDayWithDate(day: string, language: 'en' | 'es' = 'en'): string {
  const dates = getConfurorDates();
  const dayData = dates[day as keyof typeof dates];
  
  if (!dayData) return day;
  
  const monthName = language === 'es' ? 'Octubre' : 'October';
  return `${dayData.day} de ${monthName}`;
}

export function getDayAbbreviation(day: string): string {
  const abbreviations = {
    'Thursday': 'JUE',
    'Friday': 'VIE', 
    'Saturday': 'SAB',
    'Sunday': 'DOM'
  };
  
  return abbreviations[day as keyof typeof abbreviations] || 'JUE';
}

export function formatEventDate(eventDate: string, language: 'en' | 'es' = 'en'): string {
  const date = new Date(eventDate);
  const monthName = language === 'es' ? 'Octubre' : 'October';
  const dayName = language === 'es' 
    ? ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()]
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  
  return `${dayName} ${date.getDate()} ${monthName} 2025`;
}
