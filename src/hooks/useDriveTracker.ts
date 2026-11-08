import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AUTO_START_MPH,
  AUTO_START_SUSTAIN_MS,
  AUTO_STOP_AFTER_MS,
  AUTO_STOP_MPH,
  MAX_FIX_ACCURACY_M,
  MAX_SEGMENT_MPH,
} from '../lib/constants';
import { haversineMiles, MPH_PER_MPS, speedMphForSegment } from '../lib/geo';
import {
  createTripId,
  detectionWasEnabled,
  setDetectionPreference,
} from '../lib/storage';
import type { Trip, TripDraft, Vehicle } from '../lib/types';

export type GpsState = 'off' | 'starting' | 'searching' | 'live' | 'error';
export type MotionState = 'off' | 'unsupported' | 'denied' | 'waiting' | 'active';
export type WakeLockState = 'off' | 'on' | 'unavailable';

export interface DriveTracker {
  enabled: boolean;
  gps: GpsState;
  motion: MotionState;
  wakeLock: WakeLockState;
  speedMph: number;
  accuracyMeters: number | null;
  lastFixAt: number | null;
  currentTrip: TripDraft | null;
  armingSince: number | null;
  error: string | null;
  now: number;
  start: () => void;
  stop: () => void;
}

interface LastFix {
  lat: number;
  lon: number;
  at: number;
  accuracy: number;
}

interface DeviceMotionPermissionEvent {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 1_000,
  timeout: 20_000,
};

export function useDriveTracker(
  onTripComplete: (trip: Trip) => void,
  vehicle: Vehicle | null,
): DriveTracker {
  const [enabled, setEnabled] = useState(false);
  const [gps, setGps] = useState<GpsState>('off');
  const [motion, setMotion] = useState<MotionState>('off');
  const [wakeLock, setWakeLock] = useState<WakeLockState>('off');
  const [speedMph, setSpeedMph] = useState(0);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [lastFixAt, setLastFixAt] = useState<number | null>(null);
  const [currentTrip, setCurrentTrip] = useState<TripDraft | null>(null);
  const [armingSince, setArmingSince] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const onTripCompleteRef = useRef(onTripComplete);
  const vehicleRef = useRef<Vehicle | null>(vehicle);
  const enabledRef = useRef(false);
  const mountedRef = useRef(true);
  const watchIdRef = useRef<number | null>(null);
  const lastFixRef = useRef<LastFix | null>(null);
  const lastFixAtRef = useRef(0);
  const lastProbeRef = useRef(0);
  const speedRef = useRef(0);
  const firstFastAtRef = useRef<number | null>(null);
  const tripRef = useRef<TripDraft | null>(null);
  const belowSinceRef = useRef<number | null>(null);
  const lastMovingRef = useRef<number | null>(null);
  const lastMotionRef = useRef(0);
  const motionTimesRef = useRef<number[]>([]);
  const motionHandlerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const wakeSentinelRef = useRef<WakeLockSentinel | null>(null);
  const processFixRef = useRef<(position: GeolocationPosition) => void>(() => {});

  useEffect(() => {
    onTripCompleteRef.current = onTripComplete;
  }, [onTripComplete]);

  useEffect(() => {
    vehicleRef.current = vehicle;
  }, [vehicle]);

  const beginTrip = useCallback((startedAt: number) => {
    if (tripRef.current) return;

    const activeVehicle = vehicleRef.current;
    if (!activeVehicle) return;

    const draft: TripDraft = {
      id: createTripId(),
      startedAt,
      distanceMiles: 0,
      maxSpeedMph: speedRef.current,
      samples: 0,
      auto: true,
      vehicleId: activeVehicle.id,
      vehicleName: activeVehicle.name,
    };

    tripRef.current = draft;
    belowSinceRef.current = null;
    lastMovingRef.current = startedAt;
    firstFastAtRef.current = null;
    setArmingSince(null);
    setCurrentTrip({ ...draft });
  }, []);

  const finalizeTrip = useCallback((stoppedAt: number) => {
    const draft = tripRef.current;
    if (!draft) return;

    tripRef.current = null;
    belowSinceRef.current = null;
    firstFastAtRef.current = null;
    const endedAt = Math.max(draft.startedAt, lastMovingRef.current ?? stoppedAt);
    lastMovingRef.current = null;
    setCurrentTrip(null);
    setArmingSince(null);

    if (draft.distanceMiles < 0.02 || draft.samples < 2) return;

    const durationHours = Math.max(1_000, endedAt - draft.startedAt) / 3_600_000;
    const averageSpeed = Math.min(120, draft.distanceMiles / durationHours);

    onTripCompleteRef.current({
      ...draft,
      endedAt,
      distanceMiles: Math.round(draft.distanceMiles * 100) / 100,
      maxSpeedMph: Math.round(draft.maxSpeedMph * 10) / 10,
      avgSpeedMph: Math.round(averageSpeed * 10) / 10,
    });
  }, []);

  const removeMotionListener = useCallback(() => {
    if (motionHandlerRef.current) {
      window.removeEventListener('devicemotion', motionHandlerRef.current);
      motionHandlerRef.current = null;
    }
  }, []);

  const shutdown = useCallback(
    (message: string | null) => {
      enabledRef.current = false;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      removeMotionListener();

      if (wakeSentinelRef.current) {
        void wakeSentinelRef.current.release().catch(() => undefined);
        wakeSentinelRef.current = null;
      }

      finalizeTrip(Date.now());

      lastFixRef.current = null;
      lastFixAtRef.current = 0;
      firstFastAtRef.current = null;
      belowSinceRef.current = null;
      lastMovingRef.current = null;
      speedRef.current = 0;
      motionTimesRef.current = [];
      lastMotionRef.current = 0;

      setEnabled(false);
      setGps(message ? 'error' : 'off');
      setError(message);
      setMotion('off');
      setWakeLock('off');
      setSpeedMph(0);
      setAccuracyMeters(null);
      setLastFixAt(null);
      setArmingSince(null);
      setNow(Date.now());
      setDetectionPreference(false);
    },
    [finalizeTrip, removeMotionListener],
  );

  const processFix = useCallback(
    (position: GeolocationPosition) => {
      if (!enabledRef.current) return;

      const { coords } = position;
      if (!Number.isFinite(coords.latitude) || !Number.isFinite(coords.longitude)) return;

      const fixAt =
        Number.isFinite(position.timestamp) && position.timestamp > 0 ? position.timestamp : Date.now();
      const accuracy = Number.isFinite(coords.accuracy) ? coords.accuracy : Number.POSITIVE_INFINITY;
      const previous = lastFixRef.current;

      let segmentMiles = 0;
      let segmentSpeed: number | null = null;
      if (previous && fixAt > previous.at) {
        segmentMiles = haversineMiles(
          previous.lat,
          previous.lon,
          coords.latitude,
          coords.longitude,
        );
        segmentSpeed = speedMphForSegment(segmentMiles, fixAt - previous.at);
      }

      const reportedSpeed =
        typeof coords.speed === 'number' && Number.isFinite(coords.speed) && coords.speed >= 0
          ? coords.speed * MPH_PER_MPS
          : null;

      let speed = reportedSpeed ?? segmentSpeed ?? 0;
      // Some browsers report zero speed while moving; let a plausible GPS segment fill that in.
      if ((reportedSpeed === null || reportedSpeed < 1) && segmentSpeed !== null && segmentSpeed > 3) {
        speed = segmentSpeed;
      }
      if (!Number.isFinite(speed) || speed > 200) speed = 0;

      const nextSpeed = Math.round(speed * 10) / 10;
      const usable = accuracy <= MAX_FIX_ACCURACY_M;
      const previousUsable = previous ? previous.accuracy <= MAX_FIX_ACCURACY_M : false;
      const validSegment =
        usable &&
        previousUsable &&
        segmentSpeed !== null &&
        segmentSpeed <= MAX_SEGMENT_MPH &&
        segmentMiles < 1.5;

      speedRef.current = nextSpeed;
      lastFixRef.current = {
        lat: coords.latitude,
        lon: coords.longitude,
        at: fixAt,
        accuracy,
      };
      lastFixAtRef.current = fixAt;

      setSpeedMph(nextSpeed);
      setAccuracyMeters(Number.isFinite(accuracy) ? Math.round(accuracy) : null);
      setLastFixAt(fixAt);
      setGps('live');
      setError(null);

      const wallNow = Date.now();
      const draft = tripRef.current;

      if (draft) {
        let changed = false;

        if (validSegment) {
          draft.distanceMiles += segmentMiles;
          draft.samples += 1;
          changed = true;
        }

        if (nextSpeed > draft.maxSpeedMph) {
          draft.maxSpeedMph = nextSpeed;
          changed = true;
        }

        if (nextSpeed >= AUTO_STOP_MPH) {
          lastMovingRef.current = wallNow;
          belowSinceRef.current = null;
        } else if (belowSinceRef.current === null) {
          belowSinceRef.current = wallNow;
        }

        if (changed) setCurrentTrip({ ...draft });

        if (
          belowSinceRef.current !== null &&
          wallNow - belowSinceRef.current >= AUTO_STOP_AFTER_MS
        ) {
          finalizeTrip(wallNow);
        }
      } else if (usable) {
        if (nextSpeed >= AUTO_START_MPH) {
          if (firstFastAtRef.current === null) {
            firstFastAtRef.current = wallNow;
            setArmingSince(wallNow);
          } else if (wallNow - firstFastAtRef.current >= AUTO_START_SUSTAIN_MS) {
            beginTrip(firstFastAtRef.current);
          }
        } else if (firstFastAtRef.current !== null) {
          firstFastAtRef.current = null;
          setArmingSince(null);
        }
      } else {
        firstFastAtRef.current = null;
        setArmingSince(null);
      }
    },
    [beginTrip, finalizeTrip],
  );

  useEffect(() => {
    processFixRef.current = processFix;
  }, [processFix]);

  const tick = useCallback(() => {
    if (!enabledRef.current) return;

    const currentTime = Date.now();
    setNow(currentTime);

    if (lastFixAtRef.current > 0 && currentTime - lastFixAtRef.current > 12_000) {
      setGps((previous) => (previous === 'error' ? previous : 'searching'));
      speedRef.current = 0;
      setSpeedMph(0);

      if (!tripRef.current) {
        firstFastAtRef.current = null;
        setArmingSince(null);
      }
    }

    if (lastMotionRef.current > 0 && currentTime - lastMotionRef.current > 5_000) {
      setMotion((previous) => (previous === 'active' ? 'waiting' : previous));
    }

    if (
      tripRef.current &&
      belowSinceRef.current !== null &&
      lastFixAtRef.current > 0 &&
      currentTime - lastFixAtRef.current < 12_000 &&
      currentTime - belowSinceRef.current >= AUTO_STOP_AFTER_MS
    ) {
      finalizeTrip(currentTime);
    }
  }, [finalizeTrip]);

  const attachMotionListener = useCallback(() => {
    removeMotionListener();

    const handler = (event: DeviceMotionEvent) => {
      if (!enabledRef.current) return;

      const acceleration = event.accelerationIncludingGravity ?? event.acceleration;
      if (
        !acceleration ||
        typeof acceleration.x !== 'number' ||
        typeof acceleration.y !== 'number' ||
        typeof acceleration.z !== 'number'
      ) {
        return;
      }

      const magnitude = Math.sqrt(
        acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2,
      );
      const movement = Math.abs(magnitude - 9.80665);
      if (movement < 0.9) return;

      const motionTime = Date.now();
      const recent = motionTimesRef.current.filter((time) => motionTime - time < 2_000);
      recent.push(motionTime);
      motionTimesRef.current = recent;

      if (recent.length < 5) return;

      lastMotionRef.current = motionTime;
      setMotion((previous) => (previous === 'active' ? previous : 'active'));

      if (
        navigator.geolocation &&
        motionTime - lastFixAtRef.current > 5_000 &&
        motionTime - lastProbeRef.current > 6_000
      ) {
        lastProbeRef.current = motionTime;
        navigator.geolocation.getCurrentPosition(
          processFixRef.current,
          () => undefined,
          { enableHighAccuracy: true, maximumAge: 0, timeout: 12_000 },
        );
      }
    };

    motionHandlerRef.current = handler;
    window.addEventListener('devicemotion', handler);
  }, [removeMotionListener]);

  const enableMotion = useCallback(
    async (askPermission: boolean) => {
      if (typeof window.DeviceMotionEvent === 'undefined') {
        setMotion('unsupported');
        return;
      }

      const motionEvent = window.DeviceMotionEvent as unknown as DeviceMotionPermissionEvent;

      if (motionEvent.requestPermission) {
        if (!askPermission) {
          attachMotionListener();
          setMotion('waiting');
          return;
        }

        try {
          const permission = await motionEvent.requestPermission();
          if (!mountedRef.current) return;
          if (permission !== 'granted') {
            setMotion('denied');
            return;
          }
        } catch {
          if (mountedRef.current) setMotion('denied');
          return;
        }
      }

      if (!mountedRef.current) return;
      attachMotionListener();
      setMotion('waiting');
    },
    [attachMotionListener],
  );

  const acquireWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator) || !navigator.wakeLock) {
      setWakeLock('unavailable');
      return;
    }

    try {
      const sentinel = await navigator.wakeLock.request('screen');
      if (!mountedRef.current || !enabledRef.current) {
        void sentinel.release().catch(() => undefined);
        return;
      }

      wakeSentinelRef.current = sentinel;
      setWakeLock('on');
      sentinel.addEventListener('release', () => {
        wakeSentinelRef.current = null;
        if (enabledRef.current && mountedRef.current) setWakeLock('off');
      });
    } catch {
      if (mountedRef.current) setWakeLock('unavailable');
    }
  }, []);

  const onGeoError = useCallback(
    (geoError: GeolocationPositionError) => {
      if (!enabledRef.current) return;

      if (geoError.code === geoError.PERMISSION_DENIED) {
        shutdown(
          'Location access is blocked. Allow precise location for MarcMyMiles in your browser settings, then try again.',
        );
        return;
      }

      setGps('searching');
      setSpeedMph(0);
      speedRef.current = 0;
      setError(
        geoError.code === geoError.TIMEOUT
          ? 'GPS is taking longer than usual. Keep the app open and move near a window.'
          : 'GPS signal lost. MarcMyMiles is still trying to reconnect.',
      );
    },
    [shutdown],
  );

  const startTracking = useCallback(
    (askMotionPermission: boolean) => {
      if (enabledRef.current) return;

      if (!vehicleRef.current) {
        setGps('error');
        setError('Add a vehicle in your garage before starting detection.');
        return;
      }

      if (!('geolocation' in navigator)) {
        setGps('error');
        setError('This browser does not support location tracking.');
        return;
      }

      enabledRef.current = true;
      setEnabled(true);
      setGps('starting');
      setError(null);
      setSpeedMph(0);
      setNow(Date.now());
      setDetectionPreference(true);

      void enableMotion(askMotionPermission);
      void acquireWakeLock();

      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          processFixRef.current,
          onGeoError,
          GEOLOCATION_OPTIONS,
        );

        navigator.geolocation.getCurrentPosition(
          processFixRef.current,
          onGeoError,
          GEOLOCATION_OPTIONS,
        );
      } catch {
        shutdown('Location tracking could not start on this device.');
      }
    },
    [acquireWakeLock, enableMotion, onGeoError, shutdown],
  );

  const start = useCallback(() => startTracking(true), [startTracking]);
  const stop = useCallback(() => shutdown(null), [shutdown]);

  useEffect(() => {
    if (!enabled) return;

    setNow(Date.now());
    const intervalId = window.setInterval(tick, 1_000);
    return () => window.clearInterval(intervalId);
  }, [enabled, tick]);

  useEffect(() => {
    if (!detectionWasEnabled() || !vehicle) return;

    const timeoutId = window.setTimeout(() => {
      if (!enabledRef.current) startTracking(false);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [startTracking, vehicle]);

  useEffect(() => {
    const handleVisibility = () => {
      if (
        document.visibilityState === 'visible' &&
        enabledRef.current &&
        !wakeSentinelRef.current
      ) {
        void acquireWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [acquireWakeLock]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      enabledRef.current = false;

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      removeMotionListener();

      if (wakeSentinelRef.current) {
        void wakeSentinelRef.current.release().catch(() => undefined);
        wakeSentinelRef.current = null;
      }
    };
  }, [removeMotionListener]);

  return {
    enabled,
    gps,
    motion,
    wakeLock,
    speedMph,
    accuracyMeters,
    lastFixAt,
    currentTrip,
    armingSince,
    error,
    now,
    start,
    stop,
  };
}
