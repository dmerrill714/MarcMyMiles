import { ACTIVE_VEHICLE_STORAGE_KEY, VEHICLES_STORAGE_KEY } from './constants';
import type { Trip, Vehicle } from './types';

function isVehicle(value: unknown): value is Vehicle {
  if (!value || typeof value !== 'object') return false;
  const vehicle = value as Record<string, unknown>;

  return (
    typeof vehicle.id === 'string' &&
    vehicle.id.length > 0 &&
    typeof vehicle.name === 'string' &&
    vehicle.name.trim().length > 0 &&
    Number.isFinite(vehicle.createdAt) &&
    (vehicle.plate === undefined || typeof vehicle.plate === 'string')
  );
}

export function createVehicleId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `vehicle-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function makeVehicle(name: string, plate = ''): Vehicle {
  const cleanName = name.trim().replace(/\s+/g, ' ');
  if (!cleanName) throw new Error('Vehicle name is required.');

  const cleanPlate = plate.trim().replace(/\s+/g, ' ').toUpperCase();

  return {
    id: createVehicleId(),
    name: cleanName,
    ...(cleanPlate ? { plate: cleanPlate } : {}),
    createdAt: Date.now(),
  };
}

export function loadVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(VEHICLES_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isVehicle);
  } catch {
    return [];
  }
}

export function saveVehicles(vehicles: Vehicle[]): void {
  try {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
  } catch {
    // Storage can be unavailable in private browsing. The list stays in memory for this session.
  }
}

export function loadActiveVehicleId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_VEHICLE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveActiveVehicleId(vehicleId: string | null): void {
  try {
    if (vehicleId) {
      localStorage.setItem(ACTIVE_VEHICLE_STORAGE_KEY, vehicleId);
    } else {
      localStorage.removeItem(ACTIVE_VEHICLE_STORAGE_KEY);
    }
  } catch {
    // Best-effort preference persistence.
  }
}

export function getVehicleInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return 'V';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();

  const last = parts[parts.length - 1] ?? first;
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

export function filterTripsByVehicle(trips: Trip[], vehicleId: string): Trip[] {
  return trips.filter((trip) => trip.vehicleId === vehicleId);
}

export function removeVehicleFromGarage(
  vehicles: Vehicle[],
  vehicleId: string,
  activeVehicleId: string | null,
): { vehicles: Vehicle[]; activeVehicleId: string | null } {
  const index = vehicles.findIndex((vehicle) => vehicle.id === vehicleId);
  if (index === -1) return { vehicles, activeVehicleId };

  const remaining = vehicles.filter((vehicle) => vehicle.id !== vehicleId);
  const nextActiveVehicleId =
    activeVehicleId === vehicleId
      ? (remaining[Math.min(index, remaining.length - 1)]?.id ?? null)
      : activeVehicleId;

  return { vehicles: remaining, activeVehicleId: nextActiveVehicleId };
}
