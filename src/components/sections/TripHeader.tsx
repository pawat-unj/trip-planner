import type { TripData, BackpackingData, DayHikeData, RoadTripData } from '../../types';
import {
  BackpackIcon, CarIcon, HikerIcon,
  CalendarIcon, MapPinIcon, RouteIcon, TrendingUpIcon,
  MountainIcon, TreeIcon, WavesIcon, DesertIcon, VolcanoIcon,
  ActivityIcon,
} from '../ui/Icon';
import { formatDistance, formatElevation } from '../../utils/gpx';

interface TripHeaderProps {
  trip: TripData;
}

// ── Terrain config ────────────────────────────────────────────────────────────

type Terrain = 'mountain' | 'coast' | 'forest' | 'desert' | 'volcano' | 'mixed';

const terrainConfig: Record<Terrain, { label: string; Icon: React.FC<{ className?: string }> }> = {
  mountain: { label: 'Mountain', Icon: MountainIcon },
  coast:    { label: 'Coast',    Icon: WavesIcon },
  forest:   { label: 'Forest',   Icon: TreeIcon },
  desert:   { label: 'Desert',   Icon: DesertIcon },
  volcano:  { label: 'Volcano',  Icon: VolcanoIcon },
  mixed:    { label: 'Mixed',    Icon: ActivityIcon },
};

// ── Template config ───────────────────────────────────────────────────────────

const templateConfig = {
  backpacking: { label: 'Backpacking Trip', Icon: BackpackIcon },
  roadtrip:    { label: 'Road Trip',        Icon: CarIcon },
  dayhike:     { label: 'Day Hike',         Icon: HikerIcon },
};

// ── Main component ────────────────────────────────────────────────────────────

export function TripHeader({ trip }: TripHeaderProps) {
  const { meta, templateData } = trip;
  const template = templateConfig[meta.template];

  // Date range
  const formatDateRange = () => {
    const start = new Date(meta.dates.start);
    const end = new Date(meta.dates.end);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { ...opts, year: 'numeric' })} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
    }
    if (start.getMonth() !== end.getMonth()) {
      return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
    }
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.getDate()}, ${end.getFullYear()}`;
  };

  // Terrain tags (backpacking / dayhike only)
  const terrain: Terrain[] = (meta.template !== 'roadtrip')
    ? (templateData as BackpackingData | DayHikeData).terrain as Terrain[]
    : [];

  // Stats
  const stats = buildStats(meta.template, templateData, trip);

  return (
    <div className="mb-8">
      {/* ── Dark hero card ─────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden mb-5" style={{ background: '#1A1208' }}>
        {/* Cover image as subtle overlay */}
        {meta.coverImage && (
          <>
            <img
              src={meta.coverImage}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(26,18,8,0.92) 40%, rgba(26,18,8,0.70) 100%)' }} />
          </>
        )}

        <div className="relative px-6 py-7 md:px-8 md:py-9">
          {/* Badge row: template + terrain */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Template pill */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium"
              style={{ borderColor: 'rgba(193,127,89,0.7)', color: '#d4a574' }}>
              <template.Icon className="w-3.5 h-3.5" />
              {template.label}
            </span>

            {/* Terrain pills */}
            {terrain.map((t) => {
              const tc = terrainConfig[t];
              if (!tc) return null;
              return (
                <span key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.65)' }}>
                  <tc.Icon className="w-3.5 h-3.5" />
                  {tc.label}
                </span>
              );
            })}
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl md:text-4xl font-semibold leading-tight mb-2"
            style={{ color: '#F8F3EC', fontFamily: 'var(--font-family-serif)' }}>
            {meta.title}
          </h1>

          {/* Date + Location row */}
          <div className="flex flex-wrap items-center gap-5 text-sm" style={{ color: 'rgba(248,243,236,0.65)' }}>
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              {formatDateRange()}
            </span>
            {meta.location && (
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="w-3.5 h-3.5" />
                {meta.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      {stats.length > 0 && (
        <div className={`grid gap-3 ${stats.length <= 4 ? `grid-cols-2 md:grid-cols-${stats.length}` : 'grid-cols-2 md:grid-cols-4'}`}>
          {stats.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 flex items-start gap-3 card-shadow">
      <div className="mt-0.5 text-accent-rust opacity-80">{icon}</div>
      <div>
        <div className="text-xs text-text-muted uppercase tracking-widest mb-0.5">{label}</div>
        <div className="font-semibold text-text-primary text-base leading-snug">{value}</div>
      </div>
    </div>
  );
}

// ── Build stats list ──────────────────────────────────────────────────────────

function buildStats(
  template: TripData['meta']['template'],
  templateData: TripData['templateData'],
  trip: TripData,
) {
  const stats: { label: string; value: React.ReactNode; icon: React.ReactNode }[] = [];

  if (template === 'backpacking' || template === 'dayhike') {
    const data = templateData as BackpackingData | DayHikeData;

    stats.push({
      label: 'Difficulty',
      value: <DifficultyLabel difficulty={data.difficulty} />,
      icon: <ActivityIcon className="w-4 h-4" />,
    });

    stats.push({
      label: 'Distance',
      value: formatDistance(data.distance, data.distanceUnit === 'km' ? 'km' : 'miles'),
      icon: <RouteIcon className="w-4 h-4" />,
    });

    if (data.trailStats || data.elevationGain) {
      stats.push({
        label: 'Elevation',
        value: `+${formatElevation(data.trailStats?.elevationGain || data.elevationGain || 0, 'feet')}`,
        icon: <TrendingUpIcon className="w-4 h-4" />,
      });
    }

    if (template === 'backpacking') {
      stats.push({
        label: 'Duration',
        value: `${(data as BackpackingData).days} days`,
        icon: <CalendarIcon className="w-4 h-4" />,
      });
    }
  }

  if (template === 'roadtrip') {
    const data = templateData as RoadTripData;

    stats.push({
      label: 'Duration',
      value: `${data.days} days`,
      icon: <CalendarIcon className="w-4 h-4" />,
    });

    if (data.totalMiles) {
      stats.push({
        label: 'Total Distance',
        value: `${data.totalMiles.toLocaleString()} mi`,
        icon: <RouteIcon className="w-4 h-4" />,
      });
    }

    const stops = trip.itinerary.reduce((a, d) => a + d.activities.length, 0);
    stats.push({
      label: 'Stops',
      value: stops.toString(),
      icon: <MapPinIcon className="w-4 h-4" />,
    });
  }

  return stats;
}

// ── Difficulty label (text only, no badge) ────────────────────────────────────

const difficultyColors: Record<string, string> = {
  easy:     '#7eb8a8',
  moderate: '#d4a574',
  hard:     '#c17f59',
  expert:   '#9f5842',
};

function DifficultyLabel({ difficulty }: { difficulty: string }) {
  return (
    <span style={{ color: difficultyColors[difficulty] ?? '#636e72' }}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
}
