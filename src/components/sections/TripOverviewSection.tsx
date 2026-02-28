import { CompassIcon, AlertIcon } from '../ui/Icon';

interface TripOverviewSectionProps {
  highlights: string[];
  importantInfo: string[];
}

export function TripOverviewSection({ highlights, importantInfo }: TripOverviewSectionProps) {
  const highlightsText = highlights.join('\n\n').trim();
  const importantInfoText = importantInfo.join('\n\n').trim();
  if (!highlightsText && !importantInfoText) return null;

  return (
    <div className="bg-bg-card rounded-xl card-shadow p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <CompassIcon className="w-4 h-4 text-accent-rust" />
        <h3 className="font-serif text-lg font-semibold text-text-primary"
          style={{ fontFamily: 'var(--font-family-serif)' }}>
          Trip Overview
        </h3>
      </div>

      {/* Highlights */}
      {highlightsText && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
            Highlights
          </p>
          <p className="text-sm text-text-primary whitespace-pre-line leading-relaxed">{highlightsText}</p>
        </div>
      )}

      {/* Important Info */}
      {importantInfoText && (
        <div className={highlightsText ? 'mt-5 pt-5 border-t border-border-light' : ''}>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
            Important Information
          </p>
          <div className="rounded-lg border border-accent-terracotta/30 bg-accent-terracotta/5 p-3">
            <p className="text-sm text-text-primary whitespace-pre-line leading-relaxed flex items-start gap-2">
              <AlertIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-accent-rust" />
              <span>{importantInfoText}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
