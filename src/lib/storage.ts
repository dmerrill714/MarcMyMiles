import {
  DETECTION_STORAGE_KEY,
  REPORT_LOG_NUMBER_STORAGE_KEY,
  TRIPS_STORAGE_KEY,
} from './constants';
import type { Trip } from './types';

function isTrip(value: unknown): value is Trip {
  if (!value || typeof value !== 'object') return false;
  const trip = value as Record<string, unknown>;

  return (
    typeof trip.id === 'string' &&
    Number.isFinite(trip.startedAt) &&
    Number.isFinite(trip.endedAt) &&
    Number.isFinite(trip.distanceMiles) &&
    Number.isFinite(trip.maxSpeedMph) &&
    Number.isFinite(trip.avgSpeedMph) &&
    Number.isFinite(trip.samples) &&
    typeof trip.auto === 'boolean' &&
    (trip.vehicleId === undefined || typeof trip.vehicleId === 'string') &&
    (trip.vehicleName === undefined || typeof trip.vehicleName === 'string')
  );
}

export function loadTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isTrip).sort((a, b) => b.startedAt - a.startedAt);
  } catch {
    return [];
  }
}

export function saveTrips(trips: Trip[]): void {
  try {
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
  } catch {
    // Storage can be unavailable in private browsing. The app still works for this session.
  }
}

export function detectionWasEnabled(): boolean {
  try {
    return localStorage.getItem(DETECTION_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDetectionPreference(enabled: boolean): void {
  try {
    localStorage.setItem(DETECTION_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // Preference persistence is best-effort.
  }
}

export function getNextMileageLogNumber(): number {
  try {
    const raw = localStorage.getItem(REPORT_LOG_NUMBER_STORAGE_KEY);
    if (!raw) return 1;

    const next = Number(raw);
    return Number.isSafeInteger(next) && next > 0 ? next : 1;
  } catch {
    return 1;
  }
}

export function advanceMileageLogNumber(logNumber: number): void {
  const next =
    Number.isSafeInteger(logNumber) &&
    logNumber > 0 &&
    logNumber < Number.MAX_SAFE_INTEGER
      ? logNumber + 1
      : 1;

  try {
    localStorage.setItem(REPORT_LOG_NUMBER_STORAGE_KEY, String(next));
  } catch {
    // The current download is still valid if storage is unavailable.
  }
}

export function createTripId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `trip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
