import { MultiSelectOption } from '@/components/ui/multi-select';

// Comprehensive geographic regions with startup ecosystem intelligence
export const GEOGRAPHIC_REGIONS = {
  'North America': {
    countries: ['United States', 'Canada', 'Mexico', 'Costa Rica'],
    ecosystems: ['Silicon Valley', 'New York', 'Toronto', 'Austin', 'Seattle', 'Boston', 'Vancouver', 'Montreal'],
  },
  'Europe': {
    countries: ['United Kingdom', 'Germany', 'France', 'Netherlands', 'Sweden', 'Switzerland', 'Spain', 'Italy', 'Denmark', 'Norway', 'Finland', 'Estonia', 'Latvia', 'Lithuania', 'Poland', 'Czech Republic', 'Austria', 'Belgium', 'Ireland', 'Portugal', 'Greece', 'Romania', 'Bulgaria', 'Hungary', 'Slovenia', 'Slovakia', 'Croatia', 'Luxembourg', 'Malta', 'Cyprus'],
    ecosystems: ['London', 'Berlin', 'Paris', 'Amsterdam', 'Stockholm', 'Zurich', 'Barcelona', 'Madrid', 'Milan', 'Copenhagen', 'Oslo', 'Helsinki', 'Tallinn', 'Warsaw', 'Prague', 'Vienna', 'Brussels', 'Dublin', 'Lisbon'],
  },
  'Asia Pacific': {
    countries: ['Singapore', 'Australia', 'Japan', 'South Korea', 'China', 'India', 'Hong Kong', 'Taiwan', 'Thailand', 'Malaysia', 'Indonesia', 'Vietnam', 'Philippines', 'New Zealand', 'Bangladesh', 'Sri Lanka', 'Cambodia', 'Laos', 'Myanmar'],
    ecosystems: ['Singapore', 'Sydney', 'Melbourne', 'Perth', 'Tokyo', 'Seoul', 'Beijing', 'Shanghai', 'Shenzhen', 'Bangalore', 'Mumbai', 'Delhi', 'Hong Kong', 'Taipei', 'Bangkok', 'Kuala Lumpur', 'Jakarta', 'Ho Chi Minh City', 'Manila', 'Auckland'],
  },
  'Latin America': {
    countries: ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Mexico', 'Uruguay', 'Ecuador', 'Bolivia', 'Paraguay', 'Venezuela', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Panama', 'Dominican Republic', 'Cuba', 'Haiti', 'Jamaica', 'Trinidad and Tobago', 'Barbados'],
    ecosystems: ['São Paulo', 'Rio de Janeiro', 'Buenos Aires', 'Santiago', 'Bogotá', 'Lima', 'Mexico City', 'Montevideo', 'Medellín', 'Guadalajara'],
  },
  'Middle East & Africa': {
    countries: ['Israel', 'UAE', 'South Africa', 'Kenya', 'Nigeria', 'Egypt', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Morocco', 'Tunisia', 'Algeria', 'Ghana', 'Ethiopia', 'Uganda', 'Tanzania', 'Rwanda', 'Botswana', 'Zambia', 'Zimbabwe', 'Namibia', 'Mauritius', 'Senegal', 'Ivory Coast', 'Cameroon', 'Angola', 'Mozambique'],
    ecosystems: ['Tel Aviv', 'Dubai', 'Abu Dhabi', 'Cape Town', 'Johannesburg', 'Nairobi', 'Lagos', 'Cairo', 'Riyadh', 'Doha', 'Kuwait City', 'Casablanca', 'Tunis', 'Accra', 'Addis Ababa', 'Kampala', 'Dar es Salaam', 'Kigali'],
  }
};

// Convert geographic data to MultiSelect options
export const LOCATION_OPTIONS: MultiSelectOption[] = [
  // Countries by region
  ...Object.entries(GEOGRAPHIC_REGIONS).flatMap(([region, data]) =>
    data.countries.map(country => ({
      label: country,
      value: country,
      category: `${region} - Countries`
    }))
  ),
  // Startup ecosystems by region  
  ...Object.entries(GEOGRAPHIC_REGIONS).flatMap(([region, data]) =>
    data.ecosystems.map(ecosystem => ({
      label: ecosystem,
      value: ecosystem,
      category: `${region} - Startup Ecosystems`
    }))
  )
];

// Utility function to convert location array to string for database storage
export const locationsToString = (locations: string[]): string => {
  return locations.join(', ');
};

// Utility function to convert location string to array for form usage
export const stringToLocations = (locationString: string): string[] => {
  if (!locationString) return [];
  return locationString.split(',').map(s => s.trim()).filter(Boolean);
};