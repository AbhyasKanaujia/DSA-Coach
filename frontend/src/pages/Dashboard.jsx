import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import * as progressApi from '../api/progress';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../auth/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await progressApi.get();
        if (!cancelled) setProgress(data);
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err, 'Failed to load progress'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = user?.name ? `Welcome back, ${user.name}` : 'Welcome back';
  const breakdown = progress?.masteryBreakdown || { new: 0, learning: 0, review: 0, mastered: 0 };
  const lastActive = progress?.lastActiveDate
    ? safeFormat(progress.lastActiveDate, 'MMM d, yyyy')
    : '—';

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{greeting}</h1>
          <p className="mt-1 text-sm text-text-dim">
            Practice daily. Understanding follows repetition.
          </p>
        </div>
        <Link
          to="/session"
          className="rounded-md border border-accent/60 bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20"
        >
          Start session →
        </Link>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-text-dim">Loading…</p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total solved" value={progress?.totalSolved ?? 0} />
            <Stat label="Reviews" value={progress?.totalReviewed ?? 0} />
            <Stat label="Streak" value={`${progress?.streak ?? 0}d`} />
            <Stat label="Last active" value={lastActive} small />
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">
              Mastery
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MasteryStat label="New" value={breakdown.new} tone="text-text-dim" />
              <MasteryStat label="Learning" value={breakdown.learning} tone="text-warn" />
              <MasteryStat label="Review" value={breakdown.review} tone="text-accent" />
              <MasteryStat label="Mastered" value={breakdown.mastered} tone="text-accent" />
            </div>
          </section>
        </>
      )}

      <section className="flex flex-wrap gap-3 border-t border-border pt-6 text-sm">
        <Link
          to="/library"
          className="rounded-md border border-border px-3 py-1.5 text-text-dim hover:bg-bg-hover hover:text-text"
        >
          Manage library
        </Link>
        <Link
          to="/collections"
          className="rounded-md border border-border px-3 py-1.5 text-text-dim hover:bg-bg-hover hover:text-text"
        >
          Browse collections
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value, small }) {
  return (
    <div className="rounded-lg border border-border bg-bg-card p-4">
      <div className={`font-semibold text-text ${small ? 'text-base' : 'text-2xl'}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-text-faint">{label}</div>
    </div>
  );
}

function MasteryStat({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-border bg-bg-card p-4">
      <div className={`text-2xl font-semibold ${tone}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-text-faint">{label}</div>
    </div>
  );
}

function safeFormat(value, pattern) {
  try {
    const date = typeof value === 'string' ? parseISO(value) : new Date(value);
    return format(date, pattern);
  } catch {
    return '—';
  }
}
