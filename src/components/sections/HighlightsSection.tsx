import { Card, CardHeader, CardTitle } from '../ui';

interface HighlightsSectionProps {
  highlights: string[];
}

export function HighlightsSection({ highlights }: HighlightsSectionProps) {
  if (highlights.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <span>✨</span>
            Trip Highlights
          </span>
        </CardTitle>
      </CardHeader>
      <ul className="space-y-3">
        {highlights.map((highlight, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-sage/15 text-accent-forest flex items-center justify-center text-sm font-medium">
              {index + 1}
            </span>
            <span className="text-text-primary">{highlight}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
