import type { GPXData, TrailStats, ElevationPoint } from '../types';

/**
 * Parse GPX XML string into structured data
 */
export function parseGPX(gpxString: string): GPXData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxString, 'application/xml');

  // Check for parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid GPX file format');
  }

  // Get metadata name
  const metadataName = doc.querySelector('metadata > name')?.textContent || undefined;

  // Parse tracks
  const tracks: GPXData['tracks'] = [];
  const trkElements = doc.querySelectorAll('trk');

  trkElements.forEach((trk) => {
    const trackName = trk.querySelector('name')?.textContent || undefined;
    const points: GPXData['tracks'][0]['points'] = [];

    // Get all track points from all segments
    const trkpts = trk.querySelectorAll('trkseg > trkpt');
    trkpts.forEach((trkpt) => {
      const lat = parseFloat(trkpt.getAttribute('lat') || '0');
      const lon = parseFloat(trkpt.getAttribute('lon') || '0');
      const ele = parseFloat(trkpt.querySelector('ele')?.textContent || '0');
      const time = trkpt.querySelector('time')?.textContent || undefined;

      points.push({ lat, lon, ele, time });
    });

    if (points.length > 0) {
      tracks.push({ name: trackName, points });
    }
  });

  // Parse waypoints
  const waypoints: GPXData['waypoints'] = [];
  const wptElements = doc.querySelectorAll('wpt');

  wptElements.forEach((wpt) => {
    const lat = parseFloat(wpt.getAttribute('lat') || '0');
    const lon = parseFloat(wpt.getAttribute('lon') || '0');
    const name = wpt.querySelector('name')?.textContent || 'Waypoint';
    const description = wpt.querySelector('desc')?.textContent || undefined;
    const type = wpt.querySelector('type')?.textContent || undefined;

    waypoints.push({ lat, lon, name, description, type });
  });

  return {
    name: metadataName,
    tracks,
    waypoints,
  };
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate trail statistics from GPX data
 */
export function calculateTrailStats(gpxData: GPXData): TrailStats {
  // Combine all track points
  const allPoints = gpxData.tracks.flatMap((track) => track.points);

  if (allPoints.length === 0) {
    return {
      totalDistance: 0,
      elevationGain: 0,
      elevationLoss: 0,
      maxElevation: 0,
      minElevation: 0,
      elevationProfile: [],
    };
  }

  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let maxElevation = allPoints[0].ele;
  let minElevation = allPoints[0].ele;
  const elevationProfile: ElevationPoint[] = [];

  // First point
  elevationProfile.push({
    distance: 0,
    elevation: allPoints[0].ele,
  });

  for (let i = 1; i < allPoints.length; i++) {
    const prev = allPoints[i - 1];
    const curr = allPoints[i];

    // Calculate distance
    const segmentDistance = haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);
    totalDistance += segmentDistance;

    // Calculate elevation change
    const elevationDiff = curr.ele - prev.ele;
    if (elevationDiff > 0) {
      elevationGain += elevationDiff;
    } else {
      elevationLoss += Math.abs(elevationDiff);
    }

    // Track min/max
    maxElevation = Math.max(maxElevation, curr.ele);
    minElevation = Math.min(minElevation, curr.ele);

    // Add to elevation profile (sample every ~100m for performance)
    const lastProfilePoint = elevationProfile[elevationProfile.length - 1];
    if (totalDistance - lastProfilePoint.distance >= 0.1 || i === allPoints.length - 1) {
      elevationProfile.push({
        distance: totalDistance,
        elevation: curr.ele,
      });
    }
  }

  return {
    totalDistance: Math.round(totalDistance * 100) / 100,
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    maxElevation: Math.round(maxElevation),
    minElevation: Math.round(minElevation),
    elevationProfile,
  };
}

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

/**
 * Convert meters to feet
 */
export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

/**
 * Format distance with unit
 */
export function formatDistance(km: number, unit: 'km' | 'miles' = 'miles'): string {
  if (unit === 'miles') {
    return `${kmToMiles(km).toFixed(1)} mi`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format elevation with unit
 */
export function formatElevation(meters: number, unit: 'meters' | 'feet' = 'feet'): string {
  if (unit === 'feet') {
    return `${Math.round(metersToFeet(meters)).toLocaleString()} ft`;
  }
  return `${Math.round(meters).toLocaleString()} m`;
}

/**
 * Get map bounds from GPX data
 */
export function getGPXBounds(gpxData: GPXData): {
  center: [number, number];
  bounds: [[number, number], [number, number]];
} {
  const allPoints = [
    ...gpxData.tracks.flatMap((track) => track.points),
    ...gpxData.waypoints,
  ];

  if (allPoints.length === 0) {
    return {
      center: [0, 0],
      bounds: [[-90, -180], [90, 180]],
    };
  }

  let minLat = allPoints[0].lat;
  let maxLat = allPoints[0].lat;
  let minLon = allPoints[0].lon;
  let maxLon = allPoints[0].lon;

  allPoints.forEach((point) => {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLon = Math.min(minLon, point.lon);
    maxLon = Math.max(maxLon, point.lon);
  });

  return {
    center: [(minLat + maxLat) / 2, (minLon + maxLon) / 2],
    bounds: [[minLat, minLon], [maxLat, maxLon]],
  };
}

/**
 * Split track points into segments by day
 * This assumes roughly equal distribution or uses waypoints as day markers
 */
export function splitTrackByDays(
  points: GPXData['tracks'][0]['points'],
  numDays: number
): GPXData['tracks'][0]['points'][] {
  if (numDays <= 1 || points.length === 0) {
    return [points];
  }

  const pointsPerDay = Math.ceil(points.length / numDays);
  const segments: GPXData['tracks'][0]['points'][] = [];

  for (let i = 0; i < numDays; i++) {
    const start = i * pointsPerDay;
    const end = Math.min(start + pointsPerDay + 1, points.length); // +1 to overlap for continuity
    segments.push(points.slice(start, end));
  }

  return segments;
}
