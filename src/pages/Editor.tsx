import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  TripData,
  TripTemplate,
  Difficulty,
  Terrain,
  GPXData,
  PackingItem,
  ItineraryDay,
  MapMarker,
  MapRoute,
  WeatherForecast,
} from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, FileInput, Checkbox } from '../components/ui';
import { TripMap, ElevationProfile } from '../components/maps';
import { parseGPX, calculateTrailStats, getGPXBounds } from '../utils';
import { ListIcon, RouteIcon, CalendarIcon, PackageIcon, StarIcon, AlertIcon, ActivityIcon, TrashIcon, SaveIcon, ClockIcon, MapPinIcon, HomeIcon, UtensilsIcon, SunIcon, PencilIcon, ShareIcon } from '../components/ui/Icon';

type EditorStep = 'basics' | 'gpx' | 'itinerary' | 'details' | 'review' | 'share';

const STEPS: EditorStep[] = ['basics', 'gpx', 'itinerary', 'details', 'review', 'share'];
type BasicsValidationErrors = { title?: string; dates?: string; template?: string };

const TERRAIN_OPTIONS: Terrain[] = ['mountain', 'coast', 'forest', 'desert', 'volcano', 'mixed'];
const DIFFICULTY_OPTIONS: Difficulty[] = ['easy', 'moderate', 'hard', 'expert'];
const WEATHER_CONDITION_OPTIONS: WeatherForecast['condition'][] = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy'];
const MARKER_TYPE_OPTIONS: MapMarker['type'][] = ['camp', 'trailhead', 'viewpoint', 'water', 'food', 'accommodation', 'activity', 'poi', 'divider'];

const DEFAULT_PACKING_ITEMS: Record<string, string[]> = {
  Shelter: ['Ultralight Tent'],
  'Sleep System': ['Sleeping Bag (20°F)', 'Sleeping Pad'],
  Clothing: ['Trail Runners'],
  Food: ['Dehydrated Meals'],
  Cooking: ['Stove', 'Fuel'],
  Hydration: ['Water Filter'],
  Navigation: ['Map/GPS', 'Compass'],
  'First Aid': ['First Aid Kit'],
  Tools: ['Repair Tape'],
  Comfort: ['Camp Chair'],
};

const PACKING_CATEGORY_OPTIONS = [
  'Shelter',
  'Sleep System',
  'Clothing',
  'Food',
  'Cooking',
  'Hydration',
  'Navigation',
  'First Aid',
  'Tools',
  'Comfort',
  'Misc',
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

function calculateTripDays(start: string, end: string): number {
  if (!start || !end) return 1;
  const startMs = new Date(`${start}T00:00:00`).getTime();
  const endMs = new Date(`${end}T00:00:00`).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 1;
  if (endMs < startMs) return 1;
  return Math.floor((endMs - startMs) / DAY_MS) + 1;
}

function addDays(dateStr: string, offset: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function conditionFromWeatherCode(code: number): WeatherForecast['condition'] {
  if ([0, 1].includes(code)) return 'sunny';
  if ([2, 3, 45, 48].includes(code)) return 'cloudy';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy';
  if ([95, 96, 99].includes(code)) return 'stormy';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rainy';
  return 'windy';
}

function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

function createDefaultDay(dayNumber: number, date?: string, existing?: ItineraryDay): ItineraryDay {
  return {
    day: dayNumber,
    date,
    title: existing?.title?.trim() ? existing.title : `Day ${dayNumber}`,
    description: existing?.description || '',
    activities: existing?.activities || [],
    accommodation: existing?.accommodation,
    meals: existing?.meals,
    distance: existing?.distance,
    elevationGain: existing?.elevationGain,
  };
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function coerceTemplateData(template: TripTemplate, existing: any, dayCount: number) {
  if (template === 'roadtrip') {
    return {
      days: dayCount,
      transportation: existing?.transportation || [],
      totalMiles: existing?.totalMiles,
    };
  }

  if (template === 'dayhike') {
    return {
      difficulty: existing?.difficulty || 'moderate',
      distance: existing?.distance || 0,
      distanceUnit: existing?.distanceUnit || 'miles',
      terrain: existing?.terrain?.length ? existing.terrain : ['mountain'],
      elevationGain: existing?.elevationGain,
      trailStats: existing?.trailStats,
      trailheadParking: existing?.trailheadParking,
    };
  }

  return {
    difficulty: existing?.difficulty || 'moderate',
    distance: existing?.distance || 0,
    distanceUnit: existing?.distanceUnit || 'miles',
    days: dayCount,
    terrain: existing?.terrain?.length ? existing.terrain : ['mountain'],
    elevationGain: existing?.elevationGain,
    trailStats: existing?.trailStats,
    permitRequired: existing?.permitRequired,
    permitInfo: existing?.permitInfo,
  };
}

export function Editor() {
  const navigate = useNavigate();
  const [step, setStep] = useState<EditorStep>('basics');
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
      weather: [],
    },
    templateData: {
      difficulty: 'moderate',
      distance: 0,
      distanceUnit: 'miles',
      days: 1,
      terrain: ['mountain'],
    },
    itinerary: [createDefaultDay(1)],
    mapData: {
      center: [37.7749, -122.4194],
      zoom: 10,
      routes: [],
      markers: [],
    },
  });
  const [gpxData, setGpxData] = useState<GPXData | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [exportedFileName, setExportedFileName] = useState<string>('');
  const [publishError, setPublishError] = useState<string>('');
  const [basicErrors, setBasicErrors] = useState<BasicsValidationErrors>({});

  const currentStepIndex = STEPS.indexOf(step);
  const startDate = tripData.meta?.dates.start || '';
  const endDate = tripData.meta?.dates.end || '';
  const dayCount = calculateTripDays(startDate, endDate);
  const template = tripData.meta?.template;
  const templateData = tripData.templateData as any;
  const requiresTrailMetrics = template === 'backpacking' || template === 'dayhike';
  const hasDistance = Number(templateData?.distance) > 0;
  const hasElevation = Number(templateData?.trailStats?.elevationGain || templateData?.elevationGain) > 0;
  const missingPublishRequirements = [
    ...(requiresTrailMetrics && !hasDistance ? ['Total distance'] : []),
    ...(requiresTrailMetrics && !hasElevation ? ['Elevation gain'] : []),
  ];
  const canPublish = missingPublishRequirements.length === 0;

  const validateBasics = (data: Partial<TripData>): BasicsValidationErrors => {
    const errors: BasicsValidationErrors = {};
    const title = data.meta?.title?.trim() || '';
    const start = data.meta?.dates.start || '';
    const end = data.meta?.dates.end || '';
    const templateValue = data.meta?.template || '';

    if (!title) errors.title = 'Trip title is required.';
    if (!start || !end) errors.dates = 'Trip date is required.';
    if (!templateValue) errors.template = 'Trip type is required.';

    return errors;
  };

  const hasBasicErrors = (errors: BasicsValidationErrors) => Object.keys(errors).length > 0;

  const goToStep = (targetStep: EditorStep) => {
    if (step === 'basics' && targetStep !== 'basics') {
      const errors = validateBasics(tripData);
      if (hasBasicErrors(errors)) {
        setBasicErrors(errors);
        return;
      }
    }
    if (targetStep === 'share' && !exportedFileName) return;
    setBasicErrors({});
    setStep(targetStep);
  };

  useEffect(() => {
    if (tripData.meta?.template !== 'dayhike') return;
    const start = tripData.meta?.dates.start;
    const end = tripData.meta?.dates.end;
    if (!start || end === start) return;

    setTripData((prev) => ({
      ...prev,
      meta: {
        ...prev.meta!,
        dates: {
          ...prev.meta!.dates,
          end: prev.meta!.dates.start,
        },
      },
    }));
  }, [tripData.meta?.template, tripData.meta?.dates.start, tripData.meta?.dates.end]);

  useEffect(() => {
    if (step !== 'basics' || !hasBasicErrors(basicErrors)) return;
    const nextErrors = validateBasics(tripData);
    setBasicErrors(nextErrors);
  }, [step, tripData.meta?.title, tripData.meta?.dates.start, tripData.meta?.dates.end, tripData.meta?.template]);
  const builderTabs = [
    { id: 'basics', label: 'Basic Info', Icon: ListIcon },
    { id: 'gpx', label: 'Route & Map', Icon: RouteIcon },
    { id: 'itinerary', label: 'Itinerary', Icon: CalendarIcon },
    { id: 'details', label: 'Packing List', Icon: PackageIcon },
    { id: 'review', label: 'Review', Icon: PencilIcon },
    { id: 'share', label: 'Share', Icon: ShareIcon, requiresExport: true },
  ] as const;
  const activeTab = builderTabs.find((tab) => tab.id === step)?.id || 'basics';

  useEffect(() => {
    setTripData((prev) => {
      if (!prev.meta || !prev.shared) return prev;

      const nextTemplateData = coerceTemplateData(prev.meta.template, prev.templateData, dayCount);
      const previousItinerary = prev.itinerary || [];
      const nextItinerary = Array.from({ length: dayCount }, (_, index) => {
        const date = prev.meta?.dates.start ? addDays(prev.meta.dates.start, index) : undefined;
        return createDefaultDay(index + 1, date, previousItinerary[index]);
      });

      const existingWeather = prev.shared.weather || [];
      const nextWeather = existingWeather.length > 0
        ? nextItinerary.map((day, index) => {
            const byDate = day.date ? existingWeather.find((w) => w.date === day.date) : undefined;
            const existing = byDate || existingWeather[index];
            return {
              date: day.date || existing?.date || '',
              high: existing?.high ?? 70,
              low: existing?.low ?? 55,
              condition: existing?.condition ?? 'sunny',
              precipitation: existing?.precipitation ?? 0,
            };
          })
        : existingWeather;

      const itineraryChanged = JSON.stringify(previousItinerary) !== JSON.stringify(nextItinerary);
      const templateChanged = JSON.stringify(prev.templateData) !== JSON.stringify(nextTemplateData);
      const weatherChanged = JSON.stringify(existingWeather) !== JSON.stringify(nextWeather);

      if (!itineraryChanged && !templateChanged && !weatherChanged) return prev;

      return {
        ...prev,
        templateData: nextTemplateData,
        itinerary: nextItinerary,
        shared: {
          ...prev.shared,
          weather: nextWeather,
        },
      };
    });
  }, [dayCount, startDate, endDate, tripData.meta?.template]);

  const updateMeta = (updates: Partial<TripData['meta']>) => {
    setTripData((prev) => ({
      ...prev,
      meta: { ...prev.meta!, ...updates },
    }));
  };

  const updateTemplateData = (updates: Record<string, unknown>) => {
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

        setTripData((prev) => ({
          ...prev,
          gpxData: parsed,
          templateData: {
            ...prev.templateData!,
            distance: stats.totalDistance,
            distanceUnit: 'km',
            elevationGain: stats.elevationGain,
            trailStats: stats,
          },
          mapData: {
            center: bounds.center,
            zoom: 12,
            routes: parsed.tracks.map((track, i) => ({
              id: `track-${i}`,
              name: track.name || `Track ${i + 1}`,
              day: i + 1,
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
    if (!canPublish) return;
    setIsPublishing(true);
    setPublishError('');
    try {
      const finalTripData: TripData = {
        meta: tripData.meta!,
        shared: tripData.shared!,
        templateData: tripData.templateData!,
        itinerary: tripData.itinerary || [],
        mapData: tripData.mapData!,
        gpxData: gpxData || undefined,
      } as TripData;

      const jsonStr = JSON.stringify(finalTripData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      const fileName = `${tripData.meta?.title?.toLowerCase().replace(/\s+/g, '-') || 'trip'}.json`;
      a.download = fileName;
      a.click();

      URL.revokeObjectURL(url);
      setExportedFileName(fileName);
      setStep('share');
    } catch (err) {
      console.error('Failed to publish:', err);
      setPublishError('Failed to export trip. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'basics':
        return (
          <BasicsStep
            tripData={tripData}
            updateMeta={updateMeta}
            updateTemplateData={updateTemplateData}
            updateShared={updateShared}
            dayCount={dayCount}
            validationErrors={basicErrors}
          />
        );
      case 'gpx':
        return <GPXStep tripData={tripData} gpxData={gpxData} onGPXUpload={handleGPXUpload} setTripData={setTripData} />;
      case 'itinerary':
        return <ItineraryStep tripData={tripData} setTripData={setTripData} updateShared={updateShared} />;
      case 'details':
        return <DetailsStep tripData={tripData} updateShared={updateShared} />;
      case 'review':
        return (
          <ReviewStep
            tripData={tripData}
            onPublish={handlePublish}
            isPublishing={isPublishing}
            canPublish={canPublish}
            missingPublishRequirements={missingPublishRequirements}
            publishError={publishError}
          />
        );
      case 'share':
        return <ShareStep exportedFileName={exportedFileName} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#ebe8e4] pb-10">
      <div className="max-w-[1500px] mx-auto px-4 py-4 md:py-6">
        <div className="rounded-3xl border border-[#d2cdc6] bg-[#f7f5f2] card-shadow px-6 py-5 md:px-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl text-[#1f1f1f] leading-tight">Trip Builder</h1>
            <p className="text-[#6e6963] mt-1">Design your route and itinerary to generate a shareable link.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/view?gist=demo')}
              className="text-[#544f49] hover:text-[#1f1f1f] transition-colors font-medium"
            >
              Preview
            </button>
            <Button
              size="lg"
              className="bg-[#e67a00] hover:bg-[#cf6f05] text-white rounded-full px-8 py-3 shadow-md"
              onClick={() => goToStep(canPublish ? 'review' : 'gpx')}
            >
              <span className="inline-flex items-center gap-2">
                <SaveIcon className="w-4 h-4" />
                Save &amp; Generate Link
              </span>
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-7 px-2">
          <div className="mx-auto w-full md:w-max rounded-full border border-[#d2cdc6] bg-[#ece9e4] p-1.5 flex flex-wrap gap-1 justify-center">
            {builderTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => goToStep(tab.id)}
                disabled={Boolean(('requiresExport' in tab && tab.requiresExport) && !exportedFileName)}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#f7f5f2] text-[#1f1f1f] card-shadow'
                    : 'text-[#6e6963] hover:text-[#1f1f1f]'
                } ${Boolean(('requiresExport' in tab && tab.requiresExport) && !exportedFileName) ? 'opacity-50 cursor-not-allowed hover:text-[#6e6963]' : ''}`}
              >
                <tab.Icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-8">
          {renderStep()}
        </div>

        <div className="max-w-5xl mx-auto flex justify-between mt-8">
          <Button
            variant="ghost"
            className="text-[#6e6963] hover:text-[#1f1f1f] hover:bg-transparent"
            onClick={() => {
              if (currentStepIndex === 0) {
                navigate('/');
                return;
              }
              setStep(STEPS[currentStepIndex - 1]);
            }}
          >
            ← Back
          </Button>
          {currentStepIndex < STEPS.length - 1 && step !== 'review' && step !== 'share' && (
            <Button
              className="bg-[#e67a00] hover:bg-[#cf6f05] text-white rounded-full px-6"
              onClick={() => goToStep(STEPS[currentStepIndex + 1])}
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

interface StepProps {
  tripData: Partial<TripData>;
  updateMeta?: (updates: Partial<TripData['meta']>) => void;
  updateTemplateData?: (updates: Record<string, unknown>) => void;
  updateShared?: (updates: Partial<TripData['shared']>) => void;
  setTripData?: React.Dispatch<React.SetStateAction<Partial<TripData>>>;
}

function ThemedSingleSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select option',
  error,
}: {
  label?: React.ReactNode;
  value: string;
  options: Array<{ value: string; label: string }>;
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label;
  const displayLabel = selectedLabel || placeholder;

  return (
    <div className="relative">
      {label ? <label className="block text-sm font-medium text-text-primary mb-2">{label}</label> : null}
      <button
        type="button"
        className="w-full rounded-2xl border border-[#cfc9c2] bg-[#f7f5f2] px-4 py-3 text-left text-[#272523] flex items-center justify-between"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={selectedLabel ? '' : 'text-[#8a847d]'}>{displayLabel}</span>
        <span className="text-[#8a847d]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-[#cfc9c2] bg-[#f7f5f2] shadow-lg overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full px-4 py-2 text-left hover:bg-[#ece8e2] ${value === option.value ? 'bg-[#ece8e2] font-medium' : ''}`}
              onClick={() => {
                onSelect(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {error ? <p className="text-xs text-[#cf5a4f] mt-1">{error}</p> : null}
    </div>
  );
}

function ThemedMultiSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: React.ReactNode;
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }
    onChange([...value, option]);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>
      <button
        type="button"
        className="w-full rounded-2xl border border-[#cfc9c2] bg-[#f7f5f2] px-4 py-3 text-left text-[#272523] flex items-center justify-between"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{value.length > 0 ? value.map((item) => item.charAt(0).toUpperCase() + item.slice(1)).join(', ') : 'Select terrain'}</span>
        <span className="text-[#8a847d]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-[#cfc9c2] bg-[#f7f5f2] shadow-lg p-2 space-y-1">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={`w-full text-left px-3 py-2 rounded-xl hover:bg-[#ece8e2] ${value.includes(option) ? 'bg-[#ece8e2] font-medium' : ''}`}
              onClick={() => toggleOption(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemedDateRangePicker({
  label,
  start,
  end,
  singleDateMode = false,
  onChange,
  error,
}: {
  label: React.ReactNode;
  start: string;
  end: string;
  singleDateMode?: boolean;
  onChange: (next: { start: string; end: string }) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const anchor = start ? new Date(`${start}T00:00:00`) : new Date();
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  });

  const toIso = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const display = singleDateMode
    ? (start ? new Date(`${start}T00:00:00`).toLocaleDateString() : 'Select date')
    : (start && end
      ? `${new Date(`${start}T00:00:00`).toLocaleDateString()} - ${new Date(`${end}T00:00:00`).toLocaleDateString()}`
      : 'Select date range');

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const leadingBlanks = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();

  const dayCells: Array<string | null> = [];
  for (let i = 0; i < leadingBlanks; i += 1) dayCells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    dayCells.push(toIso(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)));
  }

  const handleDayClick = (dateIso: string) => {
    if (singleDateMode) {
      onChange({ start: dateIso, end: dateIso });
      return;
    }
    if (!start || (start && end)) {
      onChange({ start: dateIso, end: '' });
      return;
    }
    if (dateIso < start) {
      onChange({ start: dateIso, end: start });
      return;
    }
    onChange({ start, end: dateIso });
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-text-primary mb-2">{label}</label>
      <button
        type="button"
        className="w-full rounded-2xl border border-[#cfc9c2] bg-[#f7f5f2] px-4 py-3 text-left text-[#272523] flex items-center justify-between min-h-[52px]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={start && end ? 'text-[#272523]' : 'text-[#8a847d]'}>{display}</span>
        <span className="text-[#8a847d]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-[#cfc9c2] bg-[#f7f5f2] shadow-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-[#cfc9c2] text-[#6e6963] hover:bg-[#ece8e2]"
              onClick={() => setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <p className="font-medium text-[#272523]">{monthLabel}</p>
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-[#cfc9c2] text-[#6e6963] hover:bg-[#ece8e2]"
              onClick={() => setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#8a847d]">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((labelText) => (
              <span key={labelText} className="py-1">{labelText}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dayCells.map((dateIso, idx) => {
              if (!dateIso) {
                return <div key={`blank-${idx}`} className="h-9" />;
              }
              const isStart = dateIso === start;
              const isEnd = dateIso === end;
              const inRange = Boolean(start && end && dateIso > start && dateIso < end);

              return (
                <button
                  key={dateIso}
                  type="button"
                  className={`h-9 rounded-lg text-sm transition-colors ${
                    isStart || isEnd
                      ? 'bg-[#e67a00] text-white'
                      : inRange
                        ? 'bg-[#f6d8b0] text-[#5c3b14]'
                        : 'text-[#272523] hover:bg-[#ece8e2]'
                  }`}
                  onClick={() => handleDayClick(dateIso)}
                >
                  {new Date(`${dateIso}T00:00:00`).getDate()}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl bg-[#ece8e2] px-3 py-2 text-xs text-[#6e6963]">
            {singleDateMode
              ? (start ? `Selected: ${start}` : 'Pick a date.')
              : (start && end ? `${start} to ${end}` : 'Pick a start date, then an end date.')}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="px-3 py-1.5" onClick={() => onChange({ start: '', end: '' })}>
              Clear
            </Button>
            <Button variant="secondary" className="px-3 py-1.5" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
      {error ? <p className="text-xs text-[#cf5a4f] mt-1">{error}</p> : null}
    </div>
  );
}

function BasicsStep({
  tripData,
  updateMeta,
  updateTemplateData,
  updateShared,
  validationErrors,
}: StepProps & { dayCount: number; validationErrors?: BasicsValidationErrors }) {
  const template = tripData.meta?.template;
  const highlightsText = (tripData.shared?.highlights || []).join('\n\n');
  const importantInfoText = (tripData.shared?.importantInfo || []).join('\n\n');

  const iconLabel = (IconComp: React.FC<{ className?: string }>, text: string) => (
    <span className="inline-flex items-center gap-1.5">
      <IconComp className="w-4 h-4 text-[#e67a00]" />
      <span>{text}</span>
    </span>
  );

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border border-[#d2cdc6] bg-[#f7f5f2] card-shadow p-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="font-serif text-4xl text-[#1f1f1f]">Trip Details</CardTitle>
          <p className="text-[#6e6963] mt-1">Start by giving your trip a name and defining the basics.</p>
        </CardHeader>
        <CardContent className="space-y-5 border-t border-[#d2cdc6] px-6 md:px-8 pb-8 pt-5">
          <Input
            label="Trip Title"
            placeholder="e.g., High Sierra Trail 2026"
            value={tripData.meta?.title || ''}
            error={validationErrors?.title}
            onChange={(e) => updateMeta?.({ title: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ThemedDateRangePicker
              label={iconLabel(CalendarIcon, 'Dates')}
              start={tripData.meta?.dates.start || ''}
              end={tripData.meta?.dates.end || ''}
              singleDateMode={tripData.meta?.template === 'dayhike'}
              error={validationErrors?.dates}
              onChange={({ start, end }) => updateMeta?.({ dates: { ...tripData.meta!.dates, start, end } })}
            />
            <ThemedSingleSelect
              label={iconLabel(ActivityIcon, 'Trip Type')}
              value={tripData.meta?.template || 'backpacking'}
              error={validationErrors?.template}
              onSelect={(value) => updateMeta?.({ template: value as TripTemplate })}
              options={[
                { value: 'backpacking', label: 'Backpacking' },
                { value: 'roadtrip', label: 'Road Trip' },
                { value: 'dayhike', label: 'Day Hike' },
              ]}
            />
          </div>
          {(template === 'backpacking' || template === 'dayhike') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ThemedSingleSelect
                label={iconLabel(ActivityIcon, 'Difficulty')}
              value={(tripData.templateData as any)?.difficulty || 'moderate'}
              onSelect={(value) => updateTemplateData?.({ difficulty: value })}
              options={DIFFICULTY_OPTIONS.map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))}
            />
            <ThemedMultiSelect
                label={iconLabel(RouteIcon, 'Terrain')}
              value={(tripData.templateData as any)?.terrain || []}
              options={TERRAIN_OPTIONS}
              onChange={(value) => updateTemplateData?.({ terrain: value })}
            />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">{iconLabel(StarIcon, 'Trip Highlights')}</label>
            <Textarea
              placeholder="e.g., Summiting Half Dome, Giant Sequoias, Kern Hot Springs"
              value={highlightsText}
              onChange={(e) => updateShared?.({
                highlights: e.target.value.trim() ? [e.target.value] : [],
              })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">{iconLabel(AlertIcon, 'Important Information')}</label>
            <Textarea
              placeholder="Permit requirements, bear canister rules, weather risks, etc."
              value={importantInfoText}
              onChange={(e) => updateShared?.({
                importantInfo: e.target.value.trim() ? [e.target.value] : [],
              })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface GPXStepProps extends StepProps {
  gpxData: GPXData | null;
  onGPXUpload: (file: File) => void;
}

interface NewMarkerForm {
  name: string;
  description: string;
  type: MapMarker['type'];
  day?: number;
  lat: number;
  lon: number;
}

function GPXStep({ tripData, gpxData, onGPXUpload, setTripData }: GPXStepProps) {
  const template = tripData.meta?.template;
  const trailStats = (tripData.templateData as any)?.trailStats;
  const templateData = (tripData.templateData as any) || {};
  const mapData = tripData.mapData;
  const itineraryDays = tripData.itinerary?.length || 1;
  const requiresTrailMetrics = template === 'backpacking' || template === 'dayhike';
  const hasInferredDistance = Number(templateData.distance) > 0;
  const hasInferredElevation = Number(templateData.trailStats?.elevationGain || templateData.elevationGain) > 0;
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [drawMode, setDrawMode] = useState(false);
  const [newMarker, setNewMarker] = useState<NewMarkerForm>({
    name: '',
    description: '',
    type: 'poi',
    day: 1,
    lat: mapData?.center[0] || 0,
    lon: mapData?.center[1] || 0,
  });

  useEffect(() => {
    const firstRouteId = mapData?.routes[0]?.id || '';
    if (!selectedRouteId || !mapData?.routes.find((r) => r.id === selectedRouteId)) {
      setSelectedRouteId(firstRouteId);
    }
  }, [mapData?.routes, selectedRouteId]);

  const selectedRoute = useMemo(
    () => mapData?.routes.find((route) => route.id === selectedRouteId),
    [mapData?.routes, selectedRouteId]
  );

  const updateMapData = (updater: (current: TripData['mapData']) => TripData['mapData']) => {
    setTripData?.((prev) => {
      if (!prev.mapData) return prev;
      return { ...prev, mapData: updater(prev.mapData) };
    });
  };

  const updateTemplateData = (updates: Record<string, unknown>) => {
    setTripData?.((prev) => ({
      ...prev,
      templateData: { ...prev.templateData!, ...updates },
    }));
  };

  const updateRoute = (routeId: string, updater: (route: MapRoute) => MapRoute) => {
    updateMapData((current) => ({
      ...current,
      routes: current.routes.map((route) => (route.id === routeId ? updater(route) : route)),
    }));
  };

  const addRoute = () => {
    const id = createId('route');
    updateMapData((current) => ({
      ...current,
      routes: [
        ...current.routes,
        {
          id,
          name: `Route ${current.routes.length + 1}`,
          day: Math.min(current.routes.length + 1, itineraryDays),
          points: [],
        },
      ],
    }));
    setSelectedRouteId(id);
  };

  const removeRoute = (routeId: string) => {
    updateMapData((current) => ({
      ...current,
      routes: current.routes.filter((route) => route.id !== routeId),
    }));
  };

  const addWaypoint = () => {
    if (!newMarker.name || newMarker.lat === undefined || newMarker.lon === undefined || !newMarker.type) return;

    updateMapData((current) => ({
      ...current,
      markers: [
        ...current.markers,
        {
          id: createId('marker'),
          name: newMarker.name,
          description: newMarker.description,
          type: newMarker.type,
          lat: newMarker.lat,
          lon: newMarker.lon,
          day: newMarker.day,
        },
      ],
    }));

            setNewMarker((prev) => ({ ...prev, name: '', description: '' }));
  };

  const addPointToSelectedRoute = (lat: number, lon: number) => {
    if (!selectedRouteId) return;
    updateRoute(selectedRouteId, (route) => ({
      ...route,
      points: [...route.points, { lat, lon }],
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border border-border bg-bg-card card-shadow">
        <CardHeader>
          <CardTitle className="font-serif text-4xl">Route &amp; Map Builder</CardTitle>
          <p className="text-text-secondary mt-1">Upload GPX, edit waypoints, and draw route adjustments directly on the map.</p>
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

      {requiresTrailMetrics && (
        <Card className="rounded-[28px] border border-border bg-bg-card card-shadow">
          <CardHeader>
            <CardTitle>Trail Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-secondary">
              If GPX data does not include complete stats, fill in total distance and elevation gain manually.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Total Distance"
                type="number"
                step="0.1"
                value={templateData.distance || ''}
                onChange={(e) => updateTemplateData({ distance: e.target.value ? parseFloat(e.target.value) : 0 })}
              />
              <Select
                label="Distance Unit"
                value={templateData.distanceUnit || 'miles'}
                onChange={(e) => updateTemplateData({ distanceUnit: e.target.value })}
                options={[
                  { value: 'miles', label: 'Miles' },
                  { value: 'km', label: 'Kilometers' },
                ]}
              />
              <Input
                label="Elevation Gain (feet)"
                type="number"
                value={templateData.elevationGain || templateData.trailStats?.elevationGain || ''}
                onChange={(e) => updateTemplateData({ elevationGain: e.target.value ? parseFloat(e.target.value) : 0 })}
              />
            </div>
            <div className="rounded-lg bg-bg-secondary p-3 text-sm text-text-secondary">
              <p>{hasInferredDistance ? 'Distance is set.' : 'Distance is required before export.'}</p>
              <p>{hasInferredElevation ? 'Elevation gain is set.' : 'Elevation gain is required before export.'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {mapData && (
        <Card className="rounded-[28px] border border-border bg-bg-card card-shadow">
          <CardHeader>
            <CardTitle>Map Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <Button variant="outline" onClick={addRoute}>Add Route</Button>
                <Checkbox
                  label="Draw mode (click map to append points to selected route)"
                  checked={drawMode}
                  onChange={(e) => setDrawMode(e.target.checked)}
                />
              </div>

              {mapData.routes.length > 0 && (
                <div className="space-y-3 p-3 rounded-lg bg-bg-secondary">
                  <label className="block text-sm font-medium text-text-primary">Selected Route</label>
                  <Select
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    options={mapData.routes.map((route) => ({ value: route.id, label: route.name || route.id }))}
                  />

                  {selectedRoute && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          label="Route Name"
                          value={selectedRoute.name}
                          onChange={(e) => updateRoute(selectedRoute.id, (route) => ({ ...route, name: e.target.value }))}
                        />
                        <Input
                          label="Day"
                          type="number"
                          min={1}
                          max={itineraryDays}
                          value={selectedRoute.day || 1}
                          onChange={(e) => updateRoute(selectedRoute.id, (route) => ({ ...route, day: parseInt(e.target.value, 10) || 1 }))}
                        />
                        <div className="flex items-end">
                          <Button variant="ghost" onClick={() => removeRoute(selectedRoute.id)}>Remove Route</Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => addPointToSelectedRoute(mapData.center[0], mapData.center[1])}
                        >
                          Add Point at Center
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => updateRoute(selectedRoute.id, (route) => ({ ...route, points: route.points.slice(0, -1) }))}
                          disabled={selectedRoute.points.length === 0}
                        >
                          Shorten Route (remove last)
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => updateRoute(selectedRoute.id, (route) => ({ ...route, points: route.points.slice(1) }))}
                          disabled={selectedRoute.points.length === 0}
                        >
                          Trim Start (remove first)
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-72 overflow-auto pr-1">
                        {selectedRoute.points.map((point, idx) => (
                          <div key={`${selectedRoute.id}-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 bg-bg-card rounded-lg">
                            <Input
                              className="md:col-span-5"
                              type="number"
                              step="any"
                              value={point.lat}
                              onChange={(e) => updateRoute(selectedRoute.id, (route) => {
                                const points = [...route.points];
                                points[idx] = { ...points[idx], lat: parseFloat(e.target.value) || 0 };
                                return { ...route, points };
                              })}
                            />
                            <Input
                              className="md:col-span-5"
                              type="number"
                              step="any"
                              value={point.lon}
                              onChange={(e) => updateRoute(selectedRoute.id, (route) => {
                                const points = [...route.points];
                                points[idx] = { ...points[idx], lon: parseFloat(e.target.value) || 0 };
                                return { ...route, points };
                              })}
                            />
                            <Button
                              className="md:col-span-2"
                              variant="ghost"
                              onClick={() => updateRoute(selectedRoute.id, (route) => ({
                                ...route,
                                points: route.points.filter((_, pointIndex) => pointIndex !== idx),
                              }))}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <TripMap
              mapData={mapData}
              height="360px"
              showDayTabs={true}
              mapClickEnabled={drawMode}
              onMapClick={(lat, lon) => addPointToSelectedRoute(lat, lon)}
            />

            <div className="space-y-3">
              <h4 className="font-medium text-text-primary">Waypoints / Stops / Day Dividers</h4>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-bg-secondary rounded-lg">
                <Input
                  className="md:col-span-3"
                  label="Name"
                  value={newMarker.name || ''}
                  onChange={(e) => setNewMarker((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Select
                  className="md:col-span-2"
                  label="Type"
                  value={newMarker.type || 'poi'}
                  onChange={(e) => setNewMarker((prev) => ({ ...prev, type: e.target.value as MapMarker['type'] }))}
                  options={MARKER_TYPE_OPTIONS.map((type) => ({ value: type, label: type }))}
                />
                <Input
                  className="md:col-span-2"
                  label="Day"
                  type="number"
                  min={1}
                  max={itineraryDays}
                  value={newMarker.day || 1}
                  onChange={(e) => setNewMarker((prev) => ({ ...prev, day: parseInt(e.target.value, 10) || 1 }))}
                />
                <Input
                  className="md:col-span-2"
                  label="Latitude"
                  type="number"
                  step="any"
                  value={newMarker.lat || 0}
                  onChange={(e) => setNewMarker((prev) => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                />
                <Input
                  className="md:col-span-2"
                  label="Longitude"
                  type="number"
                  step="any"
                  value={newMarker.lon || 0}
                  onChange={(e) => setNewMarker((prev) => ({ ...prev, lon: parseFloat(e.target.value) || 0 }))}
                />
                <div className="md:col-span-1 flex items-end">
                  <Button onClick={addWaypoint}>Add</Button>
                </div>
                <Textarea
                  className="md:col-span-12"
                  label="Description"
                  value={newMarker.description || ''}
                  onChange={(e) => setNewMarker((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                {mapData.markers.map((marker, idx) => (
                  <div key={marker.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 bg-bg-secondary rounded-lg">
                    <Input
                      className="md:col-span-2"
                      value={marker.name}
                      onChange={(e) => updateMapData((current) => ({
                        ...current,
                        markers: current.markers.map((item, markerIdx) => markerIdx === idx ? { ...item, name: e.target.value } : item),
                      }))}
                    />
                    <Select
                      className="md:col-span-2"
                      value={marker.type}
                      onChange={(e) => updateMapData((current) => ({
                        ...current,
                        markers: current.markers.map((item, markerIdx) => markerIdx === idx ? { ...item, type: e.target.value as MapMarker['type'] } : item),
                      }))}
                      options={MARKER_TYPE_OPTIONS.map((type) => ({ value: type, label: type }))}
                    />
                    <Input
                      className="md:col-span-1"
                      type="number"
                      min={1}
                      max={itineraryDays}
                      value={marker.day || ''}
                      onChange={(e) => updateMapData((current) => ({
                        ...current,
                        markers: current.markers.map((item, markerIdx) => markerIdx === idx
                          ? { ...item, day: e.target.value ? (parseInt(e.target.value, 10) || 1) : undefined }
                          : item),
                      }))}
                    />
                    <Input
                      className="md:col-span-2"
                      type="number"
                      step="any"
                      value={marker.lat}
                      onChange={(e) => updateMapData((current) => ({
                        ...current,
                        markers: current.markers.map((item, markerIdx) => markerIdx === idx ? { ...item, lat: parseFloat(e.target.value) || 0 } : item),
                      }))}
                    />
                    <Input
                      className="md:col-span-2"
                      type="number"
                      step="any"
                      value={marker.lon}
                      onChange={(e) => updateMapData((current) => ({
                        ...current,
                        markers: current.markers.map((item, markerIdx) => markerIdx === idx ? { ...item, lon: parseFloat(e.target.value) || 0 } : item),
                      }))}
                    />
                    <Input
                      className="md:col-span-2"
                      value={marker.description || ''}
                      onChange={(e) => updateMapData((current) => ({
                        ...current,
                        markers: current.markers.map((item, markerIdx) => markerIdx === idx ? { ...item, description: e.target.value } : item),
                      }))}
                    />
                    <Button
                      className="md:col-span-1"
                      variant="ghost"
                      onClick={() => updateMapData((current) => ({
                        ...current,
                        markers: current.markers.filter((_, markerIdx) => markerIdx !== idx),
                      }))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {gpxData && trailStats && trailStats.elevationProfile.length > 0 && (
        <Card className="rounded-[28px] border border-border bg-bg-card card-shadow">
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
    </div>
  );
}

function parseTimeParts(value?: string) {
  const fallback = { hour: '08', minute: '00', period: 'AM' as 'AM' | 'PM' };
  if (!value) return fallback;
  const match = value.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return fallback;
  return {
    hour: match[1].padStart(2, '0'),
    minute: match[2],
    period: match[3].toUpperCase() as 'AM' | 'PM',
  };
}

function ThemedTimeSelector({ value, onChange }: { value?: string; onChange: (next: string) => void }) {
  const periods: Array<'AM' | 'PM'> = ['AM', 'PM'];
  const options: string[] = [];
  periods.forEach((period) => {
    for (let hour = 1; hour <= 12; hour += 1) {
      ['00', '15', '30', '45'].forEach((minute) => {
        options.push(`${String(hour).padStart(2, '0')}:${minute} ${period}`);
      });
    }
  });

  const parsed = parseTimeParts(value);
  const normalized = `${parsed.hour}:${parsed.minute} ${parsed.period}`;
  const selected = options.includes(normalized) ? normalized : '08:00 AM';

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#d2cdc6] bg-[#f7f5f2] px-2 py-1.5 min-h-[48px]">
      <ClockIcon className="w-4 h-4 text-[#b8b2ab]" />
      <div className="relative flex-1">
        <select
          className="appearance-none w-full rounded-lg border border-[#d2cdc6] bg-[#f7f5f2] px-3 py-2 pr-7 text-sm text-[#2d2a27] outline-none"
          value={selected}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#8a847d]">▼</span>
      </div>
    </div>
  );
}

function ItineraryStep({ tripData, setTripData, updateShared }: StepProps) {
  const itinerary = tripData.itinerary || [];
  const weather = tripData.shared?.weather || [];
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const [expandedSubBlocks, setExpandedSubBlocks] = useState<Record<number, { accommodation: boolean; meals: boolean; weather: boolean }>>({});
  const [weatherCoordsByDay, setWeatherCoordsByDay] = useState<Record<number, string>>({});
  const [weatherLoadingByDay, setWeatherLoadingByDay] = useState<Record<number, boolean>>({});
  const [weatherErrorByDay, setWeatherErrorByDay] = useState<Record<number, string>>({});
  const [weatherDraftByDay, setWeatherDraftByDay] = useState<Record<number, { high: string; low: string; condition: WeatherForecast['condition'] }>>({});

  useEffect(() => {
    setExpandedDays((prev) => {
      const next = { ...prev };
      itinerary.forEach((day, index) => {
        if (next[day.day] === undefined) next[day.day] = index === 0;
      });
      Object.keys(next).forEach((key) => {
        const dayNumber = parseInt(key, 10);
        if (!itinerary.some((day) => day.day === dayNumber)) delete next[dayNumber];
      });
      return next;
    });
  }, [itinerary]);

  useEffect(() => {
    setExpandedSubBlocks((prev) => {
      const next = { ...prev };
      itinerary.forEach((day) => {
        if (!next[day.day]) {
          next[day.day] = { accommodation: true, meals: true, weather: true };
        }
      });
      Object.keys(next).forEach((key) => {
        const dayNumber = parseInt(key, 10);
        if (!itinerary.some((day) => day.day === dayNumber)) delete next[dayNumber];
      });
      return next;
    });
  }, [itinerary]);

  useEffect(() => {
    setWeatherDraftByDay((prev) => {
      const next = { ...prev };
      itinerary.forEach((day) => {
        if (!next[day.day]) {
          next[day.day] = { high: '', low: '', condition: 'sunny' };
        }
        const weatherEntry = day.date ? weather.find((entry) => entry.date === day.date) : undefined;
        if (weatherEntry) {
          next[day.day] = {
            high: String(weatherEntry.high ?? ''),
            low: String(weatherEntry.low ?? ''),
            condition: weatherEntry.condition || 'sunny',
          };
        }
      });
      Object.keys(next).forEach((key) => {
        const dayNumber = parseInt(key, 10);
        if (!itinerary.some((day) => day.day === dayNumber)) delete next[dayNumber];
      });
      return next;
    });
  }, [itinerary, weather]);

  const weatherByDate = new Map(weather.map((entry) => [entry.date, entry]));

  const updateDay = (dayIndex: number, updater: (day: ItineraryDay) => ItineraryDay) => {
    setTripData?.((prev) => ({
      ...prev,
      itinerary: (prev.itinerary || []).map((day, index) => (index === dayIndex ? updater(day) : day)),
    }));
  };

  const upsertWeather = (dayDate: string, updater: (item: WeatherForecast) => WeatherForecast) => {
    if (!dayDate) return;
    const existingIndex = weather.findIndex((w) => w.date === dayDate);
    if (existingIndex >= 0) {
      updateShared?.({ weather: weather.map((item, idx) => (idx === existingIndex ? updater(item) : item)) });
      return;
    }
    updateShared?.({
      weather: [...weather, updater({ date: dayDate, high: 70, low: 55, condition: 'sunny', precipitation: 0 })],
    });
  };

  const queryDayWeather = async (day: ItineraryDay) => {
    if (!day.date) {
      setWeatherErrorByDay((prev) => ({ ...prev, [day.day]: 'Set trip dates first.' }));
      return;
    }

    const rawCoords = weatherCoordsByDay[day.day] || '';
    const coordsMatch = rawCoords.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (!coordsMatch) {
      setWeatherErrorByDay((prev) => ({ ...prev, [day.day]: 'Use "lat, lon" format. Example: 36.554, -118.749' }));
      return;
    }

    const latitude = parseFloat(coordsMatch[1]);
    const longitude = parseFloat(coordsMatch[2]);

    try {
      setWeatherLoadingByDay((prev) => ({ ...prev, [day.day]: true }));
      setWeatherErrorByDay((prev) => ({ ...prev, [day.day]: '' }));

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&start_date=${day.date}&end_date=${day.date}&timezone=auto`
      );
      if (!response.ok) throw new Error('Weather API request failed.');

      const data = await response.json();
      const code = data?.daily?.weather_code?.[0] ?? 0;
      const highC = data?.daily?.temperature_2m_max?.[0] ?? 20;
      const lowC = data?.daily?.temperature_2m_min?.[0] ?? 10;
      const precip = data?.daily?.precipitation_probability_max?.[0] ?? 0;

      upsertWeather(day.date, (current) => ({
        ...current,
        date: day.date!,
        high: celsiusToFahrenheit(highC),
        low: celsiusToFahrenheit(lowC),
        condition: conditionFromWeatherCode(code),
        precipitation: precip,
      }));
    } catch (error) {
      console.error(error);
      setWeatherErrorByDay((prev) => ({ ...prev, [day.day]: 'Failed to query weather.' }));
    } finally {
      setWeatherLoadingByDay((prev) => ({ ...prev, [day.day]: false }));
    }
  };

  const addDay = () => {
    setTripData?.((prev) => {
      const current = prev.itinerary || [];
      const nextDayNumber = current.length + 1;
      const start = prev.meta?.dates.start;
      const nextDate = start ? addDays(start, nextDayNumber - 1) : undefined;
      return {
        ...prev,
        itinerary: [
          ...current,
          {
            day: nextDayNumber,
            date: nextDate,
            title: `Day ${nextDayNumber}`,
            description: '',
            activities: [],
          },
        ],
      };
    });
  };

  const removeDay = (dayIndex: number) => {
    setTripData?.((prev) => {
      const next = (prev.itinerary || []).filter((_, index) => index !== dayIndex).map((day, index) => ({ ...day, day: index + 1 }));
      return { ...prev, itinerary: next };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-4xl text-[#1f1f1f]">Itinerary Builder</h3>
          <p className="text-[#6e6963] mt-1">Plan your trip day by day with activities, meals, and weather.</p>
        </div>
        <Button className="bg-[#161312] hover:bg-[#080707] text-white rounded-full" onClick={addDay}>+ Add Day</Button>
      </div>

      {itinerary.map((day, dayIndex) => {
        const dayWeather = day.date ? weatherByDate.get(day.date) : undefined;
        const isExpanded = Boolean(expandedDays[day.day]);

        return (
          <Card key={day.day} className="rounded-[24px] border border-[#d2cdc6] bg-[#f7f5f2] card-shadow p-0 overflow-visible">
            <button
              type="button"
              className="w-full px-5 py-4 flex items-center justify-between"
              onClick={() => setExpandedDays((prev) => ({ ...prev, [day.day]: !isExpanded }))}
            >
              <div className="flex items-center gap-4">
                <span className="w-9 h-9 rounded-full bg-[#f1e1aa] text-[#b25f00] font-bold inline-flex items-center justify-center">{day.day}</span>
                <span className="font-serif text-3xl text-[#1f1f1f]">{day.title || `Day ${day.day}`}</span>
              </div>
              <span className="text-[#8a847d] text-xl">{isExpanded ? '⌃' : '⌄'}</span>
            </button>

            {isExpanded && (
              <CardContent className="border-t border-[#ddd8d1] px-6 py-5 space-y-5">
                <Input
                  label="Day Title"
                  value={day.title}
                  placeholder={`e.g., Day ${day.day}`}
                  onChange={(e) => updateDay(dayIndex, (current) => ({ ...current, title: e.target.value }))}
                />

                <Textarea
                  label="Description"
                  placeholder="Brief overview of the day's goals..."
                  value={day.description || ''}
                  onChange={(e) => updateDay(dayIndex, (current) => ({ ...current, description: e.target.value }))}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-[#403d39] inline-flex items-center gap-2">
                      <ActivityIcon className="w-4 h-4 text-[#e67a00]" />
                      Activities &amp; Schedule
                    </h4>
                    <button
                      type="button"
                      className="text-[#e67a00] font-semibold"
                      onClick={() => updateDay(dayIndex, (current) => ({
                        ...current,
                        activities: [...current.activities, { time: '08:00 AM', title: '', description: '', location: '' }],
                      }))}
                    >
                      + Add Activity
                    </button>
                  </div>

                  {day.activities.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-[#d8d2cb] text-center py-5 text-[#8d8882] italic">
                      No activities added yet.
                    </div>
                  )}

                  {day.activities.map((activity, activityIndex) => (
                    <div key={`${day.day}-${activityIndex}`} className="rounded-2xl border border-[#d2cdc6] bg-[#f7f5f2] p-3">
                      <div className="grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)_24px] gap-2 items-start">
                        <div>
                          <ThemedTimeSelector
                            value={activity.time || '08:00 AM'}
                            onChange={(nextTime) => updateDay(dayIndex, (current) => {
                              const activities = [...current.activities];
                              activities[activityIndex] = { ...activities[activityIndex], time: nextTime };
                              return { ...current, activities };
                            })}
                          />
                        </div>
                        <div className="space-y-2 min-w-0">
                          <Input
                            placeholder="Activity title"
                            value={activity.title}
                            onChange={(e) => updateDay(dayIndex, (current) => {
                              const activities = [...current.activities];
                              activities[activityIndex] = { ...activities[activityIndex], title: e.target.value };
                              return { ...current, activities };
                            })}
                          />
                          <Input
                            placeholder="Location or details"
                            value={activity.location || activity.description || ''}
                            onChange={(e) => updateDay(dayIndex, (current) => {
                              const activities = [...current.activities];
                              activities[activityIndex] = { ...activities[activityIndex], location: e.target.value, description: e.target.value };
                              return { ...current, activities };
                            })}
                          />
                        </div>
                        <button
                          type="button"
                          className="text-[#cf5a4f] text-sm pt-2 justify-self-end"
                          onClick={() => updateDay(dayIndex, (current) => ({
                            ...current,
                            activities: current.activities.filter((_, index) => index !== activityIndex),
                          }))}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="rounded-2xl border border-[#d2cdc6] bg-[#f7f5f2] overflow-visible">
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left"
                      onClick={() => setExpandedSubBlocks((prev) => ({
                        ...prev,
                        [day.day]: {
                          ...(prev[day.day] || { accommodation: true, meals: true, weather: true }),
                          accommodation: !(prev[day.day]?.accommodation ?? true),
                        },
                      }))}
                    >
                      <h4 className="text-sm font-medium text-[#403d39] inline-flex items-center gap-2">
                        <HomeIcon className="w-4 h-4 text-[#e67a00]" />
                        Accommodation
                      </h4>
                    </button>
                    {(expandedSubBlocks[day.day]?.accommodation ?? true) && (
                      <div className="p-4 space-y-2">
                        <Input
                          placeholder="Name (e.g., Bearpaw Meadow)"
                          value={day.accommodation?.name || ''}
                          onChange={(e) => updateDay(dayIndex, (current) => ({
                            ...current,
                            accommodation: { ...(current.accommodation || { type: 'tent' as const }), name: e.target.value },
                          }))}
                        />
                        <ThemedSingleSelect
                          value={day.accommodation?.type || ''}
                          placeholder="Select Type"
                          onSelect={(value) => updateDay(dayIndex, (current) => ({
                            ...current,
                            accommodation: { ...(current.accommodation || { type: 'tent' as const, name: '' }), type: value as 'tent' | 'hotel' | 'hostel' | 'cabin' | 'airbnb' | 'other' },
                          }))}
                          options={[
                            { value: 'tent', label: 'Tent' },
                            { value: 'hotel', label: 'Hotel' },
                            { value: 'hostel', label: 'Hostel' },
                            { value: 'cabin', label: 'Cabin' },
                            { value: 'airbnb', label: 'Airbnb' },
                            { value: 'other', label: 'Other' },
                          ]}
                        />
                        <Input
                          placeholder="Details (e.g., Site 4, near water)"
                          value={day.accommodation?.notes || ''}
                          onChange={(e) => updateDay(dayIndex, (current) => ({
                            ...current,
                            accommodation: { ...(current.accommodation || { type: 'tent' as const, name: '' }), notes: e.target.value },
                          }))}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#d2cdc6] bg-[#f7f5f2] overflow-visible">
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left"
                      onClick={() => setExpandedSubBlocks((prev) => ({
                        ...prev,
                        [day.day]: {
                          ...(prev[day.day] || { accommodation: true, meals: true, weather: true }),
                          meals: !(prev[day.day]?.meals ?? true),
                        },
                      }))}
                    >
                      <h4 className="text-sm font-medium text-[#403d39] inline-flex items-center gap-2">
                        <UtensilsIcon className="w-4 h-4 text-[#e67a00]" />
                        Meals
                      </h4>
                    </button>
                    {(expandedSubBlocks[day.day]?.meals ?? true) && (
                      <div className="p-4 space-y-2">
                        <Input
                          placeholder="Breakfast"
                          value={day.meals?.breakfast || ''}
                          onChange={(e) => updateDay(dayIndex, (current) => ({
                            ...current,
                            meals: { ...(current.meals || {}), breakfast: e.target.value },
                          }))}
                        />
                        <Input
                          placeholder="Lunch"
                          value={day.meals?.lunch || ''}
                          onChange={(e) => updateDay(dayIndex, (current) => ({
                            ...current,
                            meals: { ...(current.meals || {}), lunch: e.target.value },
                          }))}
                        />
                        <Input
                          placeholder="Dinner"
                          value={day.meals?.dinner || ''}
                          onChange={(e) => updateDay(dayIndex, (current) => ({
                            ...current,
                            meals: { ...(current.meals || {}), dinner: e.target.value },
                          }))}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#d2cdc6] bg-[#f7f5f2] overflow-visible">
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left"
                    onClick={() => setExpandedSubBlocks((prev) => ({
                      ...prev,
                      [day.day]: {
                        ...(prev[day.day] || { accommodation: true, meals: true, weather: true }),
                        weather: !(prev[day.day]?.weather ?? true),
                      },
                    }))}
                  >
                    <h4 className="text-sm font-medium text-[#403d39] inline-flex items-center gap-2">
                      <SunIcon className="w-4 h-4 text-[#e67a00]" />
                      Weather Forecast
                    </h4>
                  </button>
                  {(expandedSubBlocks[day.day]?.weather ?? true) && (
                    <div className="p-4 space-y-3">
                      <div className="flex flex-col md:flex-row gap-2 md:items-end">
                        <div className="flex-1">
                          <Input
                            label="Coordinates"
                            placeholder="e.g., 36.554, -118.749"
                            value={weatherCoordsByDay[day.day] || ''}
                            onChange={(e) => setWeatherCoordsByDay((prev) => ({ ...prev, [day.day]: e.target.value }))}
                          />
                        </div>
                        <Button
                          className="md:w-[190px] md:h-[44px]"
                          variant="outline"
                          onClick={() => queryDayWeather(day)}
                          disabled={weatherLoadingByDay[day.day]}
                        >
                          <MapPinIcon className="w-4 h-4 mr-2" />
                          {weatherLoadingByDay[day.day] ? 'Querying...' : 'Query Weather'}
                        </Button>
                      </div>

                      {weatherErrorByDay[day.day] && (
                        <p className="text-sm text-[#cf5a4f]">{weatherErrorByDay[day.day]}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          label="High °F"
                          type="number"
                          value={dayWeather?.high ?? weatherDraftByDay[day.day]?.high ?? ''}
                          onChange={(e) => {
                            const nextHigh = e.target.value;
                            setWeatherDraftByDay((prev) => ({
                              ...prev,
                              [day.day]: { ...(prev[day.day] || { high: '', low: '', condition: 'sunny' }), high: nextHigh },
                            }));
                            if (day.date) {
                              upsertWeather(day.date, (current) => ({ ...current, date: day.date!, high: parseInt(nextHigh, 10) || 0 }));
                            }
                          }}
                        />
                        <Input
                          label="Low °F"
                          type="number"
                          value={dayWeather?.low ?? weatherDraftByDay[day.day]?.low ?? ''}
                          onChange={(e) => {
                            const nextLow = e.target.value;
                            setWeatherDraftByDay((prev) => ({
                              ...prev,
                              [day.day]: { ...(prev[day.day] || { high: '', low: '', condition: 'sunny' }), low: nextLow },
                            }));
                            if (day.date) {
                              upsertWeather(day.date, (current) => ({ ...current, date: day.date!, low: parseInt(nextLow, 10) || 0 }));
                            }
                          }}
                        />
                        <ThemedSingleSelect
                          label="Condition"
                          value={dayWeather?.condition || weatherDraftByDay[day.day]?.condition || 'sunny'}
                          onSelect={(value) => {
                            setWeatherDraftByDay((prev) => ({
                              ...prev,
                              [day.day]: { ...(prev[day.day] || { high: '', low: '', condition: 'sunny' }), condition: value as WeatherForecast['condition'] },
                            }));
                            if (day.date) {
                              upsertWeather(day.date, (current) => ({
                                ...current,
                                date: day.date!,
                                condition: value as WeatherForecast['condition'],
                              }));
                            }
                          }}
                          options={WEATHER_CONDITION_OPTIONS.map((condition) => ({ value: condition, label: condition.charAt(0).toUpperCase() + condition.slice(1) }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#ddd8d1] flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-[#d23b36] font-semibold hover:text-[#b32d28] transition-colors"
                    onClick={() => removeDay(dayIndex)}
                  >
                    <TrashIcon className="w-4 h-4" />
                    Remove Day
                  </button>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
function DetailsStep({ tripData, updateShared }: StepProps) {
  const [newPackingItem, setNewPackingItem] = useState({ name: '', category: 'Shelter', essential: false });
  const canAddNewItem = newPackingItem.name.trim().length > 0;

  const packingList = tripData.shared?.packingList || [];

  const updatePackingItem = (index: number, updater: (item: PackingItem) => PackingItem) => {
    updateShared?.({
      packingList: packingList.map((item, idx) => (idx === index ? updater(item) : item)),
    });
  };

  const groupedItems = packingList.reduce<Record<string, PackingItem[]>>((acc, item) => {
    const key = item.category?.trim() || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  const categories = Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));
  const columns = categories.reduce<string[][]>((acc, category, index) => {
    acc[index % 2].push(category);
    return acc;
  }, [[], []]);

  const applyTemplate = (templateName: 'Backpacking' | 'Snow Camping' | 'Car Camping' | 'Day Hiking' | 'Urban Strolling') => {
    const templateSets: Record<typeof templateName, Record<string, string[]>> = {
      Backpacking: DEFAULT_PACKING_ITEMS,
      'Snow Camping': {
        Navigation: ['Beacon', 'Probe'],
        Tools: ['Shovel'],
        'First Aid': ['First aid kit'],
        Shelter: ['4-season tent', 'Snow stakes', 'Ground tarp'],
        Clothing: ['Down parka', 'Shell mitts', 'Thermal layers'],
        Food: ['High-calorie meals', 'Thermos', 'Stove fuel'],
      },
      'Car Camping': {
        Tools: ['Lantern', 'Power bank'],
        'First Aid': ['First aid kit'],
        Comfort: ['Camp chair', 'Cooler', 'Blanket'],
        Shelter: ['Large tent', 'Sleeping pad', 'Pillow'],
        Food: ['Cook set', 'Water jug', 'Snacks'],
      },
      'Day Hiking': {
        Navigation: ['Phone map', 'Trail map'],
        Hydration: ['Water bottle', 'Electrolyte tabs'],
        Food: ['Trail mix', 'Energy bar'],
        Clothing: ['Sun hat', 'Light layer'],
        'First Aid': ['First aid kit'],
        Tools: ['Headlamp', 'Whistle'],
      },
      'Urban Strolling': {
        Navigation: ['City map', 'Transit app'],
        Hydration: ['Water bottle'],
        Comfort: ['Sunglasses', 'Portable fan'],
        Clothing: ['Light jacket', 'Walking shoes'],
        Food: ['Snack'],
        Tools: ['Portable charger'],
      },
    };

    const selected = templateSets[templateName];
    const items: PackingItem[] = [];
    Object.entries(selected).forEach(([category, names]) => {
      names.forEach((name) => {
        items.push({
          id: `${templateName}-${category}-${name}`.toLowerCase().replace(/\s+/g, '-'),
          name,
          category,
          essential: ['Navigation', 'First Aid', 'Tools'].includes(category),
          checked: false,
        });
      });
    });
    updateShared?.({ packingList: items });
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border border-[#d2cdc6] bg-[#f7f5f2] card-shadow">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-4xl text-[#1f1f1f]">Packing List</CardTitle>
              <p className="text-[#6e6963] mt-2">Start from scratch or load a template.</p>
            </div>
            <div className="space-y-2 self-start md:text-right">
              {([
                ['Backpacking', 'Snow Camping', 'Car Camping'],
                ['Day Hiking', 'Urban Strolling'],
              ] as const).map((row, rowIndex) => (
                <div key={`template-row-${rowIndex}`} className="flex flex-wrap gap-2 md:justify-end">
                  {row.map((templateName) => (
                    <button
                      key={templateName}
                      className="px-4 py-2 rounded-full bg-[#ece9e4] hover:bg-[#e2ddd6] text-[#3a3835] font-medium"
                      onClick={() => applyTemplate(templateName)}
                    >
                      {templateName}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-[28px] border border-[#d2cdc6] bg-[#f7f5f2] card-shadow">
        <CardHeader>
          <CardTitle className="font-serif text-3xl text-[#1f1f1f]">Add New Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[360px]">
              <Input
                className="h-[54px]"
                label="Item Name"
                placeholder="e.g., Headlamp"
                value={newPackingItem.name}
                onChange={(e) => setNewPackingItem((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="w-[240px]">
              <ThemedSingleSelect
              label="Category"
              value={newPackingItem.category}
              onSelect={(value) => setNewPackingItem((prev) => ({ ...prev, category: value }))}
              options={PACKING_CATEGORY_OPTIONS.map((category) => ({ value: category, label: category }))}
              />
            </div>
            <div className="pb-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-[#403d39] font-medium"
                onClick={() => setNewPackingItem((prev) => ({ ...prev, essential: !prev.essential }))}
              >
                <span className={`w-6 h-6 rounded-md border border-[#d2cdc6] inline-flex items-center justify-center ${newPackingItem.essential ? 'bg-[#f4a100] text-white' : 'bg-[#f7f5f2] text-transparent'}`}>
                  <span className="text-sm leading-none">✓</span>
                </span>
                Essential
              </button>
            </div>
            <div className="pb-1">
              <Button
                disabled={!canAddNewItem}
                className={`${canAddNewItem ? 'bg-[#161312] hover:bg-[#080707]' : 'bg-[#8f8b86] hover:bg-[#8f8b86]'} text-white rounded-2xl px-8`}
                onClick={() => {
                  if (!canAddNewItem) return;
                  updateShared?.({
                    packingList: [
                      ...packingList,
                      {
                        id: createId('packing'),
                        name: newPackingItem.name.trim(),
                        category: newPackingItem.category.trim() || 'Other',
                        checked: false,
                        essential: newPackingItem.essential,
                      },
                    ],
                  });
                  setNewPackingItem({ name: '', category: 'Shelter', essential: false });
                }}
              >
                + Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border border-[#d2cdc6] bg-[#f7f5f2] card-shadow">
        <CardContent className="pt-6">
          {packingList.length === 0 && (
            <div className="min-h-[340px] flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-full border border-[#dfdbd6] flex items-center justify-center mb-6">
                <PackageIcon className="w-12 h-12 text-[#c9c5bf]" />
              </div>
              <h3 className="font-serif text-3xl leading-tight text-[#9a948d] mb-3">
                Your packing list is empty
              </h3>
              <p className="text-[#9a948d] text-lg leading-relaxed max-w-2xl">
                Add items manually above, or load a template to get started quickly.
              </p>
            </div>
          )}
          {packingList.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {columns.map((column, colIndex) => (
                <div key={colIndex} className="space-y-5">
                  {column.map((category) => (
                    <div key={category}>
                      <h4 className="text-[#6e6963] tracking-wide uppercase text-lg font-semibold border-b border-[#ddd8d1] pb-1 mb-2">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {groupedItems[category].map((item) => {
                          const itemIndex = packingList.findIndex((candidate) => candidate.id === item.id);
                          return (
                            <div key={item.id} className="group flex items-center gap-3 rounded-xl bg-[#ece9e4] px-4 py-2">
                              <button
                                type="button"
                                onClick={() => updatePackingItem(itemIndex, (current) => ({ ...current, essential: !current.essential }))}
                                className={item.essential ? 'text-[#f0a000]' : 'text-[#b8b2ab]'}
                              >
                                <StarIcon className="w-4 h-4" />
                              </button>
                              <input
                                className="flex-1 bg-transparent border-0 outline-none text-[#2f2c29]"
                                value={item.name}
                                onChange={(e) => updatePackingItem(itemIndex, (current) => ({ ...current, name: e.target.value }))}
                              />
                              <button
                                type="button"
                                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#d35c4e]"
                                onClick={() => updateShared?.({ packingList: packingList.filter((candidate) => candidate.id !== item.id) })}
                                aria-label={`Remove ${item.name}`}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
interface ReviewStepProps extends StepProps {
  onPublish: () => void;
  isPublishing: boolean;
  canPublish: boolean;
  missingPublishRequirements: string[];
  publishError: string;
}

function ReviewStep({
  tripData,
  onPublish,
  isPublishing,
  canPublish,
  missingPublishRequirements,
  publishError,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border border-border bg-bg-card card-shadow">
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
              <li>• {tripData.itinerary?.reduce((count, day) => count + day.activities.length, 0) || 0} sub-items</li>
              <li>• {tripData.shared?.weather?.length || 0} weather entries</li>
              <li>• {tripData.shared?.packingList?.length || 0} packing items</li>
              <li>• {tripData.mapData?.routes?.length || 0} routes on map</li>
              <li>• {tripData.mapData?.markers?.length || 0} map markers</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] bg-accent-sage/10 border border-accent-sage card-shadow">
        <CardContent>
          <h3 className="font-semibold text-text-primary mb-2">Ready to publish?</h3>
          <p className="text-sm text-text-secondary mb-4">
            Click below to download your trip as a JSON file. Then create a public GitHub Gist
            to share it with others.
          </p>
          {!canPublish && (
            <div className="mb-4 rounded-lg bg-bg-card p-3 text-sm text-accent-rust">
              Missing required fields: {missingPublishRequirements.join(', ')}.
            </div>
          )}
          {publishError && (
            <div className="mb-4 rounded-lg bg-bg-card p-3 text-sm text-accent-rust">
              {publishError}
            </div>
          )}
          <Button onClick={onPublish} disabled={isPublishing || !canPublish} size="lg">
            {isPublishing ? 'Exporting...' : 'Export & Download JSON'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ShareStep({ exportedFileName }: { exportedFileName: string }) {
  const viewUrlTemplate = `${window.location.origin}${window.location.pathname}#/view?gist=YOUR_GIST_ID`;

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border border-border bg-bg-card card-shadow">
        <CardHeader>
          <CardTitle>Share Your Trip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-text-secondary">
            Your JSON has been downloaded{exportedFileName ? ` as ${exportedFileName}` : ''}. Complete these final steps:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-text-primary">
            <li>Go to gist.github.com and create a new public gist.</li>
            <li>Upload your downloaded JSON file (or paste its contents).</li>
            <li>Copy the Gist ID from the gist URL.</li>
            <li>Share this viewer URL with the Gist ID:</li>
          </ol>
          <div className="rounded-lg bg-bg-secondary p-3 text-sm font-mono break-all">
            {viewUrlTemplate}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
