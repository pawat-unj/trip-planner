import type { WeatherForecast } from '../../types';
import { Card, CardHeader, CardTitle } from '../ui';

interface WeatherSectionProps {
  weather: WeatherForecast[];
}

const weatherIcons: Record<WeatherForecast['condition'], string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
  windy: '💨',
  stormy: '⛈️',
};

export function WeatherSection({ weather }: WeatherSectionProps) {
  if (!weather || weather.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <span>🌤️</span>
            Weather Forecast
          </span>
        </CardTitle>
      </CardHeader>
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {weather.map((day, index) => (
          <WeatherDay key={index} forecast={day} />
        ))}
      </div>
    </Card>
  );
}

interface WeatherDayProps {
  forecast: WeatherForecast;
}

function WeatherDay({ forecast }: WeatherDayProps) {
  const date = new Date(forecast.date);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dateNum = date.getDate();

  return (
    <div className="text-center p-3 bg-bg-secondary rounded-xl">
      <div className="text-xs text-text-muted uppercase">{dayName}</div>
      <div className="text-sm font-medium text-text-secondary mb-2">{dateNum}</div>
      <div className="text-3xl mb-2">{weatherIcons[forecast.condition]}</div>
      <div className="flex justify-center gap-1 text-sm">
        <span className="font-medium text-text-primary">{forecast.high}°</span>
        <span className="text-text-muted">/</span>
        <span className="text-text-secondary">{forecast.low}°</span>
      </div>
      {forecast.precipitation > 0 && (
        <div className="text-xs text-accent-blue mt-1">
          {forecast.precipitation}% 💧
        </div>
      )}
    </div>
  );
}
