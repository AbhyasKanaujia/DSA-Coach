import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as collectionsApi from '../api/collections';
import * as libraryApi from '../api/library';
import { extractErrorMessage } from '../api/errors';
import Badge from '../components/Badge';
import Pagination from '../components/Pagination';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PAGE_SIZE = 12;

export default function Collections() {
  useDocumentTitle('Browse');
  const [page, setPage] = useState(1);
  const [collections, setCollections] = useState([]);
  const [total, setTotal] = useState(null);
  const [subscribedIds, setSubscribedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [rowError, setRowError] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ items, total }, library] = await Promise.all([
        collectionsApi.list({ page, limit: PAGE_SIZE }),
        libraryApi.list()
      ]);
      setCollections(items);
      setTotal(total);
      setSubscribedIds(
        new Set(
          library
            .filter((entry) => entry.collectionId)
            .map((entry) => String(entry.collectionId._id ?? entry.collectionId))
        )
      );
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to load collections'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (collectionId) => {
    setPendingId(collectionId);
    setRowError((s) => ({ ...s, [collectionId]: null }));
    try {
      await libraryApi.add(collectionId);
      setSubscribedIds((prev) => {
        const next = new Set(prev);
        next.add(collectionId);
        return next;
      });
    } catch (err) {
      setRowError((s) => ({ ...s, [collectionId]: extractErrorMessage(err, 'Could not add') }));
    } finally {
      setPendingId(null);
    }
  };

  const totalPages = total != null ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Browse collections</h1>
        <Link to="/library" className="text-sm text-text-dim hover:text-text">
          My library →
        </Link>
      </div>
      <p className="mt-1 text-sm text-text-dim">Subscribe to a collection to start drilling its problems.</p>

      {error && (
        <p role="alert" className="mt-6 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-text-dim">Loading…</p>
      ) : collections.length === 0 ? (
        <p className="mt-8 text-sm text-text-dim">No collections yet.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => {
            const id = String(c._id);
            const subscribed = subscribedIds.has(id);
            const count = c.problemIds?.length ?? 0;
            return (
              <li
                key={id}
                className="flex flex-col rounded-lg border border-border bg-bg-card p-4 transition-colors hover:bg-bg-hover"
              >
                <Link
                  to={`/collections/${id}`}
                  className="break-words text-base font-semibold text-text hover:text-accent"
                >
                  {c.name}
                </Link>
                {c.description && <p className="mt-1 text-sm text-text-dim line-clamp-2">{c.description}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="neutral">{count} {count === 1 ? 'problem' : 'problems'}</Badge>
                </div>
                <div className="mt-auto pt-4">
                  {subscribed ? (
                    <span className="text-xs font-medium text-accent">In your library</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdd(id)}
                      disabled={pendingId === id}
                      className="rounded-md border border-accent/60 px-3 py-1.5 text-sm text-accent hover:bg-accent/10 disabled:opacity-50"
                    >
                      {pendingId === id ? 'Adding…' : 'Add to library'}
                    </button>
                  )}
                  {rowError[id] && (
                    <p className="mt-2 text-xs text-danger">{rowError[id]}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      {totalPages != null && (
        <p className="mt-2 text-center text-xs text-text-faint">
          Page {page} of {totalPages} · {total} total
        </p>
      )}
    </div>
  );
}
