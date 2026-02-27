import { useMemo, useState, useRef } from 'react';
import type { ElevationPoint } from '../../types';
import { metersToFeet, kmToMiles } from '../../utils/gpx';

interface ElevationProfileProps {
  data: ElevationPoint[];
  unit?: 'metric' | 'imperial';
  height?: number;
  highlightRange?: { start: number; end: number };
  className?: string;
}

export function ElevationProfile({
  data,
  unit = 'imperial',
  height = 200,
  highlightRange,
  className = '',
}: ElevationProfileProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    distance: number;
    elevation: number;
  } | null>(null);

  // Chart dimensions
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = 800;
  const chartHeight = height;
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  // Convert data based on unit preference
  const convertedData = useMemo(() => {
    return data.map((point) => ({
      distance: unit === 'imperial' ? kmToMiles(point.distance) : point.distance,
      elevation: unit === 'imperial' ? metersToFeet(point.elevation) : point.elevation,
    }));
  }, [data, unit]);

  // Calculate scales
  const { xScale, yScale, minEle, maxEle } = useMemo(() => {
    if (convertedData.length === 0) {
      return {
        xScale: () => 0,
        yScale: () => 0,
        minEle: 0,
        maxEle: 0,
      };
    }

    const distances = convertedData.map((d) => d.distance);
    const elevations = convertedData.map((d) => d.elevation);

    const maxDist = Math.max(...distances);
    const minEle = Math.min(...elevations);
    const maxEle = Math.max(...elevations);

    // Add some padding to elevation
    const elePadding = (maxEle - minEle) * 0.1;

    const xScale = (d: number) => (d / maxDist) * innerWidth;
    const yScale = (e: number) =>
      innerHeight - ((e - (minEle - elePadding)) / (maxEle - minEle + elePadding * 2)) * innerHeight;

    return { xScale, yScale, minEle, maxEle };
  }, [convertedData, innerWidth, innerHeight]);

  // Generate SVG path
  const pathD = useMemo(() => {
    if (convertedData.length === 0) return '';

    const points = convertedData.map(
      (d) => `${xScale(d.distance)},${yScale(d.elevation)}`
    );

    return `M${points.join('L')}`;
  }, [convertedData, xScale, yScale]);

  // Generate area fill path
  const areaD = useMemo(() => {
    if (convertedData.length === 0) return '';

    const points = convertedData.map(
      (d) => `${xScale(d.distance)},${yScale(d.elevation)}`
    );

    const lastX = xScale(convertedData[convertedData.length - 1].distance);

    return `M0,${innerHeight}L${points.join('L')}L${lastX},${innerHeight}Z`;
  }, [convertedData, xScale, yScale, innerHeight]);

  // Generate highlight area
  const highlightD = useMemo(() => {
    if (!highlightRange || convertedData.length === 0) return '';

    const startDist = unit === 'imperial' ? kmToMiles(highlightRange.start) : highlightRange.start;
    const endDist = unit === 'imperial' ? kmToMiles(highlightRange.end) : highlightRange.end;

    const highlightData = convertedData.filter(
      (d) => d.distance >= startDist && d.distance <= endDist
    );

    if (highlightData.length === 0) return '';

    const points = highlightData.map(
      (d) => `${xScale(d.distance)},${yScale(d.elevation)}`
    );

    const startX = xScale(highlightData[0].distance);
    const endX = xScale(highlightData[highlightData.length - 1].distance);

    return `M${startX},${innerHeight}L${points.join('L')}L${endX},${innerHeight}Z`;
  }, [highlightRange, convertedData, xScale, yScale, unit, innerHeight]);

  // X-axis ticks
  const xTicks = useMemo(() => {
    if (convertedData.length === 0) return [];
    const maxDist = convertedData[convertedData.length - 1]?.distance || 0;
    const tickCount = 5;
    const tickStep = maxDist / tickCount;
    return Array.from({ length: tickCount + 1 }, (_, i) => i * tickStep);
  }, [convertedData]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    if (maxEle === minEle) return [minEle];
    const tickCount = 4;
    const tickStep = (maxEle - minEle) / tickCount;
    return Array.from({ length: tickCount + 1 }, (_, i) => minEle + i * tickStep);
  }, [minEle, maxEle]);

  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || convertedData.length === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - margin.left;

    if (x < 0 || x > innerWidth) {
      setTooltip(null);
      return;
    }

    // Find closest data point
    const maxDist = convertedData[convertedData.length - 1].distance;
    const targetDist = (x / innerWidth) * maxDist;

    let closest = convertedData[0];
    let minDiff = Math.abs(convertedData[0].distance - targetDist);

    for (const point of convertedData) {
      const diff = Math.abs(point.distance - targetDist);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    setTooltip({
      x: xScale(closest.distance) + margin.left,
      y: yScale(closest.elevation) + margin.top,
      distance: closest.distance,
      elevation: closest.elevation,
    });
  };

  const distanceUnit = unit === 'imperial' ? 'mi' : 'km';
  const elevationUnit = unit === 'imperial' ? 'ft' : 'm';

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] bg-bg-secondary rounded-lg ${className}`}>
        <p className="text-text-muted">No elevation data available</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Background */}
        <rect width={chartWidth} height={chartHeight} fill="var(--color-bg-card)" rx={12} />

        {/* Chart area */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {yTicks.map((tick) => (
            <line
              key={tick}
              x1={0}
              y1={yScale(tick)}
              x2={innerWidth}
              y2={yScale(tick)}
              stroke="var(--color-border-light)"
              strokeDasharray="4,4"
            />
          ))}

          {/* Area fill */}
          <path d={areaD} fill="var(--color-accent-sage)" fillOpacity={0.15} />

          {/* Highlight area */}
          {highlightD && (
            <path d={highlightD} fill="var(--color-accent-terracotta)" fillOpacity={0.3} />
          )}

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-accent-sage)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X-axis */}
          <line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={innerHeight}
            stroke="var(--color-border)"
          />

          {/* X-axis ticks */}
          {xTicks.map((tick) => (
            <g key={tick} transform={`translate(${xScale(tick)}, ${innerHeight})`}>
              <line y2={6} stroke="var(--color-border)" />
              <text
                y={20}
                textAnchor="middle"
                fill="var(--color-text-secondary)"
                fontSize={12}
              >
                {tick.toFixed(1)} {distanceUnit}
              </text>
            </g>
          ))}

          {/* Y-axis */}
          <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="var(--color-border)" />

          {/* Y-axis ticks */}
          {yTicks.map((tick) => (
            <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
              <line x2={-6} stroke="var(--color-border)" />
              <text
                x={-10}
                dy="0.32em"
                textAnchor="end"
                fill="var(--color-text-secondary)"
                fontSize={12}
              >
                {Math.round(tick).toLocaleString()} {elevationUnit}
              </text>
            </g>
          ))}

          {/* Tooltip indicator */}
          {tooltip && (
            <>
              <line
                x1={tooltip.x - margin.left}
                y1={0}
                x2={tooltip.x - margin.left}
                y2={innerHeight}
                stroke="var(--color-accent-terracotta)"
                strokeDasharray="4,4"
              />
              <circle
                cx={tooltip.x - margin.left}
                cy={tooltip.y - margin.top}
                r={6}
                fill="var(--color-accent-terracotta)"
                stroke="var(--color-bg-card)"
                strokeWidth={2}
              />
            </>
          )}
        </g>
      </svg>

      {/* Tooltip box */}
      {tooltip && (
        <div
          className="absolute bg-text-primary text-bg-card px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none"
          style={{
            left: Math.min(tooltip.x, chartWidth - 120),
            top: tooltip.y - 60,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-medium">
            {tooltip.elevation.toLocaleString()} {elevationUnit}
          </div>
          <div className="text-text-muted text-xs">
            {tooltip.distance.toFixed(1)} {distanceUnit}
          </div>
        </div>
      )}
    </div>
  );
}
