import { PersonData } from '../types';

export function formatPersonResponse(data: PersonData[]): string {
  if (!data || data.length === 0) {
    return "I couldn't find any information about that person.";
  }

  // Remove duplicates based on ID
  const uniqueData = data.filter((item, index, self) =>
    index === self.findIndex((t) => t.id === item.id)
  );

  if (uniqueData.length === 1) {
    const person = uniqueData[0];
    return `Based on our records, ${person.firstName} ${person.lastName} is a ${person.age}-year-old ${person.gender.toLowerCase()} from ${person.country}. This information was recorded on ${formatDate(person.date)}. Their unique identifier in our system is ${person.id}.`;
  } else {
    // Handle multiple unique records
    return `I found multiple records for ${uniqueData[0].firstName} ${uniqueData[0].lastName}. Would you like me to provide details for each entry?`;
  }
}

function formatDate(dateString: string): string {
  const [day, month, year] = dateString.split('/');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatMultipleResults(data: PersonData[]): string {
  const count = data.length;
  const locations = [...new Set(data.map(person => person.country))];
  
  return `I found ${count} people from ${locations.join(', ')}. Would you like me to provide more specific details about any of them?`;
} 