import { Button } from '../ui';
import { CameraIcon } from '../ui/Icon';

interface PhotosSectionProps {
  photoAlbum?: { url: string };
}

export function PhotosSection({ photoAlbum }: PhotosSectionProps) {
  if (!photoAlbum?.url) return null;

  return (
    <div className="bg-bg-card rounded-xl card-shadow p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <CameraIcon className="w-4 h-4 text-accent-rust" />
        <h3 className="font-serif font-semibold text-text-primary"
          style={{ fontFamily: 'var(--font-family-serif)' }}>
          Shared Photos
        </h3>
      </div>
      <p className="text-sm text-text-secondary mb-4">
        Share your photos from the trip in our shared album!
      </p>
      <a href={photoAlbum.url} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="w-full">
          Open Photo Album ↗
        </Button>
      </a>
    </div>
  );
}
