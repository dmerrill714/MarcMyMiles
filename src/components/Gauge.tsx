import type { CSSProperties } from 'react';
import type { GpsState } from '../hooks/useDriveTracker';
import type { TripDraft } from '../lib/types';

interface GaugeProps {
  speedMph: number;
  enabled: boolean;
  gps: GpsState;
  currentTrip: TripDraft | null;
  armingSeconds: number;
}

type GaugeStyle = CSSProperties & {
  '--sweep': string;
};

export function Gauge({ speedMph, enabled, gps, currentTrip, armingSeconds }: GaugeProps) {
  const speed = Math.max(0, Math.round(speedMph));
  const progress = Math.min(1, speed / 80);
  const sweep = `${progress * 270}deg`;
  const state = currentTrip ? 'driving' : enabled ? 'monitoring' : 'off';

  let label = 'DETECTION OFF';
  if (currentTrip) {
    label = 'AUTO-RECORDING';
  } else if (enabled && gps === 'error') {
    label = 'GPS UNAVAILABLE';
  } else if (enabled && gps === 'starting') {
    label = 'STARTING GPS';
  } else if (enabled && gps === 'searching') {
    label = 'SEARCHING GPS';
  } else if (enabled && armingSeconds > 0) {
    label = `AUTO-START IN ${armingSeconds}S`;
  } else if (enabled) {
    label = 'AUTO-START ARMED';
  }

  return (
    <div
      className={`gauge ${state} ${armingSeconds > 0 ? 'arming' : ''}`}
      style={{ '--sweep': sweep } as GaugeStyle}
      role="img"
      aria-label={`Current speed ${speed} miles per hour. ${label.toLowerCase()}.`}
    >
      <div className="gauge-ring" aria-hidden="true" />
      <div className="gauge-ticks" aria-hidden="true">
        {Array.from({ length: 19 }, (_, index) => (
          <span
            key={index}
            className={`gauge-tick ${index % 3 === 0 ? 'major' : ''}`}
            style={{ transform: `rotate(${(index / 18) * 270}deg)` }}
          />
        ))}
      </div>
      <div
        className="gauge-hand"
        style={{ transform: `rotate(${progress * 270}deg)` }}
        aria-hidden="true"
      >
        <span />
      </div>
      <div className="gauge-center">
        <div className="gauge-speed">{speed}</div>
        <div className="gauge-unit">MPH</div>
        <div className="gauge-rule" aria-hidden="true">
          <span />
        </div>
        <div className="gauge-state">
          <span className="gauge-state-dot" aria-hidden="true" />
          {label}
        </div>
      </div>
    </div>
  );
}
