import { describe, expect, it } from 'vitest';
import type { Trip, Vehicle } from './types';
import {
  filterTripsByVehicle,
  getVehicleInitials,
  makeVehicle,
  removeVehicleFromGarage,
} from './vehicles';

function makeTrip(id: string, vehicleId?: string): Trip {
  return {
    id,
    startedAt: 1_000,
    endedAt: 2_000,
    distanceMiles: 4.2,
    maxSpeedMph: 45,
    avgSpeedMph: 30,
    samples: 10,
    auto: true,
    ...(vehicleId ? { vehicleId } : {}),
  };
}

const garage: Vehicle[] = [
  { id: 'truck', name: 'Truck', createdAt: 1 },
  { id: 'car', name: 'Car', createdAt: 2 },
  { id: 'van', name: 'Van', createdAt: 3 },
];

describe('vehicles', () => {
  it('normalizes the name and plate', () => {
    const vehicle = makeVehicle('  Blue   Tacoma  ', ' ab 123 ');

    expect(vehicle.name).toBe('Blue Tacoma');
    expect(vehicle.plate).toBe('AB 123');
    expect(vehicle.id).toBeTruthy();
    expect(vehicle.createdAt).toBeGreaterThan(0);
  });

  it('rejects an empty vehicle name', () => {
    expect(() => makeVehicle('   ')).toThrow('Vehicle name is required.');
  });

  it('builds one- and two-word initials', () => {
    expect(getVehicleInitials('Tacoma')).toBe('TA');
    expect(getVehicleInitials('Blue Tacoma')).toBe('BT');
    expect(getVehicleInitials('The big white work van')).toBe('TV');
  });

  it('filters trips to one vehicle', () => {
    const trips = [makeTrip('a', 'truck'), makeTrip('b', 'car'), makeTrip('c')];

    expect(filterTripsByVehicle(trips, 'truck').map((trip) => trip.id)).toEqual(['a']);
    expect(filterTripsByVehicle(trips, 'car').map((trip) => trip.id)).toEqual(['b']);
  });

  it('removes a vehicle without changing the active one', () => {
    const result = removeVehicleFromGarage(garage, 'car', 'truck');

    expect(result.vehicles.map((vehicle) => vehicle.id)).toEqual(['truck', 'van']);
    expect(result.activeVehicleId).toBe('truck');
  });

  it('selects the next vehicle when the active one is removed', () => {
    const result = removeVehicleFromGarage(garage, 'car', 'car');

    expect(result.vehicles.map((vehicle) => vehicle.id)).toEqual(['truck', 'van']);
    expect(result.activeVehicleId).toBe('van');
  });

  it('selects the previous vehicle when the last active one is removed', () => {
    const result = removeVehicleFromGarage(garage, 'van', 'van');

    expect(result.activeVehicleId).toBe('car');
  });

  it('clears the active vehicle when the garage becomes empty', () => {
    const result = removeVehicleFromGarage([garage[0]!], 'truck', 'truck');

    expect(result.vehicles).toEqual([]);
    expect(result.activeVehicleId).toBeNull();
  });

  it('leaves the garage unchanged for an unknown vehicle', () => {
    const result = removeVehicleFromGarage(garage, 'missing', 'truck');

    expect(result.vehicles).toBe(garage);
    expect(result.activeVehicleId).toBe('truck');
  });
});
