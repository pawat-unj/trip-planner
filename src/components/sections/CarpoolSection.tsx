import type { CarpoolArrangement } from '../../types';
import { Button } from '../ui';
import { UsersIcon, MapPinIcon, ClockIcon } from '../ui/Icon';

interface CarpoolSectionProps {
  carpool?: CarpoolArrangement;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <UsersIcon className="w-4 h-4 text-accent-rust" />
      <h3 className="font-serif font-semibold text-text-primary"
        style={{ fontFamily: 'var(--font-family-serif)' }}>
        {title}
      </h3>
    </div>
  );
}

export function CarpoolSection({ carpool }: CarpoolSectionProps) {
  if (!carpool) return null;

  if (carpool.type === 'link' && carpool.url) {
    return (
      <div className="bg-bg-card rounded-xl card-shadow p-5 md:p-6">
        <SectionHeader title="Carpooling" />
        <p className="text-sm text-text-secondary mb-4">
          View and sign up for carpooling arrangements in our shared spreadsheet.
        </p>
        <a href={carpool.url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full">
            Open Carpool Sheet ↗
          </Button>
        </a>
      </div>
    );
  }

  if (carpool.type === 'embedded' && carpool.data && carpool.data.length > 0) {
    return (
      <div className="bg-bg-card rounded-xl card-shadow p-5 md:p-6">
        <SectionHeader title="Carpooling" />
        <div className="space-y-3">
          {carpool.data.map((car, index) => (
            <div key={index} className="p-3 bg-bg-secondary rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-sm text-text-primary">{car.driver}</span>
                  {car.vehicle && (
                    <span className="text-xs text-text-secondary ml-2">({car.vehicle})</span>
                  )}
                </div>
                <span className="text-xs text-text-muted">
                  {car.passengers.length}/{car.seats} seats
                </span>
              </div>
              {(car.departureTime || car.departureLocation) && (
                <div className="flex flex-wrap gap-3 text-xs text-text-secondary mb-2">
                  {car.departureTime && (
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" /> {car.departureTime}
                    </span>
                  )}
                  {car.departureLocation && (
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" /> {car.departureLocation}
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {car.passengers.map((p, pi) => (
                  <span key={pi} className="px-2.5 py-0.5 bg-accent-sage/15 text-accent-forest rounded-full text-xs">
                    {p}
                  </span>
                ))}
                {car.passengers.length < car.seats && (
                  <span className="px-2.5 py-0.5 bg-bg-card border border-dashed border-border rounded-full text-xs text-text-muted">
                    +{car.seats - car.passengers.length} available
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
