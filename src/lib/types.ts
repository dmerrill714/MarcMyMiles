export interface Vehicle {
  id: string;
  name: string;
  plate?: string;
  createdAt: number;
}

export interface Trip {
  id: string;
  startedAt: number;
  endedAt: number;
  distanceMiles: number;
  maxSpeedMph: number;
  avgSpeedMph: number;
  samples: number;
  auto: boolean;
  vehicleId?: string;
  vehicleName?: string;
}

export interface TripDraft {
  id: string;
  startedAt: number;
  distanceMiles: number;
  maxSpeedMph: number;
  samples: number;
  auto: boolean;
  vehicleId?: string;
  vehicleName?: string;
}
