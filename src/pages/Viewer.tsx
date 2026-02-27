import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { TripData, RoadTripData, BackpackingData, DayHikeData } from '../types';
import { fetchTripFromGist, extractGistIdFromUrl, validateTripData } from '../utils/gist';
import { Card, Button } from '../components/ui';
import { TripMap, ElevationProfile } from '../components/maps';
import {
  TripHeader,
  HighlightsSection,
  WeatherSection,
  PackingListSection,
  ItinerarySection,
  ImportantInfoSection,
  CarpoolSection,
  PhotosSection,
  TransportationSection,
} from '../components/sections';

type ViewerState = 'loading' | 'error' | 'success';

export function Viewer() {
  const [searchParams] = useSearchParams();
  const gistParam = searchParams.get('gist');

  const [state, setState] = useState<ViewerState>('loading');
  const [error, setError] = useState<string>('');
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [, setSelectedDay] = useState<number | 'all'>('all');

  useEffect(() => {
    const loadTrip = async () => {
      if (!gistParam) {
        setState('error');
        setError('No trip specified. Please provide a gist ID in the URL.');
        return;
      }

      const gistId = extractGistIdFromUrl(gistParam);
      if (!gistId) {
        setState('error');
        setError('Invalid gist ID. Please check the URL.');
        return;
      }

      try {
        setState('loading');
        const data = await fetchTripFromGist(gistId);

        if (!validateTripData(data)) {
          throw new Error('Invalid trip data format.');
        }

        setTripData(data);
        setState('success');
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Failed to load trip.');
      }
    };

    loadTrip();
  }, [gistParam]);

  if (state === 'loading') {
    return <LoadingState />;
  }

  if (state === 'error') {
    return <ErrorState message={error} />;
  }

  if (!tripData) {
    return <ErrorState message="Failed to load trip data." />;
  }

  const trailStats = (tripData.templateData as BackpackingData | DayHikeData)?.trailStats;
  const hasElevation = trailStats?.elevationProfile && trailStats.elevationProfile.length > 0;
  const isRoadTrip = tripData.meta.template === 'roadtrip';

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"
        >
          ← Back to Editor
        </Link>

        {/* Trip Header */}
        <TripHeader trip={tripData} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            {tripData.mapData && (tripData.mapData.routes.length > 0 || tripData.mapData.markers.length > 0) && (
              <Card>
                <TripMap
                  mapData={tripData.mapData}
                  height="400px"
                  showDayTabs={true}
                  onDayChange={setSelectedDay}
                />
              </Card>
            )}

            {/* Elevation Profile (for hiking templates) */}
            {hasElevation && (
              <Card>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <span>📈</span>
                    Elevation Profile
                  </h3>
                </div>
                <ElevationProfile
                  data={trailStats.elevationProfile}
                  unit="imperial"
                  height={200}
                />
              </Card>
            )}

            {/* Itinerary */}
            {tripData.itinerary.length > 0 && (
              <ItinerarySection
                itinerary={tripData.itinerary}
                onDaySelect={(day) => setSelectedDay(day)}
              />
            )}

            {/* Transportation (Road Trip only) */}
            {isRoadTrip && (tripData.templateData as RoadTripData).transportation && (
              <TransportationSection
                transportation={(tripData.templateData as RoadTripData).transportation}
              />
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Highlights */}
            {tripData.shared.highlights.length > 0 && (
              <HighlightsSection highlights={tripData.shared.highlights} />
            )}

            {/* Weather */}
            {tripData.shared.weather && tripData.shared.weather.length > 0 && (
              <WeatherSection weather={tripData.shared.weather} />
            )}

            {/* Important Info */}
            {tripData.shared.importantInfo.length > 0 && (
              <ImportantInfoSection info={tripData.shared.importantInfo} />
            )}

            {/* Packing List */}
            {tripData.shared.packingList.length > 0 && (
              <PackingListSection items={tripData.shared.packingList} />
            )}

            {/* Carpool */}
            {tripData.shared.carpooling && (
              <CarpoolSection carpool={tripData.shared.carpooling} />
            )}

            {/* Photos */}
            {tripData.shared.photoAlbum && (
              <PhotosSection photoAlbum={tripData.shared.photoAlbum} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-text-muted">
          <p>
            Created with{' '}
            <Link to="/" className="text-accent-sage hover:underline">
              Trip Planner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent-sage border-t-transparent mb-4" />
        <p className="text-text-secondary">Loading trip...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <div className="text-4xl mb-4">😕</div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">
          Unable to Load Trip
        </h2>
        <p className="text-text-secondary mb-6">{message}</p>
        <Link to="/">
          <Button>Create a New Trip</Button>
        </Link>
      </Card>
    </div>
  );
}
