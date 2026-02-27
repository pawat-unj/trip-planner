import type { CarpoolArrangement } from '../../types';
import { Card, CardHeader, CardTitle, Button } from '../ui';

interface CarpoolSectionProps {
  carpool?: CarpoolArrangement;
}

export function CarpoolSection({ carpool }: CarpoolSectionProps) {
  if (!carpool) return null;

  // Link type - show button to external sheet
  if (carpool.type === 'link' && carpool.url) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <span>🚗</span>
              Carpooling
            </span>
          </CardTitle>
        </CardHeader>
        <p className="text-text-secondary mb-4">
          View and sign up for carpooling arrangements in our shared spreadsheet.
        </p>
        <a href={carpool.url} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full md:w-auto">
            Open Carpool Sheet
            <span className="ml-2">↗</span>
          </Button>
        </a>
      </Card>
    );
  }

  // Embedded type - show carpool data directly
  if (carpool.type === 'embedded' && carpool.data && carpool.data.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <span>🚗</span>
              Carpooling
            </span>
          </CardTitle>
        </CardHeader>
        <div className="space-y-4">
          {carpool.data.map((car, index) => (
            <div
              key={index}
              className="p-4 bg-bg-secondary rounded-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium text-text-primary">{car.driver}</span>
                  {car.vehicle && (
                    <span className="text-text-secondary ml-2">({car.vehicle})</span>
                  )}
                </div>
                <span className="text-sm text-text-muted">
                  {car.passengers.length}/{car.seats} seats
                </span>
              </div>
              {/* Departure info */}
              {(car.departureTime || car.departureLocation) && (
                <div className="text-sm text-text-secondary mb-3">
                  {car.departureTime && <span>🕐 {car.departureTime}</span>}
                  {car.departureLocation && (
                    <span className="ml-4">📍 {car.departureLocation}</span>
                  )}
                </div>
              )}
              {/* Passengers */}
              <div className="flex flex-wrap gap-2">
                {car.passengers.map((passenger, pIndex) => (
                  <span
                    key={pIndex}
                    className="px-3 py-1 bg-accent-sage/15 text-accent-forest rounded-full text-sm"
                  >
                    {passenger}
                  </span>
                ))}
                {car.passengers.length < car.seats && (
                  <span className="px-3 py-1 bg-bg-card border border-dashed border-border rounded-full text-sm text-text-muted">
                    + {car.seats - car.passengers.length} available
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return null;
}
