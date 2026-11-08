import { useCallback, useEffect, useState } from 'react';
import { loadTrips, saveTrips } from '../lib/storage';
import type { Trip, Vehicle } from '../lib/types';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>(() => loadTrips());

  useEffect(() => {
    saveTrips(trips);
  }, [trips]);

  const addTrip = useCallback((trip: Trip) => {
    setTrips((previous) => [trip, ...previous]);
  }, []);

  const removeTrip = useCallback((tripId: string) => {
    setTrips((previous) => previous.filter((trip) => trip.id !== tripId));
  }, []);

  const assignMissingVehicle = useCallback((vehicle: Vehicle) => {
    setTrips((previous) => {
      let changed = false;
      const next = previous.map((trip) => {
        if (trip.vehicleId) return trip;
        changed = true;
        return { ...trip, vehicleId: vehicle.id, vehicleName: vehicle.name };
      });

      return changed ? next : previous;
    });
  }, []);

  return { trips, addTrip, removeTrip, assignMissingVehicle };
}
