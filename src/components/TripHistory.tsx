import { useMemo, useState } from 'react';
import { formatClock, formatDayLabel, formatDuration, formatMiles } from '../lib/format';
import type { Trip } from '../lib/types';
import { ChevronIcon, RoadIcon, TrashIcon } from './icons';

interface TripHistoryProps {
  trips: Trip[];
  onDelete: (tripId: string) => void;
  vehicleName?: string;
}

interface DayGroup {
  key: string;
  label: string;
  miles: number;
  trips: Trip[];
}

const COLLAPSED_COUNT = 6;

function groupByDay(trips: Trip[]): DayGroup[] {
  const groups: DayGroup[] = [];

  for (const trip of trips) {
    const date = new Date(trip.startedAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const lastGroup = groups.at(-1);

    if (lastGroup?.key === key) {
      lastGroup.miles += trip.distanceMiles;
      lastGroup.trips.push(trip);
    } else {
      groups.push({
        key,
        label: formatDayLabel(trip.startedAt),
        miles: trip.distanceMiles,
        trips: [trip],
      });
    }
  }

  return groups;
}

export function TripHistory({ trips, onDelete, vehicleName }: TripHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleTrips = expanded ? trips : trips.slice(0, COLLAPSED_COUNT);
  const groups = useMemo(() => groupByDay(visibleTrips), [visibleTrips]);

  if (trips.length === 0) {
    return (
      <div className="empty-trips">
        <span className="empty-icon">
          <RoadIcon />
        </span>
        <p className="empty-title">The road is waiting.</p>
        <p className="empty-copy">
          Start detection before you pull out. Your first drive over 20 mph
          {vehicleName ? ` in ${vehicleName}` : ''} records itself.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="trip-groups">
        {groups.map((group) => (
          <section className="trip-day" key={group.key}>
            <div className="trip-day-head">
              <span>{group.label}</span>
              <span>{formatMiles(group.miles)} mi</span>
            </div>
            <ul className="trip-list">
              {group.trips.map((trip) => (
                <li className="trip-row" key={trip.id}>
                  <div className="trip-main">
                    <div className="trip-time">{formatClock(trip.startedAt)}</div>
                    <div className="trip-meta">
                      <span className="auto-badge">AUTO</span>
                      <span>{formatDuration(trip.endedAt - trip.startedAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span>peak {Math.round(trip.maxSpeedMph)} mph</span>
                    </div>
                  </div>
                  <div className="trip-distance">
                    <strong>{formatMiles(trip.distanceMiles)}</strong>
                    <span>mi</span>
                  </div>
                  <button
                    type="button"
                    className="trip-delete"
                    aria-label={`Delete drive from ${formatClock(trip.startedAt)}`}
                    onClick={() => {
                      if (window.confirm('Delete this drive? This cannot be undone.')) {
                        onDelete(trip.id);
                      }
                    }}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {trips.length > COLLAPSED_COUNT && (
        <button
          type="button"
          className={`history-toggle ${expanded ? 'expanded' : ''}`}
          onClick={() => setExpanded((previous) => !previous)}
        >
          {expanded ? 'Show recent drives' : `Show all ${trips.length} drives`}
          <ChevronIcon size={14} />
        </button>
      )}
    </>
  );
}
