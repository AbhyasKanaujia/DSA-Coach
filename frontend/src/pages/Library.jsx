import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as libraryApi from '../api/library';
import { extractErrorMessage } from '../api/errors';
import Badge from '../components/Badge';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Library() {
  useDocumentTitle('Library');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [rowError, setRowError] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await libraryApi.list();
      setEntries(data.filter((entry) => entry.collectionId));
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load library'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setRowErr = (id, msg) => setRowError((s) => ({ ...s, [id]: msg }));

  const handleToggleActive = async (entry, nextActive) => {
    const id = String(entry.collectionId._id);
    setPendingId(id);
    setRowErr(id, null);
    try {
      const updated = nextActive
        ? await libraryApi.activate(id)
        : await libraryApi.deactivate(id);
      setEntries((prev) =>
        prev.map((e) =>
          String(e.collectionId._id) === id ? { ...e, isActive: updated.isActive } : e
        )
      );
    } catch (err) {
      setRowErr(id, extractErrorMessage(err, 'Could not update'));
    } finally {
      setPendingId(null);
    }
  };

  const handleUnsubscribe = async (entry) => {
    const id = String(entry.collectionId._id);
    if (!window.confirm(`Unsubscribe from "${entry.collectionId.name}"?`)) return;
    setPendingId(id);
    setRowErr(id, null);
    try {
      await libraryApi.remove(id);
      setEntries((prev) => prev.filter((e) => String(e.collectionId._id) !== id));
    } catch (err) {
      setRowErr(id, extractErrorMessage(err, 'Could not unsubscribe'));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">My library</h1>
        <Link to="/collections" className="text-sm text-text-dim hover:text-text">
          Browse collections →
        </Link>
      </div>
      <p className="mt-1 text-sm text-text-dim">
        Active collections feed your review sessions. Deactivate to pause without losing progress.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-text-dim">Loading…</p>
      ) : entries.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-bg-card p-8 text-center">
          <p className="text-sm text-text-dim">Your library is empty.</p>
          <Link
            to="/collections"
            className="mt-3 inline-block rounded-md border border-accent/60 px-3 py-1.5 text-sm text-accent hover:bg-accent/10"
          >
            Browse collections
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-lg border border-border bg-bg-card">
          {entries.map((entry) => {
            const collection = entry.collectionId;
            const id = String(collection._id);
            const count = collection.problemIds?.length ?? 0;
            const busy = pendingId === id;
            return (
              <li key={id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link to={`/collections/${id}`} className="text-sm font-medium text-text hover:text-accent">
                    {collection.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="neutral">{count} {count === 1 ? 'problem' : 'problems'}</Badge>
                    {entry.isActive ? (
                      <Badge variant="accent">Active</Badge>
                    ) : (
                      <Badge variant="neutral">Paused</Badge>
                    )}
                  </div>
                  {rowError[id] && <p className="mt-2 text-xs text-danger">{rowError[id]}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(entry, !entry.isActive)}
                    disabled={busy}
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-text-dim hover:bg-bg-hover disabled:opacity-50"
                  >
                    {busy ? '…' : entry.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnsubscribe(entry)}
                    disabled={busy}
                    className="rounded-md border border-danger/40 px-3 py-1.5 text-xs text-danger hover:bg-danger/10 disabled:opacity-50"
                  >
                    Unsubscribe
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
