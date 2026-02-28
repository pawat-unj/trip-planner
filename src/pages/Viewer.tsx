import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { TripData, RoadTripData, BackpackingData, DayHikeData } from '../types';
import { fetchTripFromGist, extractGistIdFromUrl, validateTripData } from '../utils/gist';
import { Card, Button } from '../components/ui';
import { TripMap, ElevationProfile } from '../components/maps';
import {
  TripHeader,
  TripOverviewSection,
  PackingListSection,
  ItinerarySection,
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

  useEffect(() => {
    const loadTrip = async () => {
      if (!gistParam) {
        setState('error');
        setError('No trip specified. Please provide a gist ID in the URL.');
        return;
      }

      // Demo mode: load local demo-trip.json
      if (gistParam === 'demo') {
        try {
          setState('loading');
          const res = await fetch('/trip-planner/demo-trip.json');
          const data = await res.json();
          if (!validateTripData(data)) throw new Error('Invalid demo data.');
          setTripData(data);
          setState('success');
        } catch (err) {
          setState('error');
          setError(err instanceof Error ? err.message : 'Failed to load demo.');
        }
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

  if (state === 'loading') return <LoadingState />;
  if (state === 'error')   return <ErrorState message={error} />;
  if (!tripData)           return <ErrorState message="Failed to load trip data." />;

  const trailStats = (tripData.templateData as BackpackingData | DayHikeData)?.trailStats;
  const hasElevation = !!trailStats?.elevationProfile?.length;
  const isRoadTrip = tripData.meta.template === 'roadtrip';
  const hasMap = tripData.mapData &&
    (tripData.mapData.routes.length > 0 || tripData.mapData.markers.length > 0);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors"
        >
          ← Back to Editor
        </Link>

        {/* Trip Header (dark hero + stats row) */}
        <TripHeader trip={tripData} />

        {/* ── Main 2-column grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Overview + Itinerary */}
          <div className="lg:col-span-2 space-y-6">

            {/* Trip Overview: highlights + important info combined */}
            {(tripData.shared.highlights.length > 0 || tripData.shared.importantInfo.length > 0) && (
              <TripOverviewSection
                highlights={tripData.shared.highlights}
                importantInfo={tripData.shared.importantInfo}
              />
            )}

            {/* Itinerary with weather integrated per day */}
            {tripData.itinerary.length > 0 && (
              <ItinerarySection
                itinerary={tripData.itinerary}
                weather={tripData.shared.weather}
              />
            )}

            {/* Transportation (Road Trip only) */}
            {isRoadTrip && (tripData.templateData as RoadTripData).transportation && (
              <TransportationSection
                transportation={(tripData.templateData as RoadTripData).transportation}
              />
            )}
          </div>

          {/* Right — Map + Packing + Carpool + Photos */}
          <div className="space-y-6">

            {/* Interactive Map */}
            {hasMap && (
              <Card padding="none">
                <TripMap
                  mapData={tripData.mapData}
                  height="280px"
                  showDayTabs={true}
                  onDayChange={() => {}}
                />
              </Card>
            )}

            {/* Elevation Profile */}
            {hasElevation && (
              <Card>
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
                  Elevation Profile
                </p>
                <ElevationProfile
                  data={trailStats!.elevationProfile}
                  unit="imperial"
                  height={150}
                />
              </Card>
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
            <Link to="/" className="text-accent-rust hover:underline">
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
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-accent-rust border-t-transparent mb-4" />
        <p className="text-sm text-text-secondary">Loading trip…</p>
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
