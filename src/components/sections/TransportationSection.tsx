import type { TransportationLeg } from '../../types';
import { Card, CardHeader, CardTitle } from '../ui';

interface TransportationSectionProps {
  transportation: TransportationLeg[];
}

const transportIcons: Record<TransportationLeg['type'], string> = {
  flight: '✈️',
  car: '🚗',
  train: '🚂',
  bus: '🚌',
  ferry: '⛴️',
  other: '🚀',
};

export function TransportationSection({ transportation }: TransportationSectionProps) {
  if (!transportation || transportation.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <span>🚀</span>
            Transportation
          </span>
        </CardTitle>
      </CardHeader>
      <div className="space-y-4">
        {transportation.map((leg) => (
          <div
            key={leg.id}
            className="flex items-start gap-4 p-4 bg-bg-secondary rounded-xl"
          >
            {/* Icon */}
            <div className="text-2xl">{transportIcons[leg.type]}</div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
                {leg.date && (
                  <span>
                    {new Date(leg.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {leg.time && (
                  <>
                    <span>•</span>
                    <span>{leg.time}</span>
                  </>
                )}
                {leg.duration && (
                  <>
                    <span>•</span>
                    <span>{leg.duration}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary">{leg.from}</span>
                <span className="text-text-muted">→</span>
                <span className="font-medium text-text-primary">{leg.to}</span>
              </div>

              {leg.confirmationNumber && (
                <p className="text-sm text-text-muted mt-2">
                  Confirmation: <span className="font-mono">{leg.confirmationNumber}</span>
                </p>
              )}

              {leg.notes && (
                <p className="text-sm text-text-secondary mt-2">{leg.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
