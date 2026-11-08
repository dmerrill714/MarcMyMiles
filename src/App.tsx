import { useEffect, useMemo } from 'react';
import { Gauge } from './components/Gauge';
import { ReportPanel } from './components/ReportPanel';
import { GpsHelp } from './components/GpsHelp';
import { InstallButton, InstallPrompt } from './components/InstallPrompt';
import { Stats } from './components/Stats';
import { TripHistory } from './components/TripHistory';
import { VehicleGarage } from './components/VehicleGarage';
import { VehicleSetup } from './components/VehicleSetup';
import {
  AlertIcon,
  CarIcon,
  LogoMark,
  MotionIcon,
  SatelliteIcon,
  ScreenIcon,
  ShieldIcon,
  StopIcon,
} from './components/icons';
import { useDriveTracker, type MotionState, type WakeLockState } from './hooks/useDriveTracker';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { useTrips } from './hooks/useTrips';
import { useVehicles } from './hooks/useVehicles';
import { AUTO_START_MPH, AUTO_START_SUSTAIN_MS } from './lib/constants';
import { formatDuration, formatMiles } from './lib/format';
import { getStatsByPeriod } from './lib/stats';
import { filterTripsByVehicle } from './lib/vehicles';

const MOTION_LABELS: Record<MotionState, string> = {
  off: 'Idle',
  unsupported: 'GPS only',
  denied: 'Blocked',
  waiting: 'Listening',
  active: 'Motion detected',
};

const WAKE_LABELS: Record<WakeLockState, string> = {
  off: 'Released',
  on: 'Kept awake',
  unavailable: 'Not supported',
};

export default function App() {
  const { vehicles, activeVehicle, addVehicle, selectVehicle, removeVehicle } = useVehicles();
  const { trips, addTrip, removeTrip, assignMissingVehicle } = useTrips();
  const tracker = useDriveTracker(addTrip, activeVehicle);
  const install = useInstallPrompt(Boolean(activeVehicle));

  useEffect(() => {
    if (activeVehicle) assignMissingVehicle(activeVehicle);
  }, [activeVehicle, assignMissingVehicle]);

  const vehicleTrips = useMemo(
    () => (activeVehicle ? filterTripsByVehicle(trips, activeVehicle.id) : []),
    [trips, activeVehicle],
  );
  const stats = useMemo(() => getStatsByPeriod(vehicleTrips, Date.now()), [vehicleTrips]);

  const currentTrip = tracker.currentTrip;
  const armingSeconds =
    tracker.armingSince === null
      ? 0
      : Math.max(
          0,
          Math.ceil((AUTO_START_SUSTAIN_MS - (tracker.now - tracker.armingSince)) / 1_000),
        );
  const elapsed = currentTrip ? Math.max(0, tracker.now - currentTrip.startedAt) : 0;

  let sensorChip = { label: 'Sensors off', tone: 'idle' };
  if (tracker.gps === 'error') {
    sensorChip = { label: 'GPS error', tone: 'danger' };
  } else if (currentTrip) {
    sensorChip = { label: 'Recording', tone: 'recording' };
  } else if (tracker.enabled && tracker.gps === 'live') {
    sensorChip = { label: 'GPS live', tone: 'live' };
  } else if (tracker.enabled) {
    sensorChip = { label: 'Acquiring GPS', tone: 'waiting' };
  }

  const gpsReadout =
    !tracker.enabled
      ? 'GPS standby'
      : tracker.gps === 'error'
        ? 'GPS unavailable'
        : tracker.gps === 'live' && tracker.accuracyMeters !== null
          ? `±${tracker.accuracyMeters} m`
          : 'Acquiring fix';

  const dashboard = activeVehicle ? (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
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

        <div className={`status-chip ${sensorChip.tone}`}>
          <span className="status-dot" aria-hidden="true" />
          {sensorChip.label}
        </div>
      </header>

      <InstallButton controller={install} />

      <VehicleGarage
        vehicles={vehicles}
        activeVehicle={activeVehicle}
        onSelect={selectVehicle}
        onAdd={addVehicle}
        onRemove={removeVehicle}
        recordingVehicleId={currentTrip?.vehicleId ?? null}
        recordingVehicleName={currentTrip?.vehicleName ?? null}
      />

      <main className="workspace">
        <section className="drive-column" aria-label="Drive detection">
          <div className="hero panel">
            <div className="hero-top">
              <span className="eyebrow">Live speed</span>
              <span className="gps-readout">
                <span className={`gps-bars ${tracker.gps === 'live' ? 'active' : ''}`} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                {gpsReadout}
              </span>
            </div>

            <Gauge
              speedMph={tracker.speedMph}
              enabled={tracker.enabled}
              gps={tracker.gps}
              currentTrip={currentTrip}
              armingSeconds={armingSeconds}
            />

            {currentTrip ? (
              <>
                {currentTrip.vehicleName && (
                  <div className="live-vehicle">
                    <CarIcon size={14} />
                    Recording to <strong>{currentTrip.vehicleName}</strong>
                  </div>
                )}
                <div className="live-drive">
                  <div className="live-metric">
                    <span>This drive</span>
                    <strong>
                      {formatMiles(currentTrip.distanceMiles, 2)}
                      <small>mi</small>
                    </strong>
                  </div>
                  <div className="live-metric">
                    <span>Elapsed</span>
                    <strong>{formatDuration(elapsed)}</strong>
                  </div>
                  <div className="live-metric">
                    <span>Peak</span>
                    <strong>
                      {Math.round(currentTrip.maxSpeedMph)}
                      <small>mph</small>
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="armed-line">
                <span
                  className={`mini-dot ${
                    !tracker.enabled ? 'idle' : tracker.gps === 'live' ? 'live' : 'waiting'
                  }`}
                  aria-hidden="true"
                />
                <span>
                  {!tracker.enabled
                    ? 'Start detection to arm automatic recording.'
                    : tracker.gps === 'searching'
                      ? 'Looking for a clear GPS signal…'
                      : tracker.gps === 'error'
                        ? 'Location is unavailable.'
                        : armingSeconds > 0
                          ? `Hold ${AUTO_START_MPH}+ mph for ${armingSeconds} more ${
                              armingSeconds === 1 ? 'second' : 'seconds'
                            }.`
                          : `Auto-start armed at ${AUTO_START_MPH} mph for 5 seconds.`}
                </span>
              </div>
            )}

            {tracker.error && (
              <div className="alert" role="alert">
                <AlertIcon size={16} />
                <span>{tracker.error}</span>
              </div>
            )}

            <button
              type="button"
              className={`track-button ${tracker.enabled ? 'stop' : ''}`}
              onClick={tracker.enabled ? tracker.stop : tracker.start}
            >
              {tracker.enabled ? <StopIcon /> : <SatelliteIcon />}
              <span>{tracker.enabled ? 'Stop detection' : 'Start drive detection'}</span>
            </button>

            <p className="browser-note">
              <span className="note-mark" aria-hidden="true">
                !
              </span>
              Keep MarcMyMiles open while driving. Mobile browsers pause GPS when the app is
              backgrounded or the screen locks.
            </p>

            <GpsHelp />
          </div>

          <div className="sensor-strip" aria-label="Sensor status">
            <div className="sensor">
              <span className="sensor-label">
                <MotionIcon size={14} /> Motion
              </span>
              <strong>{MOTION_LABELS[tracker.motion]}</strong>
            </div>
            <div className="sensor">
              <span className="sensor-label">
                <ScreenIcon size={14} /> Screen
              </span>
              <strong>{WAKE_LABELS[tracker.wakeLock]}</strong>
            </div>
            <div className="sensor">
              <span className="sensor-label">
                <ShieldIcon size={14} /> Data
              </span>
              <strong>On-device</strong>
            </div>
          </div>
        </section>

        <section className="data-column" aria-label="Mileage totals">
          <div className="section-head">
            <div>
              <h2>Your mileage</h2>
              <p>{activeVehicle.name} · recorded automatically.</p>
            </div>
          </div>

          <Stats stats={stats} year={new Date().getFullYear()} />

          <ReportPanel trips={trips} vehicles={vehicles} />

          <div className="trips-panel panel">
            <div className="panel-head">
              <div>
                <h2>Recent drives</h2>
                <p>
                  {vehicleTrips.length === 0
                    ? `No trips for ${activeVehicle.name}`
                    : `${vehicleTrips.length} ${
                        vehicleTrips.length === 1 ? 'trip' : 'trips'
                      } recorded`}
                </p>
              </div>
              <span className="local-pill">
                <ShieldIcon size={12} /> Local
              </span>
            </div>
            <TripHistory
              trips={vehicleTrips}
              onDelete={removeTrip}
              vehicleName={activeVehicle.name}
            />
          </div>

          <div className="guide">
            <div className="guide-head">
              <span className="eyebrow">The rules</span>
              <h2>Set it. Drive. Forget it.</h2>
            </div>
            <div className="steps">
              <div className="step">
                <span className="step-num">01</span>
                <p>
                  <strong>20+ mph for 5 seconds</strong> arms the recorder and starts logging miles
                  automatically.
                </p>
              </div>
              <div className="step">
                <span className="step-num">02</span>
                <p>
                  <strong>2 minutes below 3 mph</strong> ends the drive, so short stops and
                  traffic lights do not split a trip.
                </p>
              </div>
              <div className="step">
                <span className="step-num">03</span>
                <p>
                  Totals roll up by <strong>Sunday-to-Saturday week</strong>, calendar month, and
                  calendar year to date.
                </p>
              </div>
            </div>
            <p className="guide-note">
              Distance comes from GPS fixes and is an estimate. Accuracy varies with signal and
              phone placement. MarcMyMiles does not replace your odometer for billing or tax records.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>MARCMYMILES</span>
        <span>GPS + motion · Nothing leaves this device</span>
      </footer>
    </div>
  ) : (
    <VehicleSetup onAdd={addVehicle} />
  );

  return (
    <>
      {dashboard}
      <InstallPrompt controller={install} />
    </>
  );
}
