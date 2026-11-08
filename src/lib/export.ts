import {
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  summarizeTrips,
} from './stats';
import type { Trip, Vehicle } from './types';

export interface ReportRange {
  /** First day included in the report (local midnight). */
  start: number;
  /** Last day included in the report (local midnight). */
  end: number;
}

export type ReportKind = 'day' | 'week' | 'month' | 'ytd';

interface ReportBounds {
  from: number;
  to: number;
}

interface TripVehicle {
  vehicleId?: string;
  name: string;
  plate: string;
}

interface VehicleGroup extends TripVehicle {
  trips: Trip[];
}

export interface ReportVehicleSummary {
  name: string;
  plate: string;
  trips: number;
  miles: number;
  durationMs: number;
}

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateStamp(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeStamp(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateTimeStamp(timestamp: number): string {
  return `${dateStamp(timestamp)} ${timeStamp(timestamp)}`;
}

function longDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${WEEKDAY_NAMES[date.getDay()]}, ${
    MONTH_NAMES[date.getMonth()]
  } ${date.getDate()}, ${date.getFullYear()}`;
}

function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function fixed(value: number, digits: number): string {
  return Number.isFinite(value) ? value.toFixed(digits) : (0).toFixed(digits);
}

function durationMinutes(durationMs: number): number {
  return Math.round(Math.max(0, durationMs) / 60_000);
}

function addDays(timestamp: number, days: number): number {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

function nextMonthStart(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
}

function csvCell(value: string | number): string {
  let text = String(value);

  // Prevent spreadsheet formula injection from user-supplied names and plates.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvLine(cells: Array<string | number>): string {
  return cells.map(csvCell).join(',');
}

/** Parse the YYYY-MM-DD value from a native date input as a local calendar date. */
export function parseReportDateInput(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return startOfDay(date.getTime());
}

/** Parse the YYYY-MM value from a native month input as the first of the month. */
export function parseReportMonthInput(value: string): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return new Date(year, month - 1, 1).getTime();
}

export function formatReportDateInput(timestamp: number): string {
  return dateStamp(timestamp);
}

export function formatReportMonthInput(timestamp: number): string {
  return dateStamp(timestamp).slice(0, 7);
}

export function getReportRange(
  kind: ReportKind,
  anchor = Date.now(),
  now = Date.now(),
): ReportRange {
  if (kind === 'ytd') {
    const today = startOfDay(now);
    return { start: startOfYear(today), end: today };
  }

  const day = startOfDay(anchor);
  if (kind === 'day') {
    return { start: day, end: day };
  }

  if (kind === 'week') {
    const start = startOfWeek(day);
    return { start, end: addDays(start, 6) };
  }

  const start = startOfMonth(day);
  return { start, end: addDays(nextMonthStart(start), -1) };
}

export function getReportTitle(kind: ReportKind): string {
  if (kind === 'day') return 'Day log';
  if (kind === 'week') return 'Week log';
  if (kind === 'month') return 'Month log';
  return 'Year-to-date mileage';
}

/** A readable date or date range for the selected report period. */
export function formatReportRangeLabel(range: ReportRange): string {
  if (dateStamp(range.start) === dateStamp(range.end)) {
    return longDate(range.start);
  }

  const from = new Date(range.start);
  const to = new Date(range.end);

  if (from.getFullYear() === to.getFullYear()) {
    return `${WEEKDAY_NAMES[from.getDay()]}, ${
      MONTH_NAMES[from.getMonth()]
    } ${from.getDate()} – ${WEEKDAY_NAMES[to.getDay()]}, ${
      MONTH_NAMES[to.getMonth()]
    } ${to.getDate()}, ${from.getFullYear()}`;
  }

  return `${longDate(range.start)} – ${longDate(range.end)}`;
}

/** The period named in the report file. */
export function formatReportPeriod(kind: ReportKind, range: ReportRange): string {
  if (kind === 'day') return longDate(range.start);
  if (kind === 'month') {
    const date = new Date(range.start);
    return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  }
  if (kind === 'ytd') {
    return `${new Date(range.start).getFullYear()} year to date`;
  }

  return formatReportRangeLabel(range);
}

function getReportBounds(range: ReportRange): ReportBounds {
  if (!Number.isFinite(range.start) || !Number.isFinite(range.end)) {
    throw new RangeError('Report dates must be valid.');
  }

  const from = startOfDay(range.start);
  const to = addDays(startOfDay(range.end), 1);

  if (from >= to) {
    throw new RangeError('The report start date must be on or before the end date.');
  }

  return { from, to };
}

export function getReportTrips(trips: Trip[], range: ReportRange): Trip[] {
  const { from, to } = getReportBounds(range);
  return trips.filter((trip) => trip.startedAt >= from && trip.startedAt < to);
}

export function formatVehicleLabel(vehicle: { name: string; plate?: string }): string {
  const plate = vehicle.plate?.trim();
  return plate ? `${vehicle.name} (${plate})` : vehicle.name;
}

function resolveTripVehicle(
  trip: Trip,
  vehicleById: Map<string, Vehicle>,
): TripVehicle {
  const vehicle = trip.vehicleId ? vehicleById.get(trip.vehicleId) : undefined;

  return {
    vehicleId: vehicle?.id ?? trip.vehicleId,
    name: vehicle?.name ?? (trip.vehicleName?.trim() || 'Unassigned'),
    plate: vehicle?.plate?.trim() ?? '',
  };
}

function buildVehicleGroups(
  rangeTrips: Trip[],
  vehicles: Vehicle[],
): VehicleGroup[] {
  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const groups = new Map<string, VehicleGroup>();

  for (const trip of rangeTrips) {
    const details = resolveTripVehicle(trip, vehicleById);
    const key = details.vehicleId
      ? `id:${details.vehicleId}`
      : `name:${details.name.toLowerCase()}|${details.plate.toLowerCase()}`;
    const group = groups.get(key) ?? { ...details, trips: [] };

    group.trips.push(trip);
    groups.set(key, group);
  }

  const vehicleOrder = new Map(
    vehicles.map((vehicle, index) => [vehicle.id, index]),
  );

  return [...groups.values()].sort((a, b) => {
    const aOrder = a.vehicleId ? vehicleOrder.get(a.vehicleId) : undefined;
    const bOrder = b.vehicleId ? vehicleOrder.get(b.vehicleId) : undefined;

    if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });
}

/** Vehicles with at least one trip in the supplied set, in garage order. */
export function getDrivenVehicles(
  rangeTrips: Trip[],
  vehicles: Vehicle[],
): ReportVehicleSummary[] {
  return buildVehicleGroups(rangeTrips, vehicles).map((group) => ({
    name: group.name,
    plate: group.plate,
    trips: group.trips.length,
    miles: group.trips.reduce((total, trip) => total + trip.distanceMiles, 0),
    durationMs: group.trips.reduce(
      (total, trip) => total + Math.max(0, trip.endedAt - trip.startedAt),
      0,
    ),
  }));
}

export function getMileageReportFilename(
  kind: ReportKind,
  range: ReportRange,
): string {
  const { from } = getReportBounds(range);

  if (kind === 'day') {
    return `marcmymiles-day-log-${dateStamp(from)}.csv`;
  }
  if (kind === 'week') {
    return `marcmymiles-week-log-${dateStamp(from)}.csv`;
  }
  if (kind === 'month') {
    return `marcmymiles-month-log-${dateStamp(from).slice(0, 7)}.csv`;
  }

  return `marcmymiles-ytd-mileage-${new Date(from).getFullYear()}.csv`;
}

function appendVehicleTotals(
  lines: string[],
  summaries: ReportVehicleSummary[],
): void {
  lines.push(
    '',
    csvLine(['TOTALS BY VEHICLE']),
    csvLine(['Vehicle', 'Plate', 'Trips', 'Miles', 'Total time (min)']),
  );

  if (summaries.length === 0) {
    lines.push(csvLine(['No trips recorded in this period.']));
  }

  for (const summary of summaries) {
    lines.push(
      csvLine([
        summary.name,
        summary.plate,
        summary.trips,
        fixed(summary.miles, 2),
        durationMinutes(summary.durationMs),
      ]),
    );
  }

  const totals = summaries.reduce(
    (total, summary) => ({
      trips: total.trips + summary.trips,
      miles: total.miles + summary.miles,
      durationMs: total.durationMs + summary.durationMs,
    }),
    { trips: 0, miles: 0, durationMs: 0 },
  );

  lines.push(
    csvLine([
      'Total',
      '',
      totals.trips,
      fixed(totals.miles, 2),
      durationMinutes(totals.durationMs),
    ]),
  );
}

export function buildMileageCsv(
  trips: Trip[],
  vehicles: Vehicle[],
  kind: ReportKind,
  range = getReportRange(kind),
  now = Date.now(),
  logNumber = 1,
): string {
  const { from, to } = getReportBounds(range);
  const rangeTrips = trips.filter(
    (trip) => trip.startedAt >= from && trip.startedAt < to,
  );
  const summaries = getDrivenVehicles(rangeTrips, vehicles);
  const totals = summarizeTrips(rangeTrips, from, to);
  const vehicleNames =
    summaries.length > 0
      ? summaries.map(formatVehicleLabel).join('; ')
      : 'None';
  const lines: string[] = [
    csvLine(['MarcMyMiles - Driver Log']),
    csvLine([getReportTitle(kind)]),
    csvLine(['Generated log #', logNumber]),
    csvLine(['Generated', dateTimeStamp(now)]),
    csvLine(['Period', formatReportPeriod(kind, range)]),
    csvLine(['Range', `${dateStamp(from)} through ${dateStamp(to - 1)}`]),
    csvLine(['Vehicles driven', vehicleNames]),
    csvLine(['Trips', totals.trips]),
    csvLine(['Miles', fixed(totals.miles, 2)]),
  ];

  if (kind !== 'ytd') {
    lines.push(csvLine(['Total time (min)', durationMinutes(totals.durationMs)]));
  }

  lines.push(csvLine(['Time zone', localTimeZone()]));
  if (kind === 'week') {
    lines.push(csvLine(['Week starts', 'Sunday']));
  }

  if (kind === 'ytd') {
    lines.push(
      '',
      csvLine(['YEAR-TO-DATE MILEAGE BY VEHICLE']),
      csvLine(['Vehicle', 'Plate', 'Miles']),
    );

    if (summaries.length === 0) {
      lines.push(csvLine(['No mileage recorded this year.']));
    }

    for (const summary of summaries) {
      lines.push(
        csvLine([summary.name, summary.plate, fixed(summary.miles, 2)]),
      );
    }

    lines.push(csvLine(['Total', '', fixed(totals.miles, 2)]));
    return lines.join('\r\n');
  }

  const vehicleById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const sortedTrips = [...rangeTrips].sort((a, b) => a.startedAt - b.startedAt);
  lines.push(
    '',
    csvLine(['TRIP LOG']),
    csvLine([
      'Date',
      'Day',
      'Vehicle',
      'Plate',
      'Start',
      'End',
      'Trip time (min)',
      'Miles',
    ]),
  );

  if (sortedTrips.length === 0) {
    lines.push(csvLine(['No trips recorded in this period.']));
  }

  for (const trip of sortedTrips) {
    const vehicle = resolveTripVehicle(trip, vehicleById);
    const date = new Date(trip.startedAt);

    lines.push(
      csvLine([
        dateStamp(trip.startedAt),
        WEEKDAY_NAMES[date.getDay()],
        vehicle.name,
        vehicle.plate,
        timeStamp(trip.startedAt),
        timeStamp(trip.endedAt),
        durationMinutes(trip.endedAt - trip.startedAt),
        fixed(trip.distanceMiles, 2),
      ]),
    );
  }

  appendVehicleTotals(lines, summaries);
  return lines.join('\r\n');
}
