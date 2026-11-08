const EARTH_RADIUS_MILES = 3_958.7613;

export const MPH_PER_MPS = 2.2369362920544;

export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRadians;
  const dLon = (lon2 - lon1) * toRadians;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRadians) * Math.cos(lat2 * toRadians) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function speedMphForSegment(distanceMiles: number, elapsedMs: number): number | null {
  if (!Number.isFinite(distanceMiles) || !Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return null;
  }

  return distanceMiles / (elapsedMs / 3_600_000);
}
