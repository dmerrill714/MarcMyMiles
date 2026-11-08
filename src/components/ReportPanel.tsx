import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildMileageCsv,
  formatReportDateInput,
  formatReportRangeLabel,
  formatVehicleLabel,
  getDrivenVehicles,
  getMileageReportFilename,
  getReportRange,
  getReportTrips,
  parseReportDateInput,
  type ReportKind,
} from '../lib/export';
import {
  advanceMileageLogNumber,
  getNextMileageLogNumber,
} from '../lib/storage';
import type { Trip, Vehicle } from '../lib/types';
import { CheckIcon, DownloadIcon } from './icons';

type ExportStatus = 'idle' | 'saved' | 'error';

interface ReportPanelProps {
  trips: Trip[];
  vehicles: Vehicle[];
}

const REPORT_KINDS: Array<{
  id: ReportKind;
  label: string;
  downloadLabel: string;
}> = [
  { id: 'day', label: 'Day log', downloadLabel: 'day log' },
  { id: 'week', label: 'Week log', downloadLabel: 'week log' },
  { id: 'month', label: 'Month log', downloadLabel: 'month log' },
  { id: 'ytd', label: 'YTD mileage', downloadLabel: 'YTD mileage' },
];

function initialAnchor(): string {
  return formatReportDateInput(Date.now());
}

export function ReportPanel({ trips, vehicles }: ReportPanelProps) {
  const [kind, setKind] = useState<ReportKind>('day');
  const [anchor, setAnchor] = useState(initialAnchor);
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [nextLogNumber, setNextLogNumber] = useState(getNextMileageLogNumber);
  const resetTimer = useRef<number | null>(null);
  const today = formatReportDateInput(Date.now());

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const reportRange = useMemo(() => {
    const anchorDate = parseReportDateInput(anchor) ?? Date.now();
    return getReportRange(kind, anchorDate);
  }, [kind, anchor]);

  const rangeTrips = useMemo(
    () => getReportTrips(trips, reportRange),
    [trips, reportRange],
  );

  const drivenVehicles = useMemo(
    () => getDrivenVehicles(rangeTrips, vehicles),
    [rangeTrips, vehicles],
  );

  const activeKind = REPORT_KINDS.find((option) => option.id === kind)!;
  const tripCountLabel = `${rangeTrips.length} ${
    rangeTrips.length === 1 ? 'trip' : 'trips'
  }`;
  const vehicleNames =
    drivenVehicles.length > 0
      ? drivenVehicles.map(formatVehicleLabel).join(', ')
      : 'none';
  const note =
    kind === 'ytd'
      ? `${tripCountLabel} · Vehicles driven: ${vehicleNames} · Mileage only, totaled per vehicle.`
      : `${tripCountLabel} · Vehicles driven: ${vehicleNames} · Every trip shows miles and drive time.${
          kind === 'week' ? ' Weeks run Sunday through Saturday.' : ''
        }`;

  const clearResetTimer = () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  };

  const selectKind = (nextKind: ReportKind) => {
    clearResetTimer();
    setKind(nextKind);
    setStatus('idle');
  };

  const updateAnchor = (value: string) => {
    if (!value) return;
    clearResetTimer();
    setAnchor(kind === 'month' ? `${value}-01` : value);
    setStatus('idle');
  };

  const handleExport = () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);

    try {
      const logNumber = getNextMileageLogNumber();
      const csv = buildMileageCsv(
        trips,
        vehicles,
        kind,
        reportRange,
        Date.now(),
        logNumber,
      );
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = getMileageReportFilename(kind, reportRange);
      link.rel = 'noopener';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      advanceMileageLogNumber(logNumber);
      setNextLogNumber(getNextMileageLogNumber());
      setStatus('saved');
    } catch {
      setStatus('error');
    }

    resetTimer.current = window.setTimeout(() => setStatus('idle'), 3_000);
  };

  const buttonLabel =
    status === 'saved'
      ? `${
          kind === 'ytd' ? 'YTD mileage' : activeKind.label
        } downloaded`
      : status === 'error'
        ? 'Download failed — try again'
        : `Download ${activeKind.downloadLabel}`;
  const inputValue = kind === 'month' ? anchor.slice(0, 7) : anchor;
  const inputLabel =
    kind === 'month' ? 'Month' : kind === 'week' ? 'Week containing' : 'Day';

  return (
    <section className="report-panel panel" aria-labelledby="report-title">
      <div className="report-head">
        <div>
          <span className="eyebrow">Reports</span>
          <h2 id="report-title">Mileage logs</h2>
          <p>
            Choose a day, week, month, or year-to-date summary. Logs list each trip
            with its vehicle, miles, and drive time.
          </p>
        </div>
        <span className="report-badge">
          <DownloadIcon size={13} /> CSV
        </span>
      </div>

      <div className="report-presets" role="group" aria-label="Report type">
        {REPORT_KINDS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`report-preset ${kind === option.id ? 'active' : ''}`}
            aria-pressed={kind === option.id}
            onClick={() => selectKind(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="report-range report-range-single">
        {kind === 'ytd' ? (
          <div className="report-ytd-range">
            <span>Year to date</span>
            <strong>{formatReportRangeLabel(reportRange)}</strong>
          </div>
        ) : (
          <label className="report-field" htmlFor="report-period">
            <span>{inputLabel}</span>
            <input
              id="report-period"
              type={kind === 'month' ? 'month' : 'date'}
              value={inputValue}
              max={kind === 'month' ? today.slice(0, 7) : today}
              onChange={(event) => updateAnchor(event.target.value)}
            />
          </label>
        )}
      </div>

      {kind !== 'ytd' && (
        <p className="report-period-label">
          {formatReportRangeLabel(reportRange)}
        </p>
      )}

      <button
        type="button"
        className={`report-download ${status}`}
        onClick={handleExport}
        title={
          kind === 'ytd'
            ? 'Download a CSV with year-to-date mileage for each vehicle.'
            : 'Download a CSV log of every trip with its vehicle, miles, and drive time.'
        }
      >
        {status === 'saved' ? <CheckIcon size={17} /> : <DownloadIcon size={17} />}
        <span aria-live="polite">{buttonLabel}</span>
      </button>

      <p className="report-note">
        {note} · Next download: log #{nextLogNumber}.
      </p>
    </section>
  );
}
