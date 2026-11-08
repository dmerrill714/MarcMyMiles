import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  detectPlatform,
  readLocationPermission,
  requestLocationAccess,
  type LocationPermissionState,
} from '../lib/geolocation';
import { CarIcon, LogoMark, SatelliteIcon, ShieldIcon } from './icons';
import { GpsHelp } from './GpsHelp';

interface VehicleSetupProps {
  onAdd: (name: string, plate: string) => void;
}

const PERMISSION_LABELS: Record<LocationPermissionState, string> = {
  granted: 'Allowed',
  denied: 'Blocked',
  prompt: 'Not enabled',
  unsupported: 'Unsupported',
  unknown: 'Not checked',
  error: 'GPS error',
};

const PERMISSION_COPY: Record<LocationPermissionState, string> = {
  granted: 'Location access is allowed. MarcMyMiles can use GPS when detection starts.',
  denied: 'Location is blocked. Follow the steps below, then try GPS again.',
  prompt: 'MarcMyMiles will ask your browser for location access when you tap the button.',
  unsupported: 'This browser cannot provide GPS location. Try Safari or Chrome on your phone.',
  unknown: 'Tap below to request GPS access from your browser.',
  error: 'GPS could not get a fix. Check that Location Services is turned on and try again.',
};

export function VehicleSetup({ onAdd }: VehicleSetupProps) {
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [permission, setPermission] = useState<LocationPermissionState>('unknown');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void readLocationPermission().then((state) => {
      if (active) setPermission(state);
    });

    return () => {
      active = false;
    };
  }, []);

  const askForGps = async () => {
    if (requesting) return;
    setRequesting(true);
    setMessage(null);

    const result = await requestLocationAccess();
    if (!mountedRef.current) return;

    setPermission(result.state);
    setAccuracy(result.accuracyMeters);
    setMessage(result.message);
    setRequesting(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd(name, plate);
  };

  const statusLabel = requesting ? 'Requesting' : PERMISSION_LABELS[permission];
  const platform = detectPlatform();
  const gpsButtonLabel =
    permission === 'granted'
      ? 'Check GPS again'
      : permission === 'denied' || permission === 'error'
        ? 'Try GPS again'
        : 'Allow GPS access';

  return (
    <div className="setup-shell">
      <div className="setup-brand">
        <span className="brand-mark" aria-hidden="true">
          <LogoMark />
        </span>
        <span className="brand-copy">
          <span className="brand-name">
            MARC<span>MYMILES</span>
          </span>
          <span className="brand-tag">Driver Log</span>
        </span>
      </div>

      <section className="setup-panel panel" aria-labelledby="setup-title">
        <span className="eyebrow">First-time setup</span>
        <h1 className="setup-title" id="setup-title">
          What are you driving?
        </h1>
        <p className="setup-copy">
          Add your first vehicle so every automatic trip is filed to the right mileage log. You can
          add more vehicles and switch anytime.
        </p>

        <form className="setup-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field">
              <span className="field-label">Vehicle name</span>
              <input
                className="text-input"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Blue Tacoma"
                maxLength={40}
                autoFocus
                autoComplete="off"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">
                License plate <em>Optional</em>
              </span>
              <input
                className="text-input"
                type="text"
                value={plate}
                onChange={(event) => setPlate(event.target.value)}
                placeholder="ABC 123"
                maxLength={12}
                autoComplete="off"
              />
            </label>
          </div>

          <div className="setup-divider" />

          <section className="gps-access" aria-labelledby="gps-access-title">
            <div className="gps-access-head">
              <span className="gps-access-icon" aria-hidden="true">
                <SatelliteIcon size={19} />
              </span>
              <div className="gps-access-copy">
                <h2 id="gps-access-title">Allow GPS tracking</h2>
                <p>{PERMISSION_COPY[permission]}</p>
              </div>
              <span className={`permission-state ${permission}`} role="status">
                {statusLabel}
              </span>
            </div>

            <button
              type="button"
              className="gps-button"
              onClick={() => void askForGps()}
              disabled={requesting || permission === 'unsupported'}
            >
              <SatelliteIcon size={16} />
              {requesting ? 'Requesting GPS…' : gpsButtonLabel}
            </button>

            {accuracy !== null && permission === 'granted' && (
              <p className="gps-message gps-ready">
                GPS ready{accuracy > 0 ? ` · accurate to about ±${accuracy} m` : ''}.
              </p>
            )}
            {message && <p className="gps-message">{message}</p>}

            <GpsHelp platform={platform} defaultOpen={permission === 'denied'} />
          </section>

          <button type="submit" className="setup-submit" disabled={!name.trim()}>
            <CarIcon size={19} />
            Save vehicle and continue
          </button>
        </form>

        <p className="setup-note">
          <ShieldIcon size={14} />
          Your vehicle list and mileage stay on this phone. You can allow GPS later when you start
          detection if you prefer.
        </p>
      </section>
    </div>
  );
}
