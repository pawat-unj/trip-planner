import type { TripData } from '../types';

const GIST_API_URL = 'https://api.github.com/gists';

/**
 * Fetch trip data from a public GitHub Gist
 */
export async function fetchTripFromGist(gistId: string): Promise<TripData> {
  const response = await fetch(`${GIST_API_URL}/${gistId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Trip not found. The link may be invalid or the trip has been deleted.');
    }
    throw new Error('Failed to fetch trip data. Please try again.');
  }

  const gist = await response.json();

  // Find the trip.json file in the gist
  const tripFile = Object.values(gist.files).find(
    (file: any) => file.filename === 'trip.json' || file.filename.endsWith('.json')
  ) as any;

  if (!tripFile) {
    throw new Error('Invalid trip data. No JSON file found in the gist.');
  }

  try {
    return JSON.parse(tripFile.content) as TripData;
  } catch {
    throw new Error('Invalid trip data. The JSON file is malformed.');
  }
}

/**
 * Create a public GitHub Gist with trip data
 * Note: This creates an anonymous gist. For authenticated gists, you'd need OAuth.
 */
export async function createTripGist(
  tripData: TripData,
  description?: string
): Promise<{ id: string; url: string; htmlUrl: string }> {
  const response = await fetch(GIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: description || `Trip: ${tripData.meta.title}`,
      public: true,
      files: {
        'trip.json': {
          content: JSON.stringify(tripData, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to create trip. Please try again.');
  }

  const gist = await response.json();

  return {
    id: gist.id,
    url: gist.url,
    htmlUrl: gist.html_url,
  };
}

/**
 * Generate a shareable trip URL
 */
export function generateTripUrl(gistId: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin + window.location.pathname;
  return `${base}#/view?gist=${gistId}`;
}

/**
 * Extract gist ID from URL
 */
export function extractGistIdFromUrl(url: string): string | null {
  // Handle direct gist IDs
  if (/^[a-f0-9]{8,}$/i.test(url)) {
    return url;
  }

  // Handle gist.github.com URLs
  const gistMatch = url.match(/gist\.github\.com\/(?:[^/]+\/)?([a-f0-9]{8,})/i);
  if (gistMatch) {
    return gistMatch[1];
  }

  // Handle our app URLs
  const appMatch = url.match(/[?&]gist=([a-f0-9]{8,})/i);
  if (appMatch) {
    return appMatch[1];
  }

  return null;
}

/**
 * Validate trip data structure
 */
export function validateTripData(data: unknown): data is TripData {
  if (!data || typeof data !== 'object') return false;

  const trip = data as TripData;

  // Check required meta fields
  if (!trip.meta?.version || !trip.meta?.template || !trip.meta?.title) {
    return false;
  }

  // Check valid template
  if (!['backpacking', 'roadtrip', 'dayhike'].includes(trip.meta.template)) {
    return false;
  }

  // Check shared exists
  if (!trip.shared || !Array.isArray(trip.shared.packingList)) {
    return false;
  }

  // Check itinerary exists
  if (!Array.isArray(trip.itinerary)) {
    return false;
  }

  // Check mapData exists
  if (!trip.mapData || !trip.mapData.center) {
    return false;
  }

  return true;
}
