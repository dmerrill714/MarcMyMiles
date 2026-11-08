import { describe, expect, it } from 'vitest';
import { getStatsByPeriod, startOfWeek, summarizeTrips } from './stats';
import type { Trip } from './types';

function makeTrip(startedAt: number, distanceMiles: number, durationMs = 30 * 60_000): Trip {
  return {
    id: String(startedAt),
    startedAt,
    endedAt: startedAt + durationMs,
    distanceMiles,
    maxSpeedMph: 55,
    avgSpeedMph: 30,
    samples: 30,
    auto: true,
  };
}

const now = new Date(2026, 10, 4, 12, 0, 0).getTime();
const at = (year: number, month: number, day: number, hour = 8) =>
  new Date(year, month, day, hour, 0, 0).getTime();

describe('mileage periods', () => {
  it('starts weeks on Sunday at local midnight', () => {
    const weekStart = new Date(startOfWeek(now));

    expect(weekStart.getDay()).toBe(0);
    expect(weekStart.getDate()).toBe(1);
    expect(weekStart.getMonth()).toBe(10);
    expect(weekStart.getHours()).toBe(0);
    expect(weekStart.getMinutes()).toBe(0);
  });

  it('totals the current week, month, and year independently', () => {
    const monthNow = new Date(2026, 10, 18, 12, 0, 0).getTime();
    const trips = [
      makeTrip(at(2026, 10, 18), 10),
      makeTrip(at(2026, 10, 15), 4.5),
      makeTrip(at(2026, 10, 10), 3),
      makeTrip(at(2026, 9, 31), 2),
      makeTrip(at(2026, 0, 2), 20),
      makeTrip(at(2025, 11, 31), 100),
      makeTrip(at(2027, 0, 1), 50),
    ];

    const stats = getStatsByPeriod(trips, monthNow);

    expect(stats.week.miles).toBeCloseTo(14.5);
    expect(stats.week.trips).toBe(2);
    expect(stats.month.miles).toBeCloseTo(17.5);
    expect(stats.month.trips).toBe(3);
    expect(stats.year.miles).toBeCloseTo(39.5);
    expect(stats.year.trips).toBe(5);
  });

  it('excludes trips outside an explicit end boundary', () => {
    const trips = [makeTrip(at(2026, 10, 1), 2), makeTrip(at(2026, 10, 5), 5)];
    const summary = summarizeTrips(trips, at(2026, 10, 1), at(2026, 10, 5));

    expect(summary.miles).toBe(2);
    expect(summary.trips).toBe(1);
  });

  it('sums trip durations', () => {
    const trips = [makeTrip(at(2026, 10, 4), 1, 20 * 60_000), makeTrip(at(2026, 10, 4), 1, 40 * 60_000)];

    expect(getStatsByPeriod(trips, now).week.durationMs).toBe(60 * 60_000);
  });
});
