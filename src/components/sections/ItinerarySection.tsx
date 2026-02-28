import type { ItineraryDay, WeatherForecast } from '../../types';
import { ListIcon, ClockIcon, MapPinIcon, HomeIcon, TentIcon, UtensilsIcon,
  SunIcon, CloudIcon, CloudRainIcon, SnowflakeIcon, WindIcon, StormIcon } from '../ui/Icon';

interface ItinerarySectionProps {
  itinerary: ItineraryDay[];
  weather?: WeatherForecast[];
}

// ── Weather helpers ───────────────────────────────────────────────────────────

type WeatherCondition = WeatherForecast['condition'];

const weatherConfig: Record<WeatherCondition, {
  Icon: React.FC<{ className?: string }>;
  pillBg: string;
  pillText: string;
  pillBorder: string;
}> = {
  sunny:  { Icon: SunIcon,       pillBg: 'bg-amber-50',   pillText: 'text-amber-700',  pillBorder: 'border-amber-200' },
  cloudy: { Icon: CloudIcon,     pillBg: 'bg-gray-50',    pillText: 'text-gray-600',   pillBorder: 'border-gray-200' },
  rainy:  { Icon: CloudRainIcon, pillBg: 'bg-blue-50',    pillText: 'text-blue-600',   pillBorder: 'border-blue-200' },
  snowy:  { Icon: SnowflakeIcon, pillBg: 'bg-sky-50',     pillText: 'text-sky-600',    pillBorder: 'border-sky-200' },
  windy:  { Icon: WindIcon,      pillBg: 'bg-teal-50',    pillText: 'text-teal-600',   pillBorder: 'border-teal-200' },
  stormy: { Icon: StormIcon,     pillBg: 'bg-purple-50',  pillText: 'text-purple-700', pillBorder: 'border-purple-200' },
};

function WeatherPill({ forecast }: { forecast: WeatherForecast }) {
  const cfg = weatherConfig[forecast.condition];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium flex-shrink-0
      ${cfg.pillBg} ${cfg.pillText} ${cfg.pillBorder}`}>
      <cfg.Icon className="w-3 h-3" />
      {forecast.high}° / {forecast.low}°
    </span>
  );
}

// ── Accommodation icon ────────────────────────────────────────────────────────

function AccomIcon({ type }: { type: string }) {
  if (type === 'tent') return <TentIcon className="w-3.5 h-3.5" />;
  return <HomeIcon className="w-3.5 h-3.5" />;
}

// ── Main component ────────────────────────────────────────────────────────────

export function ItinerarySection({ itinerary, weather }: ItinerarySectionProps) {
  if (itinerary.length === 0) return null;

  // Index weather by date string for O(1) lookup
  const weatherByDate: Record<string, WeatherForecast> = {};
  weather?.forEach((w) => { weatherByDate[w.date] = w; });

  return (
    <div className="bg-bg-card rounded-xl card-shadow overflow-hidden">
      {/* Card header */}
      <div className="px-5 md:px-6 py-4 border-b border-border-light flex items-center gap-2">
        <ListIcon className="w-4 h-4 text-accent-rust" />
        <h3 className="font-serif font-semibold text-text-primary"
          style={{ fontFamily: 'var(--font-family-serif)' }}>
          Trip Itinerary
        </h3>
        <span className="text-xs text-text-muted ml-1">
          — {itinerary.length} {itinerary.length === 1 ? 'day' : 'days'}
        </span>
      </div>

      {/* Days */}
      <div className="divide-y divide-border-light">
        {itinerary.map((day) => {
          const dayWeather = day.date ? weatherByDate[day.date] : undefined;
          return <DayCard key={day.day} day={day} weather={dayWeather} />;
        })}
      </div>
    </div>
  );
}

// ── DayCard ───────────────────────────────────────────────────────────────────

function DayCard({ day, weather }: { day: ItineraryDay; weather?: WeatherForecast }) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'long', day: 'numeric',
    });
  };

  return (
    <div className="px-5 md:px-6 py-5">
      {/* Day header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          {/* Number circle */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: '#1A1208', fontFamily: 'var(--font-family-serif)' }}>
            {day.day}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-text-primary leading-snug"
              style={{ fontFamily: 'var(--font-family-serif)' }}>
              {day.title}
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
              {day.date && (
                <span className="text-xs text-text-muted">{formatDate(day.date)}</span>
              )}
              {day.distance && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" /> {day.distance.toFixed(1)} mi
                </span>
              )}
              {day.elevationGain && (
                <span className="text-xs text-text-muted">↑ {day.elevationGain.toLocaleString()} ft</span>
              )}
            </div>
            {day.description && (
              <p className="text-sm text-text-secondary mt-1.5">{day.description}</p>
            )}
          </div>
        </div>

        {/* Weather pill */}
        {weather && <WeatherPill forecast={weather} />}
      </div>

      {/* Activities */}
      {day.activities.length > 0 && (
        <div className="ml-11 space-y-0">
          {day.activities.map((activity, i) => (
            <div key={i} className="flex gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center flex-shrink-0 mt-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-sage ring-2 ring-bg-card" />
                {i < day.activities.length - 1 && (
                  <div className="w-px flex-1 bg-border-light mt-1 min-h-[18px]" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 pb-3.5">
                {activity.time && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-accent-terracotta flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" /> {activity.time}
                  </span>
                )}
                <p className="text-sm font-medium text-text-primary mt-0.5">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{activity.description}</p>
                )}
                {activity.location && (
                  <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3" /> {activity.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accommodation + Meals */}
      {(day.accommodation || day.meals) && (
        <div className="ml-11 mt-1 flex flex-col sm:flex-row gap-2.5">
          {day.accommodation && (
            <div className="flex-1 flex items-start gap-2 px-3 py-2.5 bg-bg-secondary rounded-lg text-sm">
              <AccomIcon type={day.accommodation.type} />
              <div className="min-w-0">
                <p className="font-medium text-text-primary text-xs leading-snug">{day.accommodation.name}</p>
                {day.accommodation.location && (
                  <p className="text-xs text-text-muted mt-0.5">{day.accommodation.location}</p>
                )}
                {day.accommodation.notes && (
                  <p className="text-xs text-text-muted mt-0.5">{day.accommodation.notes}</p>
                )}
              </div>
            </div>
          )}

          {day.meals && (day.meals.breakfast || day.meals.lunch || day.meals.dinner) && (
            <div className="flex-1 flex items-start gap-2 px-3 py-2.5 bg-bg-secondary rounded-lg text-sm">
              <UtensilsIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-text-muted" />
              <div className="space-y-0.5">
                {day.meals.breakfast && (
                  <p className="text-xs text-text-secondary">
                    <span className="text-text-muted">B:</span> {day.meals.breakfast}
                  </p>
                )}
                {day.meals.lunch && (
                  <p className="text-xs text-text-secondary">
                    <span className="text-text-muted">L:</span> {day.meals.lunch}
                  </p>
                )}
                {day.meals.dinner && (
                  <p className="text-xs text-text-secondary">
                    <span className="text-text-muted">D:</span> {day.meals.dinner}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
