import { useState } from 'react';
import type { ItineraryDay } from '../../types';
import { Card, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent } from '../ui';

interface ItinerarySectionProps {
  itinerary: ItineraryDay[];
  onDaySelect?: (day: number) => void;
}

export function ItinerarySection({ itinerary, onDaySelect }: ItinerarySectionProps) {
  const [selectedDay, setSelectedDay] = useState(itinerary[0]?.day.toString() || '1');

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    onDaySelect?.(parseInt(day, 10));
  };

  if (itinerary.length === 0) return null;

  return (
    <Card padding="none">
      <div className="p-4 md:p-5">
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <span>📅</span>
              Itinerary
            </span>
          </CardTitle>
        </CardHeader>
      </div>

      <Tabs defaultValue={selectedDay} onChange={handleDayChange}>
        <div className="px-4 md:px-5 pb-2 overflow-x-auto">
          <TabsList>
            {itinerary.map((day) => (
              <TabsTrigger key={day.day} value={day.day.toString()}>
                Day {day.day}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {itinerary.map((day) => (
          <TabsContent key={day.day} value={day.day.toString()} className="mt-0">
            <DayContent day={day} />
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}

interface DayContentProps {
  day: ItineraryDay;
}

function DayContent({ day }: DayContentProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="border-t border-border-light">
      {/* Day header */}
      <div className="px-4 md:px-5 py-4 bg-bg-secondary/50">
        <h3 className="text-lg font-semibold text-text-primary">{day.title}</h3>
        {day.date && (
          <p className="text-sm text-text-secondary mt-1">{formatDate(day.date)}</p>
        )}
        {day.description && (
          <p className="text-text-secondary mt-2">{day.description}</p>
        )}
        {/* Day stats */}
        {(day.distance || day.elevationGain) && (
          <div className="flex gap-4 mt-3 text-sm">
            {day.distance && (
              <span className="text-text-secondary">
                📏 {day.distance.toFixed(1)} mi
              </span>
            )}
            {day.elevationGain && (
              <span className="text-text-secondary">
                ⬆️ {day.elevationGain.toLocaleString()} ft
              </span>
            )}
          </div>
        )}
      </div>

      {/* Activities */}
      <div className="px-4 md:px-5 py-4">
        <div className="space-y-4">
          {day.activities.map((activity, index) => (
            <div key={index} className="flex gap-4">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-accent-sage" />
                {index < day.activities.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border-light mt-1" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 pb-4">
                {activity.time && (
                  <span className="text-xs font-medium text-accent-terracotta">
                    {activity.time}
                  </span>
                )}
                <h4 className="font-medium text-text-primary">{activity.title}</h4>
                {activity.description && (
                  <p className="text-sm text-text-secondary mt-1">
                    {activity.description}
                  </p>
                )}
                {activity.location && (
                  <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                    <span>📍</span> {activity.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Accommodation */}
        {day.accommodation && (
          <div className="mt-6 p-4 bg-accent-blue/10 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span>🏨</span>
              <span className="font-medium text-text-primary">
                {day.accommodation.name}
              </span>
            </div>
            {day.accommodation.location && (
              <p className="text-sm text-text-secondary">
                📍 {day.accommodation.location}
              </p>
            )}
            {day.accommodation.notes && (
              <p className="text-sm text-text-muted mt-2">
                {day.accommodation.notes}
              </p>
            )}
          </div>
        )}

        {/* Meals */}
        {day.meals && (
          <div className="mt-4 flex flex-wrap gap-3">
            {day.meals.breakfast && (
              <MealBadge emoji="🌅" label="Breakfast" value={day.meals.breakfast} />
            )}
            {day.meals.lunch && (
              <MealBadge emoji="☀️" label="Lunch" value={day.meals.lunch} />
            )}
            {day.meals.dinner && (
              <MealBadge emoji="🌙" label="Dinner" value={day.meals.dinner} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface MealBadgeProps {
  emoji: string;
  label: string;
  value: string;
}

function MealBadge({ emoji, label, value }: MealBadgeProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg text-sm">
      <span>{emoji}</span>
      <span className="text-text-muted">{label}:</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
