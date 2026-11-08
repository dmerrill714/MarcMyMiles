import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> & { size?: number };

function iconProps(size = 18, props: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  };
}

export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="#141c16" />
      <path d="M11 34.5a17 17 0 1 1 26 0" stroke="#d8ff54" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M24 24l7.2-6" stroke="#f4f7f3" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3.2" fill="#d8ff54" />
    </svg>
  );
}

export function SatelliteIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M4.5 12.5a7 7 0 0 1 7-7" />
      <path d="M4.5 7.5a12 12 0 0 1 12-12" transform="translate(0 5)" />
      <circle cx="7.5" cy="16.5" r="2.5" />
      <path d="M14 14.5a5 5 0 0 0-4.5-4.5" />
    </svg>
  );
}

export function StopIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MotionIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M4 12h3l2-5 3 10 2-5h6" />
    </svg>
  );
}

export function ScreenIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <rect x="6.5" y="3" width="11" height="18" rx="2.5" />
      <path d="M10 6h4" />
    </svg>
  );
}

export function DownloadIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M12 3v11" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 19.5h14" />
    </svg>
  );
}

export function InstallIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M12 6v6" />
      <path d="M9.5 9.5L12 12l2.5-2.5" />
    </svg>
  );
}

export function ShieldIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M12 3l7 3v5c0 4.5-2.8 7.6-7 9-4.2-1.4-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function AlertIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M12 3.5l9 16H3l9-16z" />
      <path d="M12 9v4.5" />
      <path d="M12 16.8h.01" />
    </svg>
  );
}

export function TrashIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6.5 7l.8 13h9.4l.8-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function RoadIcon({ size = 30, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M8 3L4 21" />
      <path d="M16 3l4 18" />
      <path d="M12 5v3M12 12v3M12 19v2" />
    </svg>
  );
}

export function ChevronIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function CarIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M5 16l1.4-5.2A2 2 0 0 1 8.3 9h7.4a2 2 0 0 1 1.9 1.8L19 16" />
      <path d="M4 16h16v2.5H4z" />
      <path d="M7 18.5v1.5M17 18.5V20" />
      <path d="M7 13h10" />
    </svg>
  );
}

export function PlusIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M5 12.5l4.5 4.5L19 6.5" />
    </svg>
  );
}

export function CloseIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...iconProps(size, props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
