import type { TripData, BackpackingData, DayHikeData, RoadTripData } from '../../types';
import { DifficultyBadge, TerrainBadge } from '../ui';
import { formatDistance, formatElevation } from '../../utils/gpx';

interface TripHeaderProps {
  trip: TripData;
}

export function TripHeader({ trip }: TripHeaderProps) {
  const { meta, templateData } = trip;

  // Format date range
  const formatDateRange = () => {
    const start = new Date(meta.dates.start);
    const end = new Date(meta.dates.end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    }
    if (start.getMonth() !== end.getMonth()) {
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    }
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
  };

  // Get template icon
  const templateIcons = {
    backpacking: '🎒',
    roadtrip: '🚗',
    dayhike: '🥾',
  };

  // Render stats based on template type
  const renderStats = () => {
    const stats = [];

    if (meta.template === 'backpacking' || meta.template === 'dayhike') {
      const data = templateData as BackpackingData | DayHikeData;

      // Difficulty
      stats.push(
        <StatItem key="difficulty" label="Difficulty">
          <DifficultyBadge difficulty={data.difficulty} />
        </StatItem>
      );

      // Distance
      stats.push(
        <StatItem key="distance" label="Distance">
          <span className="text-xl font-semibold text-text-primary">
            {formatDistance(data.distance, data.distanceUnit === 'km' ? 'km' : 'miles')}
          </span>
        </StatItem>
      );

      // Elevation (if available)
      if (data.trailStats) {
        stats.push(
          <StatItem key="elevation" label="Elevation Gain">
            <span className="text-xl font-semibold text-text-primary">
              {formatElevation(data.trailStats.elevationGain, 'feet')}
            </span>
          </StatItem>
        );
      }

      // Days (backpacking only)
      if (meta.template === 'backpacking') {
        const bpData = data as BackpackingData;
        stats.push(
          <StatItem key="days" label="Duration">
            <span className="text-xl font-semibold text-text-primary">
              {bpData.days} {bpData.days === 1 ? 'day' : 'days'}
            </span>
          </StatItem>
        );
      }

      // Terrain
      if (data.terrain.length > 0) {
        stats.push(
          <StatItem key="terrain" label="Terrain">
            <div className="flex flex-wrap gap-1">
              {data.terrain.map((t) => (
                <TerrainBadge key={t} terrain={t} size="sm" />
              ))}
            </div>
          </StatItem>
        );
      }
    }

    if (meta.template === 'roadtrip') {
      const data = templateData as RoadTripData;

      // Days
      stats.push(
        <StatItem key="days" label="Duration">
          <span className="text-xl font-semibold text-text-primary">
            {data.days} {data.days === 1 ? 'day' : 'days'}
          </span>
        </StatItem>
      );

      // Total miles
      if (data.totalMiles) {
        stats.push(
          <StatItem key="miles" label="Total Distance">
            <span className="text-xl font-semibold text-text-primary">
              {data.totalMiles.toLocaleString()} mi
            </span>
          </StatItem>
        );
      }

      // Stops count
      const stopsCount = trip.itinerary.reduce((acc, day) => acc + day.activities.length, 0);
      stats.push(
        <StatItem key="stops" label="Stops">
          <span className="text-xl font-semibold text-text-primary">
            {stopsCount}
          </span>
        </StatItem>
      );
    }

    return stats;
  };

  return (
    <div className="mb-8">
      {/* Cover image */}
      {meta.coverImage && (
        <div className="relative h-48 md:h-64 -mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-6 overflow-hidden rounded-b-2xl">
          <img
            src={meta.coverImage}
            alt={meta.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Template badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{templateIcons[meta.template]}</span>
        <span className="text-sm font-medium text-text-secondary uppercase tracking-wide">
          {meta.template.replace('trip', ' Trip')}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
        {meta.title}
      </h1>

      {/* Subtitle */}
      {meta.subtitle && (
        <p className="text-lg text-text-secondary mb-4">
          {meta.subtitle}
        </p>
      )}

      {/* Date and location */}
      <div className="flex flex-wrap items-center gap-4 text-text-secondary mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDateRange()}</span>
        </div>
        {meta.location && (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{meta.location}</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {renderStats()}
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  children: React.ReactNode;
}

function StatItem({ label, children }: StatItemProps) {
  return (
    <div className="bg-bg-secondary rounded-xl p-4">
      <div className="text-xs text-text-muted uppercase tracking-wide mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
