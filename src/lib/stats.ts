import type { Trip } from './types';

export interface PeriodStats {
  miles: number;
  trips: number;
  durationMs: number;
}

export interface StatsByPeriod {
  week: PeriodStats;
  month: PeriodStats;
  year: PeriodStats;
}

export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function startOfWeek(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - date.getDay());
  return date.getTime();
}

export function startOfMonth(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  date.setDate(1);
  return date.getTime();
}

export function startOfYear(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  date.setMonth(0, 1);
  return date.getTime();
}

export function summarizeTrips(trips: Trip[], from: number, to = Number.POSITIVE_INFINITY): PeriodStats {
  return trips.reduce<PeriodStats>(
    (summary, trip) => {
      if (trip.startedAt < from || trip.startedAt >= to) return summary;

      return {
        miles: summary.miles + trip.distanceMiles,
        trips: summary.trips + 1,
        durationMs: summary.durationMs + Math.max(0, trip.endedAt - trip.startedAt),
      };
    },
    { miles: 0, trips: 0, durationMs: 0 },
  );
}

export function getStatsByPeriod(trips: Trip[], now: number): StatsByPeriod {
  const end = now + 1;

  return {
    week: summarizeTrips(trips, startOfWeek(now), end),
    month: summarizeTrips(trips, startOfMonth(now), end),
    year: summarizeTrips(trips, startOfYear(now), end),
  };
}
