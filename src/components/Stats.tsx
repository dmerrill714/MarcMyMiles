import { formatDuration, formatMiles } from '../lib/format';
import type { PeriodStats, StatsByPeriod } from '../lib/stats';

interface StatsProps {
  stats: StatsByPeriod;
  year: number;
}

function StatCard({
  label,
  stats,
  featured = false,
}: {
  label: string;
  stats: PeriodStats;
  featured?: boolean;
}) {
  const displayMiles = formatMiles(stats.miles, stats.miles >= 1_000 ? 0 : 1);
  const meta =
    stats.trips === 0
      ? 'No drives yet'
      : `${stats.trips} ${stats.trips === 1 ? 'drive' : 'drives'} · ${formatDuration(stats.durationMs)}`;

  return (
    <article className={`stat-card ${featured ? 'featured' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {displayMiles}
        <small>mi</small>
      </div>
      <div className="stat-meta">{meta}</div>
    </article>
  );
}

export function Stats({ stats, year }: StatsProps) {
  return (
    <div className="stats-grid">
      <StatCard label="This week" stats={stats.week} featured />
      <StatCard label="This month" stats={stats.month} />
      <StatCard label={`YTD ${String(year).slice(-2)}`} stats={stats.year} />
    </div>
  );
}
