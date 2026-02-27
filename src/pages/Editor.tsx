import { useState, useCallback } from 'react';
import type { TripData, TripTemplate, Difficulty, Terrain, GPXData, PackingItem, ItineraryDay } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, FileInput, Badge } from '../components/ui';
import { TripMap, ElevationProfile } from '../components/maps';
import { parseGPX, calculateTrailStats, getGPXBounds } from '../utils';

type EditorStep = 'template' | 'basics' | 'gpx' | 'itinerary' | 'details' | 'review';

const STEPS: EditorStep[] = ['template', 'basics', 'gpx', 'itinerary', 'details', 'review'];

const TERRAIN_OPTIONS: Terrain[] = ['mountain', 'coast', 'forest', 'desert', 'volcano', 'mixed'];
const DIFFICULTY_OPTIONS: Difficulty[] = ['easy', 'moderate', 'hard', 'expert'];

const DEFAULT_PACKING_ITEMS: Record<string, string[]> = {
  'Essentials': ['First aid kit', 'Headlamp', 'Map/GPS', 'Sun protection', 'Water bottles'],
  'Clothing': ['Rain jacket', 'Layers', 'Hiking boots', 'Hat', 'Gloves'],
  'Shelter': ['Tent', 'Sleeping bag', 'Sleeping pad', 'Pillow'],
  'Food': ['Meals', 'Snacks', 'Stove', 'Fuel', 'Utensils'],
};

export function Editor() {
  const [step, setStep] = useState<EditorStep>('template');
  const [tripData, setTripData] = useState<Partial<TripData>>({
    meta: {
      version: '1.0',
      template: 'backpacking',
      title: '',
      dates: { start: '', end: '' },
      createdAt: new Date().toISOString(),
    },
    shared: {
      highlights: [],
      packingList: [],
      importantInfo: [],
    },
    templateData: {
      difficulty: 'moderate',
      distance: 0,
      distanceUnit: 'miles',
      days: 1,
      terrain: ['mountain'],
    },
    itinerary: [],
    mapData: {
      center: [37.7749, -122.4194],
      zoom: 10,
      routes: [],
      markers: [],
    },
  });
  const [gpxData, setGpxData] = useState<GPXData | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const currentStepIndex = STEPS.indexOf(step);

  const updateMeta = (updates: Partial<TripData['meta']>) => {
    setTripData((prev) => ({
      ...prev,
      meta: { ...prev.meta!, ...updates },
    }));
  };

  const updateTemplateData = (updates: Partial<any>) => {
    setTripData((prev) => ({
      ...prev,
      templateData: { ...prev.templateData!, ...updates },
    }));
  };

  const updateShared = (updates: Partial<TripData['shared']>) => {
    setTripData((prev) => ({
      ...prev,
      shared: { ...prev.shared!, ...updates },
    }));
  };

  const handleGPXUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const gpxString = e.target?.result as string;
        const parsed = parseGPX(gpxString);
        const stats = calculateTrailStats(parsed);
        const bounds = getGPXBounds(parsed);

        setGpxData(parsed);

        // Update trip data with GPX info
        setTripData((prev) => ({
          ...prev,
          gpxData: parsed,
          templateData: {
            ...prev.templateData!,
            distance: stats.totalDistance,
            distanceUnit: 'km',
            trailStats: stats,
          },
          mapData: {
            center: bounds.center,
            zoom: 12,
            routes: parsed.tracks.map((track, i) => ({
              id: `track-${i}`,
              name: track.name || `Track ${i + 1}`,
              points: track.points.map((p) => ({ lat: p.lat, lon: p.lon, ele: p.ele })),
            })),
            markers: parsed.waypoints.map((wp, i) => ({
              id: `wp-${i}`,
              name: wp.name,
              description: wp.description,
              lat: wp.lat,
              lon: wp.lon,
              type: 'poi' as const,
            })),
          },
        }));
      } catch (err) {
        console.error('Failed to parse GPX:', err);
        alert('Failed to parse GPX file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, []);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Create the final trip data
      const finalTripData: TripData = {
        meta: tripData.meta!,
        shared: tripData.shared!,
        templateData: tripData.templateData!,
        itinerary: tripData.itinerary || [],
        mapData: tripData.mapData!,
        gpxData: gpxData || undefined,
      } as TripData;

      // For now, just generate JSON - user copies and creates gist manually
      const jsonStr = JSON.stringify(finalTripData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Download the JSON
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tripData.meta?.title?.toLowerCase().replace(/\s+/g, '-') || 'trip'}.json`;
      a.click();

      URL.revokeObjectURL(url);

      alert(
        'JSON file downloaded! To share your trip:\n\n' +
        '1. Go to gist.github.com\n' +
        '2. Create a new public gist with the JSON file\n' +
        '3. Copy the gist ID from the URL\n' +
        '4. Share: ' + window.location.origin + window.location.pathname + '#/view?gist=YOUR_GIST_ID'
      );
    } catch (err) {
      console.error('Failed to publish:', err);
      alert('Failed to export trip. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'template':
        return <TemplateStep tripData={tripData} updateMeta={updateMeta} />;
      case 'basics':
        return <BasicsStep tripData={tripData} updateMeta={updateMeta} updateTemplateData={updateTemplateData} />;
      case 'gpx':
        return <GPXStep tripData={tripData} gpxData={gpxData} onGPXUpload={handleGPXUpload} />;
      case 'itinerary':
        return <ItineraryStep tripData={tripData} setTripData={setTripData} />;
      case 'details':
        return <DetailsStep tripData={tripData} updateShared={updateShared} />;
      case 'review':
        return <ReviewStep tripData={tripData} onPublish={handlePublish} isPublishing={isPublishing} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Create Trip</h1>
          <p className="text-text-secondary">Fill out the details to create your trip itinerary.</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <button
                  onClick={() => i <= currentStepIndex && setStep(s)}
                  disabled={i > currentStepIndex}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-colors
                    ${i === currentStepIndex
                      ? 'bg-accent-sage text-white'
                      : i < currentStepIndex
                        ? 'bg-accent-sage/30 text-accent-forest cursor-pointer hover:bg-accent-sage/50'
                        : 'bg-bg-secondary text-text-muted'
                    }
                  `}
                >
                  {i + 1}
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${i < currentStepIndex ? 'bg-accent-sage' : 'bg-bg-secondary'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-sm text-text-secondary capitalize">
            Step {currentStepIndex + 1}: {step}
          </div>
        </div>

        {/* Step content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={() => setStep(STEPS[currentStepIndex - 1])}
            disabled={currentStepIndex === 0}
          >
            ← Back
          </Button>
          {step !== 'review' && (
            <Button
              onClick={() => setStep(STEPS[currentStepIndex + 1])}
              disabled={currentStepIndex === STEPS.length - 1}
            >
              Next →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components

interface StepProps {
  tripData: Partial<TripData>;
  updateMeta?: (updates: Partial<TripData['meta']>) => void;
  updateTemplateData?: (updates: Partial<any>) => void;
  updateShared?: (updates: Partial<TripData['shared']>) => void;
  setTripData?: React.Dispatch<React.SetStateAction<Partial<TripData>>>;
}

function TemplateStep({ tripData, updateMeta }: StepProps) {
  const templates: { id: TripTemplate; name: string; icon: string; description: string }[] = [
    { id: 'backpacking', name: 'Backpacking', icon: '🎒', description: 'Multi-day wilderness adventure' },
    { id: 'roadtrip', name: 'Road Trip', icon: '🚗', description: 'Drive and explore multiple destinations' },
    { id: 'dayhike', name: 'Day Hike', icon: '🥾', description: 'Single-day trail adventure' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a Template</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => updateMeta?.({ template: t.id })}
              className={`
                p-6 rounded-xl text-left transition-all
                ${tripData.meta?.template === t.id
                  ? 'bg-accent-sage/15 border-2 border-accent-sage'
                  : 'bg-bg-secondary border-2 border-transparent hover:border-border'
                }
              `}
            >
              <div className="text-3xl mb-3">{t.icon}</div>
              <div className="font-semibold text-text-primary mb-1">{t.name}</div>
              <div className="text-sm text-text-secondary">{t.description}</div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BasicsStep({ tripData, updateMeta, updateTemplateData }: StepProps) {
  const template = tripData.meta?.template;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Trip Title"
            placeholder="e.g., John Muir Trail Section Hike"
            value={tripData.meta?.title || ''}
            onChange={(e) => updateMeta?.({ title: e.target.value })}
          />
          <Textarea
            label="Subtitle (optional)"
            placeholder="A brief description of your trip"
            value={tripData.meta?.subtitle || ''}
            onChange={(e) => updateMeta?.({ subtitle: e.target.value })}
          />
          <Input
            label="Location"
            placeholder="e.g., Sierra Nevada, California"
            value={tripData.meta?.location || ''}
            onChange={(e) => updateMeta?.({ location: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={tripData.meta?.dates.start || ''}
              onChange={(e) => updateMeta?.({ dates: { ...tripData.meta!.dates, start: e.target.value } })}
            />
            <Input
              label="End Date"
              type="date"
              value={tripData.meta?.dates.end || ''}
              onChange={(e) => updateMeta?.({ dates: { ...tripData.meta!.dates, end: e.target.value } })}
            />
          </div>
        </CardContent>
      </Card>

      {(template === 'backpacking' || template === 'dayhike') && (
        <Card>
          <CardHeader>
            <CardTitle>Trail Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Difficulty"
              value={(tripData.templateData as any)?.difficulty || 'moderate'}
              onChange={(e) => updateTemplateData?.({ difficulty: e.target.value })}
              options={DIFFICULTY_OPTIONS.map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))}
            />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Terrain</label>
              <div className="flex flex-wrap gap-2">
                {TERRAIN_OPTIONS.map((terrain) => (
                  <button
                    key={terrain}
                    onClick={() => {
                      const current = (tripData.templateData as any)?.terrain || [];
                      const updated = current.includes(terrain)
                        ? current.filter((t: string) => t !== terrain)
                        : [...current, terrain];
                      updateTemplateData?.({ terrain: updated });
                    }}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${(tripData.templateData as any)?.terrain?.includes(terrain)
                        ? 'bg-accent-sage text-white'
                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/70'
                      }
                    `}
                  >
                    {terrain}
                  </button>
                ))}
              </div>
            </div>
            {template === 'backpacking' && (
              <Input
                label="Number of Days"
                type="number"
                min={1}
                value={(tripData.templateData as any)?.days || 1}
                onChange={(e) => updateTemplateData?.({ days: parseInt(e.target.value) || 1 })}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface GPXStepProps extends StepProps {
  gpxData: GPXData | null;
  onGPXUpload: (file: File) => void;
}

function GPXStep({ tripData, gpxData, onGPXUpload }: GPXStepProps) {
  const trailStats = (tripData.templateData as any)?.trailStats;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload GPX File</CardTitle>
        </CardHeader>
        <CardContent>
          <FileInput
            label="GPX Track File"
            hint="Upload a GPX file from AllTrails, Strava, or other GPS apps"
            accept=".gpx"
            onFileSelect={onGPXUpload}
          />
        </CardContent>
      </Card>

      {gpxData && tripData.mapData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Trail Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <TripMap mapData={tripData.mapData} height="300px" showDayTabs={false} />
            </CardContent>
          </Card>

          {trailStats && trailStats.elevationProfile.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Elevation Profile</CardTitle>
                <div className="flex gap-4 mt-2 text-sm text-text-secondary">
                  <span>📏 {trailStats.totalDistance.toFixed(1)} km</span>
                  <span>⬆️ {trailStats.elevationGain.toLocaleString()} m</span>
                  <span>⬇️ {trailStats.elevationLoss.toLocaleString()} m</span>
                </div>
              </CardHeader>
              <CardContent>
                <ElevationProfile data={trailStats.elevationProfile} unit="metric" />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function ItineraryStep({ tripData, setTripData }: StepProps) {
  const [newDay, setNewDay] = useState<Partial<ItineraryDay>>({
    day: (tripData.itinerary?.length || 0) + 1,
    title: '',
    activities: [],
  });

  const addDay = () => {
    if (!newDay.title) return;
    setTripData?.((prev) => ({
      ...prev,
      itinerary: [
        ...(prev.itinerary || []),
        {
          ...newDay,
          day: (prev.itinerary?.length || 0) + 1,
          activities: newDay.activities || [],
        } as ItineraryDay,
      ],
    }));
    setNewDay({
      day: (tripData.itinerary?.length || 0) + 2,
      title: '',
      activities: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Existing days */}
      {tripData.itinerary && tripData.itinerary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Days Added</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tripData.itinerary.map((day, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
                >
                  <div>
                    <span className="font-medium text-text-primary">Day {day.day}:</span>
                    <span className="ml-2 text-text-secondary">{day.title}</span>
                  </div>
                  <button
                    onClick={() => {
                      setTripData?.((prev) => ({
                        ...prev,
                        itinerary: prev.itinerary?.filter((_, i) => i !== index),
                      }));
                    }}
                    className="text-text-muted hover:text-accent-rust"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add new day */}
      <Card>
        <CardHeader>
          <CardTitle>Add Day</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label={`Day ${(tripData.itinerary?.length || 0) + 1} Title`}
            placeholder="e.g., Trailhead to First Camp"
            value={newDay.title || ''}
            onChange={(e) => setNewDay({ ...newDay, title: e.target.value })}
          />
          <Textarea
            label="Description (optional)"
            placeholder="Brief description of the day"
            value={newDay.description || ''}
            onChange={(e) => setNewDay({ ...newDay, description: e.target.value })}
          />
          <Button onClick={addDay} disabled={!newDay.title}>
            Add Day
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailsStep({ tripData, updateShared }: StepProps) {
  const [newHighlight, setNewHighlight] = useState('');
  const [newInfo, setNewInfo] = useState('');

  const addHighlight = () => {
    if (!newHighlight) return;
    updateShared?.({
      highlights: [...(tripData.shared?.highlights || []), newHighlight],
    });
    setNewHighlight('');
  };

  const addInfo = () => {
    if (!newInfo) return;
    updateShared?.({
      importantInfo: [...(tripData.shared?.importantInfo || []), newInfo],
    });
    setNewInfo('');
  };

  const addDefaultPackingList = () => {
    const items: PackingItem[] = [];
    Object.entries(DEFAULT_PACKING_ITEMS).forEach(([category, names]) => {
      names.forEach((name) => {
        items.push({
          id: `${category}-${name}`.toLowerCase().replace(/\s+/g, '-'),
          name,
          category,
          checked: false,
        });
      });
    });
    updateShared?.({ packingList: items });
  };

  return (
    <div className="space-y-6">
      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Highlights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tripData.shared?.highlights && tripData.shared.highlights.length > 0 && (
            <div className="space-y-2">
              {tripData.shared.highlights.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-bg-secondary rounded">
                  <span>{h}</span>
                  <button
                    onClick={() => updateShared?.({
                      highlights: tripData.shared?.highlights?.filter((_, idx) => idx !== i),
                    })}
                    className="text-text-muted hover:text-accent-rust"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Add a highlight"
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addHighlight()}
            />
            <Button onClick={addHighlight}>Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Important Info */}
      <Card>
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tripData.shared?.importantInfo && tripData.shared.importantInfo.length > 0 && (
            <div className="space-y-2">
              {tripData.shared.importantInfo.map((info, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-bg-secondary rounded">
                  <span>{info}</span>
                  <button
                    onClick={() => updateShared?.({
                      importantInfo: tripData.shared?.importantInfo?.filter((_, idx) => idx !== i),
                    })}
                    className="text-text-muted hover:text-accent-rust"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Add important info"
              value={newInfo}
              onChange={(e) => setNewInfo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addInfo()}
            />
            <Button onClick={addInfo}>Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Packing List */}
      <Card>
        <CardHeader>
          <CardTitle>Packing List</CardTitle>
        </CardHeader>
        <CardContent>
          {(!tripData.shared?.packingList || tripData.shared.packingList.length === 0) ? (
            <div className="text-center py-6">
              <p className="text-text-secondary mb-4">No packing list items yet.</p>
              <Button variant="outline" onClick={addDefaultPackingList}>
                Add Default Packing List
              </Button>
            </div>
          ) : (
            <div>
              <Badge variant="sage">{tripData.shared.packingList.length} items</Badge>
              <p className="text-sm text-text-secondary mt-2">
                Packing list has been created. You can customize it after publishing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* External Links */}
      <Card>
        <CardHeader>
          <CardTitle>External Links (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Carpool Spreadsheet URL"
            placeholder="https://docs.google.com/spreadsheets/..."
            value={tripData.shared?.carpooling?.url || ''}
            onChange={(e) => updateShared?.({
              carpooling: { type: 'link', url: e.target.value },
            })}
          />
          <Input
            label="Photo Album URL"
            placeholder="https://photos.google.com/..."
            value={tripData.shared?.photoAlbum?.url || ''}
            onChange={(e) => updateShared?.({
              photoAlbum: { url: e.target.value },
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface ReviewStepProps extends StepProps {
  onPublish: () => void;
  isPublishing: boolean;
}

function ReviewStep({ tripData, onPublish, isPublishing }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Your Trip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-text-muted">Title</span>
              <p className="font-medium text-text-primary">{tripData.meta?.title || 'Untitled'}</p>
            </div>
            <div>
              <span className="text-sm text-text-muted">Template</span>
              <p className="font-medium text-text-primary capitalize">{tripData.meta?.template}</p>
            </div>
            <div>
              <span className="text-sm text-text-muted">Location</span>
              <p className="font-medium text-text-primary">{tripData.meta?.location || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-sm text-text-muted">Dates</span>
              <p className="font-medium text-text-primary">
                {tripData.meta?.dates.start && tripData.meta?.dates.end
                  ? `${tripData.meta.dates.start} - ${tripData.meta.dates.end}`
                  : 'Not specified'
                }
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <span className="text-sm text-text-muted">Summary</span>
            <ul className="mt-2 space-y-1 text-sm text-text-secondary">
              <li>• {tripData.itinerary?.length || 0} days in itinerary</li>
              <li>• {tripData.shared?.highlights?.length || 0} highlights</li>
              <li>• {tripData.shared?.packingList?.length || 0} packing items</li>
              <li>• {tripData.mapData?.routes?.length || 0} routes on map</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-accent-sage/10 border border-accent-sage">
        <CardContent>
          <h3 className="font-semibold text-text-primary mb-2">Ready to publish?</h3>
          <p className="text-sm text-text-secondary mb-4">
            Click below to download your trip as a JSON file. Then create a public GitHub Gist
            to share it with others.
          </p>
          <Button onClick={onPublish} disabled={isPublishing} size="lg">
            {isPublishing ? 'Exporting...' : 'Export & Download JSON'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
