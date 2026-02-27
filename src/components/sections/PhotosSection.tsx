import { Card, CardHeader, CardTitle, Button } from '../ui';

interface PhotosSectionProps {
  photoAlbum?: { url: string };
}

export function PhotosSection({ photoAlbum }: PhotosSectionProps) {
  if (!photoAlbum?.url) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <span>📸</span>
            Shared Photos
          </span>
        </CardTitle>
      </CardHeader>
      <p className="text-text-secondary mb-4">
        Share your photos from the trip in our shared album!
      </p>
      <a href={photoAlbum.url} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" className="w-full md:w-auto">
          Open Photo Album
          <span className="ml-2">↗</span>
        </Button>
      </a>
    </Card>
  );
}
