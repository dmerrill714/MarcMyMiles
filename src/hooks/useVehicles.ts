import { useCallback, useEffect, useState } from 'react';
import {
  loadActiveVehicleId,
  loadVehicles,
  makeVehicle,
  removeVehicleFromGarage,
  saveActiveVehicleId,
  saveVehicles,
} from '../lib/vehicles';
import type { Vehicle } from '../lib/types';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadVehicles());
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(() => {
    const storedVehicles = loadVehicles();
    const storedId = loadActiveVehicleId();
    if (storedId && storedVehicles.some((vehicle) => vehicle.id === storedId)) return storedId;
    return storedVehicles[0]?.id ?? null;
  });

  const activeVehicle =
    vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? vehicles[0] ?? null;

  useEffect(() => {
    saveVehicles(vehicles);
  }, [vehicles]);

  useEffect(() => {
    if (activeVehicle && activeVehicle.id !== activeVehicleId) {
      setActiveVehicleId(activeVehicle.id);
    }
  }, [activeVehicle, activeVehicleId]);

  useEffect(() => {
    saveActiveVehicleId(activeVehicle?.id ?? null);
  }, [activeVehicle?.id]);

  const addVehicle = useCallback((name: string, plate = '') => {
    const vehicle = makeVehicle(name, plate);
    setVehicles((previous) => [...previous, vehicle]);
    setActiveVehicleId(vehicle.id);
    return vehicle;
  }, []);

  const selectVehicle = useCallback((vehicleId: string) => {
    setActiveVehicleId(vehicleId);
  }, []);

  const removeVehicle = useCallback(
    (vehicleId: string) => {
      const result = removeVehicleFromGarage(vehicles, vehicleId, activeVehicleId);
      if (result.vehicles === vehicles) return;

      setVehicles(result.vehicles);
      setActiveVehicleId(result.activeVehicleId);
    },
    [vehicles, activeVehicleId],
  );

  return { vehicles, activeVehicle, addVehicle, selectVehicle, removeVehicle };
}
