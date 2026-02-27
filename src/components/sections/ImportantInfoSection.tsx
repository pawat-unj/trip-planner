import { Card, CardHeader, CardTitle } from '../ui';

interface ImportantInfoSectionProps {
  info: string[];
}

export function ImportantInfoSection({ info }: ImportantInfoSectionProps) {
  if (info.length === 0) return null;

  return (
    <Card className="border-l-4 border-accent-terracotta">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <span>⚠️</span>
            Important Information
          </span>
        </CardTitle>
      </CardHeader>
      <ul className="space-y-3">
        {info.map((item, index) => (
          <li key={index} className="flex items-start gap-3 text-text-primary">
            <span className="flex-shrink-0 text-accent-terracotta">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
