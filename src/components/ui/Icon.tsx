type IconProps = { className?: string };

const ic = (className?: string) =>
  `inline-block flex-shrink-0${className ? ` ${className}` : ' w-4 h-4'}`;

const svg = (className: string | undefined, children: React.ReactNode) => (
  <svg
    className={ic(className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

// ── Template icons ────────────────────────────────────────────────────────────

export function BackpackIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M12 2a4 4 0 0 1 4 4v1H8V6a4 4 0 0 1 4-4z" />
    <rect x="4" y="7" width="16" height="14" rx="2" />
    <path d="M9 14h6" />
  </>);
}

export function CarIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M5 17H3a2 2 0 0 1-2-2V9l3-6h12l3 6v6a2 2 0 0 1-2 2h-2" />
    <circle cx="7.5" cy="17.5" r="2.5" />
    <circle cx="16.5" cy="17.5" r="2.5" />
  </>);
}

export function HikerIcon({ className }: IconProps) {
  return svg(className, <>
    <circle cx="12" cy="4" r="2" />
    <path d="m14.5 9-3 1-2 5h3l2-3 2 7H19" />
    <path d="m5 20 2-4 2-2" />
  </>);
}

// ── Stat / info icons ─────────────────────────────────────────────────────────

export function CalendarIcon({ className }: IconProps) {
  return svg(className, <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>);
}

export function MapPinIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M20 10c0 7-8 13-8 13S4 17 4 10a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </>);
}

export function RouteIcon({ className }: IconProps) {
  return svg(className, <>
    <circle cx="6" cy="19" r="3" />
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
    <circle cx="18" cy="5" r="3" />
  </>);
}

export function TrendingUpIcon({ className }: IconProps) {
  return svg(className, <>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </>);
}

export function ClockIcon({ className }: IconProps) {
  return svg(className, <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>);
}

export function ActivityIcon({ className }: IconProps) {
  return svg(className, <>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </>);
}

// ── Weather icons ─────────────────────────────────────────────────────────────

export function SunIcon({ className }: IconProps) {
  return svg(className, <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>);
}

export function CloudIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </>);
}

export function CloudRainIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
    <line x1="8" y1="19" x2="8" y2="21" />
    <line x1="8" y1="13" x2="8" y2="15" />
    <line x1="16" y1="19" x2="16" y2="21" />
    <line x1="16" y1="13" x2="16" y2="15" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="12" y1="15" x2="12" y2="17" />
  </>);
}

export function SnowflakeIcon({ className }: IconProps) {
  return svg(className, <>
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="m20 16-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4" />
  </>);
}

export function WindIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
  </>);
}

export function StormIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
    <polyline points="13 11 9 17 15 17 11 23" />
  </>);
}

// ── Terrain icons ─────────────────────────────────────────────────────────────

export function MountainIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </>);
}

export function TreeIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M12 2 4 14h16L12 2z" />
    <path d="M12 7 5 19h14L12 7z" />
    <rect x="10" y="19" width="4" height="3" />
  </>);
}

export function WavesIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
  </>);
}

export function DesertIcon({ className }: IconProps) {
  return svg(className, <>
    <circle cx="12" cy="8" r="4" />
    <path d="M12 2v1M12 13v1M4.22 4.22l.7.7M19.08 4.22l-.7.7M2 8h1M21 8h1M17 17c0-2.8-2.2-5-5-5s-5 2.2-5 5" />
    <path d="M5 21h14" />
  </>);
}

export function VolcanoIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M8 21H4l4-9h8l4 9h-4" />
    <path d="M12 5v7" />
    <path d="M9 5.5 12 3l3 2.5" />
    <path d="M10 8h4" />
  </>);
}

// ── Section / UI icons ────────────────────────────────────────────────────────

export function CompassIcon({ className }: IconProps) {
  return svg(className, <>
    <circle cx="12" cy="12" r="10" />
    <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
  </>);
}

export function ListIcon({ className }: IconProps) {
  return svg(className, <>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </>);
}

export function PackageIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z" />
    <polyline points="2.32 6.16 12 11 21.68 6.16" />
    <line x1="12" y1="22.76" x2="12" y2="11" />
    <line x1="7" y1="3.5" x2="17" y2="8.5" />
  </>);
}

export function UsersIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>);
}

export function CameraIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </>);
}

export function AlertIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="m10.29 3.86-8.63 14.94A1 1 0 0 0 2.52 20h18.96a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </>);
}

export function StarIcon({ className }: IconProps) {
  return svg(className, <>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </>);
}

export function HomeIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </>);
}

export function TentIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M3 20 12 4l9 16H3z" />
    <path d="M12 4v16" />
    <path d="M9 20 12 8l3 12" />
  </>);
}

export function UtensilsIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <line x1="7" y1="2" x2="7" y2="11" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
  </>);
}

export function CheckIcon({ className }: IconProps) {
  return svg(className, <>
    <polyline points="20 6 9 17 4 12" />
  </>);
}

export function TrashIcon({ className }: IconProps) {
  return svg(className, <>
    <polyline points="3 6 5 6 21 6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </>);
}

export function SaveIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M4 3h13l3 3v15H4z" />
    <path d="M7 3v6h8V3" />
    <rect x="8" y="14" width="8" height="5" rx="1" />
  </>);
}

export function PencilIcon({ className }: IconProps) {
  return svg(className, <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </>);
}

export function ShareIcon({ className }: IconProps) {
  return svg(className, <>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51 15.42 17.49" />
    <path d="M15.41 6.51 8.59 10.49" />
  </>);
}
