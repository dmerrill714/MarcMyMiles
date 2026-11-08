import { describe, expect, it } from 'vitest';
import {
  buildMileageCsv,
  formatReportDateInput,
  formatReportPeriod,
  formatReportRangeLabel,
  getDrivenVehicles,
  getMileageReportFilename,
  getReportRange,
  getReportTrips,
  parseReportDateInput,
  parseReportMonthInput,
} from './export';
import type { Trip, Vehicle } from './types';

const now = new Date(2026, 10, 4, 12, 0, 0).getTime();
const at = (year: number, month: number, day: number, hour = 8) =>
  new Date(year, month, day, hour, 0, 0).getTime();

function makeTrip(
  vehicleId: string,
  startedAt: number,
  distanceMiles: number,
  durationMinutes: number,
): Trip {
  return {
    id: `${vehicleId}-${startedAt}`,
    startedAt,
    endedAt: startedAt + durationMinutes * 60_000,
    distanceMiles,
    maxSpeedMph: 55,
    avgSpeedMph: 30,
    samples: 30,
    auto: true,
    vehicleId,
  };
}

const vehicles: Vehicle[] = [
  { id: 'truck', name: 'Truck', plate: 'ABC', createdAt: 1 },
  { id: 'car', name: 'Car', createdAt: 2 },
];

const trips: Trip[] = [
  makeTrip('truck', at(2026, 10, 4), 10, 30),
  makeTrip('truck', at(2026, 10, 2), 5, 20),
  makeTrip('car', at(2026, 9, 31), 4, 10),
  makeTrip('car', at(2026, 0, 2), 20, 60),
];

const dayRange = getReportRange('day', at(2026, 10, 4), now);
const weekRange = getReportRange('week', at(2026, 10, 4), now);
const monthRange = getReportRange('month', at(2026, 10, 4), now);
const ytdRange = getReportRange('ytd', now, now);

describe('mileage export', () => {
  it('builds day, week, month, and YTD ranges', () => {
    expect(formatReportDateInput(dayRange.start)).toBe('2026-11-04');
    expect(formatReportDateInput(dayRange.end)).toBe('2026-11-04');
    expect(formatReportDateInput(weekRange.start)).toBe('2026-11-01');
    expect(formatReportDateInput(weekRange.end)).toBe('2026-11-07');
    expect(formatReportDateInput(monthRange.start)).toBe('2026-11-01');
    expect(formatReportDateInput(monthRange.end)).toBe('2026-11-30');
    expect(formatReportDateInput(ytdRange.start)).toBe('2026-01-01');
    expect(formatReportDateInput(ytdRange.end)).toBe('2026-11-04');
  });

  it('labels the selected reporting period', () => {
    expect(formatReportPeriod('day', dayRange)).toBe(
      'Wednesday, November 4, 2026',
    );
    expect(formatReportPeriod('week', weekRange)).toBe(
      'Sunday, November 1 – Saturday, November 7, 2026',
    );
    expect(formatReportPeriod('month', monthRange)).toBe('November 2026');
    expect(formatReportPeriod('ytd', ytdRange)).toBe('2026 year to date');
    expect(formatReportRangeLabel(monthRange)).toBe(
      'Sunday, November 1 – Monday, November 30, 2026',
    );
  });

  it('writes a chronological day log with the vehicle and each trip’s miles and time', () => {
    const csv = buildMileageCsv(trips, vehicles, 'day', dayRange, now);

    expect(csv).toContain('MarcMyMiles - Driver Log');
    expect(csv).toContain('Day log');
    expect(csv).toContain('Generated log #,1');
    expect(csv).toContain('Period,"Wednesday, November 4, 2026"');
    expect(csv).toContain('Vehicles driven,Truck (ABC)');
    expect(csv).toContain('TRIP LOG');
    expect(csv).toContain(
      '2026-11-04,Wednesday,Truck,ABC,08:00,08:30,30,10.00',
    );
    expect(csv).toContain('Truck,ABC,1,10.00,30');
    expect(csv).toContain('Total,,1,10.00,30');
    expect(csv).not.toContain('Car');
  });

  it('writes a week log for Sunday through Saturday', () => {
    const csv = buildMileageCsv(trips, vehicles, 'week', weekRange, now);

    expect(csv).toContain('Week log');
    expect(csv).toContain(
      'Period,"Sunday, November 1 – Saturday, November 7, 2026"',
    );
    expect(csv).toContain('Vehicles driven,Truck (ABC)');
    expect(csv.indexOf('2026-11-02,Monday,Truck,ABC')).toBeGreaterThan(-1);
    expect(csv.indexOf('2026-11-02,Monday,Truck,ABC')).toBeLessThan(
      csv.indexOf('2026-11-04,Wednesday,Truck,ABC'),
    );
    expect(csv).toContain('Truck,ABC,2,15.00,50');
    expect(csv).not.toContain('2026-10-31');
  });

  it('writes a full calendar month log', () => {
    const csv = buildMileageCsv(trips, vehicles, 'month', monthRange, now);

    expect(csv).toContain('Month log');
    expect(csv).toContain('Period,November 2026');
    expect(csv).toContain('Range,2026-11-01 through 2026-11-30');
    expect(csv).toContain('Vehicles driven,Truck (ABC)');
    expect(csv).toContain('2026-11-02,Monday,Truck,ABC,08:00,08:20,20,5.00');
    expect(csv).toContain('2026-11-04,Wednesday,Truck,ABC,08:00,08:30,30,10.00');
    expect(csv).toContain('Total,,2,15.00,50');
  });

  it('writes YTD mileage per vehicle without a trip log', () => {
    const csv = buildMileageCsv(trips, vehicles, 'ytd', ytdRange, now);

    expect(csv).toContain('Year-to-date mileage');
    expect(csv).toContain('Period,2026 year to date');
    expect(csv).toContain('Vehicles driven,Truck (ABC); Car');
    expect(csv).toContain('YEAR-TO-DATE MILEAGE BY VEHICLE');
    expect(csv).toContain('Truck,ABC,15.00');
    expect(csv).toContain('Car,,24.00');
    expect(csv).toContain('Total,,39.00');
    expect(csv).not.toContain('TRIP LOG');
    expect(csv).not.toContain('2026-01-02,Friday,Car');
  });

  it('lists only vehicles with trips, in garage order', () => {
    const summaries = getDrivenVehicles(
      getReportTrips(trips, monthRange),
      vehicles,
    );

    expect(summaries).toEqual([
      { name: 'Truck', plate: 'ABC', trips: 2, miles: 15, durationMs: 3_000_000 },
    ]);
  });

  it('filters the trip log to the selected range', () => {
    expect(getReportTrips(trips, weekRange)).toHaveLength(2);
    expect(getReportTrips(trips, monthRange)).toHaveLength(2);
    expect(getReportTrips(trips, ytdRange)).toHaveLength(4);
  });

  it('escapes commas and quotes in user-supplied names', () => {
    const trickyVehicle: Vehicle[] = [
      { id: 'tricky', name: 'Blue, "Truck"', createdAt: 1 },
    ];
    const trickyTrip = makeTrip('tricky', at(2026, 10, 4), 1, 5);

    expect(
      buildMileageCsv([trickyTrip], trickyVehicle, 'day', dayRange, now),
    ).toContain('"Blue, ""Truck"""');
  });

  it('writes the supplied generated log number', () => {
    const csv = buildMileageCsv(trips, vehicles, 'day', dayRange, now, 27);

    expect(csv).toContain('Generated log #,27');
  });

  it('uses the report type and period in the CSV filename', () => {
    expect(getMileageReportFilename('day', dayRange)).toBe(
      'marcmymiles-day-log-2026-11-04.csv',
    );
    expect(getMileageReportFilename('week', weekRange)).toBe(
      'marcmymiles-week-log-2026-11-01.csv',
    );
    expect(getMileageReportFilename('month', monthRange)).toBe(
      'marcmymiles-month-log-2026-11.csv',
    );
    expect(getMileageReportFilename('ytd', ytdRange)).toBe(
      'marcmymiles-ytd-mileage-2026.csv',
    );
  });

  it('parses native date and month input values as local calendar dates', () => {
    expect(parseReportDateInput('2026-11-04')).toBe(at(2026, 10, 4, 0));
    expect(parseReportDateInput('2026-02-29')).toBeNull();
    expect(parseReportDateInput('2026-13-01')).toBeNull();
    expect(parseReportDateInput('not-a-date')).toBeNull();
    expect(parseReportMonthInput('2026-02')).toBe(at(2026, 1, 1, 0));
    expect(parseReportMonthInput('2026-13')).toBeNull();
    expect(parseReportMonthInput('not-a-month')).toBeNull();
  });
});
