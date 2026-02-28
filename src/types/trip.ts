// Trip template types
export type TripTemplate = 'backpacking' | 'roadtrip' | 'dayhike';
export type Difficulty = 'easy' | 'moderate' | 'hard' | 'expert';
export type Terrain = 'mountain' | 'coast' | 'forest' | 'desert' | 'volcano' | 'mixed';

// Weather forecast
export interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'stormy';
  precipitation: number; // percentage
}

// Packing list item
export interface PackingItem {
  id: string;
  name: string;
  category: string;
  quantity?: number;
  checked?: boolean;
  essential?: boolean;
}

// Map marker
export interface MapMarker {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lon: number;
  type: 'camp' | 'trailhead' | 'viewpoint' | 'water' | 'food' | 'accommodation' | 'activity' | 'poi' | 'divider';
  day?: number;
}

// Map route segment
export interface MapRoute {
  id: string;
  name: string;
  day?: number;
  points: Array<{ lat: number; lon: number; ele?: number }>;
  color?: string;
}

// Elevation data point
export interface ElevationPoint {
  distance: number; // cumulative distance in km/miles
  elevation: number; // in meters/feet
}

// GPX parsed data
export interface GPXData {
  name?: string;
  tracks: Array<{
    name?: string;
    points: Array<{
      lat: number;
      lon: number;
      ele: number;
      time?: string;
    }>;
  }>;
  waypoints: Array<{
    lat: number;
    lon: number;
    name: string;
    description?: string;
    type?: string;
  }>;
}

// Trail/route statistics
export interface TrailStats {
  totalDistance: number;
  elevationGain: number;
  elevationLoss: number;
  maxElevation: number;
  minElevation: number;
  elevationProfile: ElevationPoint[];
}

// Itinerary day
export interface ItineraryDay {
  day: number;
  date?: string;
  title: string;
  description?: string;
  activities: Array<{
    time?: string;
    title: string;
    description?: string;
    location?: string;
  }>;
  accommodation?: {
    name: string;
    type: 'tent' | 'hotel' | 'hostel' | 'cabin' | 'airbnb' | 'other';
    location?: string;
    notes?: string;
  };
  meals?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  distance?: number;
  elevationGain?: number;
}

// Transportation leg (for road trips)
export interface TransportationLeg {
  id: string;
  type: 'flight' | 'car' | 'train' | 'bus' | 'ferry' | 'other';
  from: string;
  to: string;
  date?: string;
  time?: string;
  duration?: string;
  confirmationNumber?: string;
  notes?: string;
}

// Carpooling arrangement
export interface CarpoolArrangement {
  type: 'link' | 'embedded';
  url?: string;
  data?: Array<{
    driver: string;
    vehicle?: string;
    seats: number;
    passengers: string[];
    departureTime?: string;
    departureLocation?: string;
  }>;
}

// Template-specific data
export interface BackpackingData {
  difficulty: Difficulty;
  distance: number;
  distanceUnit: 'miles' | 'km';
  days: number;
  terrain: Terrain[];
  elevationGain?: number;
  trailStats?: TrailStats;
  permitRequired?: boolean;
  permitInfo?: string;
}

export interface RoadTripData {
  days: number;
  totalMiles?: number;
  transportation: TransportationLeg[];
}

export interface DayHikeData {
  difficulty: Difficulty;
  distance: number;
  distanceUnit: 'miles' | 'km';
  terrain: Terrain[];
  elevationGain?: number;
  trailStats?: TrailStats;
  trailheadParking?: string;
}

// Map data
export interface MapData {
  center: [number, number];
  zoom: number;
  routes: MapRoute[];
  markers: MapMarker[];
}

// Main trip data structure
export interface TripData {
  meta: {
    version: string;
    template: TripTemplate;
    title: string;
    subtitle?: string;
    dates: {
      start: string;
      end: string;
    };
    location?: string;
    createdAt: string;
    updatedAt?: string;
    coverImage?: string;
  };

  // Shared sections (all templates)
  shared: {
    highlights: string[];
    weather?: WeatherForecast[];
    packingList: PackingItem[];
    importantInfo: string[];
    carpooling?: CarpoolArrangement;
    photoAlbum?: { url: string };
  };

  // Template-specific data
  templateData: BackpackingData | RoadTripData | DayHikeData;

  // Itinerary
  itinerary: ItineraryDay[];

  // Map data
  mapData: MapData;

  // GPX raw data (if uploaded)
  gpxData?: GPXData;
}

// Template configuration for rendering
export interface TemplateConfig {
  name: string;
  icon: string;
  headerStats: string[];
  sections: string[];
}

export const TEMPLATE_CONFIGS: Record<TripTemplate, TemplateConfig> = {
  backpacking: {
    name: 'Backpacking',
    icon: '🎒',
    headerStats: ['difficulty', 'distance', 'elevation', 'days', 'terrain'],
    sections: ['map', 'itinerary', 'weather', 'packingList', 'highlights', 'importantInfo', 'carpooling', 'photos'],
  },
  roadtrip: {
    name: 'Road Trip',
    icon: '🚗',
    headerStats: ['days', 'totalMiles'],
    sections: ['map', 'itinerary', 'transportation', 'weather', 'packingList', 'highlights', 'importantInfo', 'carpooling', 'photos'],
  },
  dayhike: {
    name: 'Day Hike',
    icon: '🥾',
    headerStats: ['difficulty', 'distance', 'elevation', 'terrain'],
    sections: ['map', 'itinerary', 'weather', 'packingList', 'highlights', 'importantInfo', 'carpooling', 'photos'],
  },
};
