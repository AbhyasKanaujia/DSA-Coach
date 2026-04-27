import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as collectionsApi from '../api/collections';
import * as problemsApi from '../api/problems';
import * as libraryApi from '../api/library';
import { extractErrorMessage } from '../api/errors';
import Badge from '../components/Badge';
import DifficultyPill from '../components/DifficultyPill';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function CollectionDetail() {
  const { id } = useParams();
  useDocumentTitle('Collection');
  const [collection, setCollection] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subError, setSubError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [collectionDoc, library] = await Promise.all([
          collectionsApi.getById(id),
          libraryApi.list()
        ]);
        if (cancelled) return;
        setCollection(collectionDoc);
        setSubscribed(
          library.some(
            (entry) =>
              entry.collectionId &&
              String(entry.collectionId._id ?? entry.collectionId) === String(id)
          )
        );

        const problemIds = collectionDoc.problemIds || [];
        const fetched = await Promise.all(
          problemIds.map((pid) =>
            problemsApi.getById(String(pid)).catch(() => null)
          )
        );
        if (cancelled) return;
        setProblems(fetched.filter(Boolean));
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err, 'Failed to load collection'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubscribe = async () => {
    setSubscribing(true);
    setSubError(null);
    try {
      await libraryApi.add(id);
      setSubscribed(true);
    } catch (err) {
      setSubError(extractErrorMessage(err, 'Could not add to library'));
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) return <p className="text-sm text-text-dim">Loading…</p>;
  if (error)
    return (
      <div>
        <Link to="/collections" className="text-xs text-text-dim hover:text-text">
          ← Back to browse
        </Link>
        <p role="alert" className="mt-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
        <Link
          to="/collections"
          className="mt-4 inline-block rounded-md border border-accent/60 px-3 py-1.5 text-sm text-accent hover:bg-accent/10"
        >
          Browse collections
        </Link>
      </div>
    );
  if (!collection) return null;

  const problemCount = collection.problemIds?.length ?? 0;

  return (
    <div>
      <Link to="/collections" className="text-xs text-text-dim hover:text-text">
        ← Back to browse
      </Link>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="break-words text-2xl font-semibold">{collection.name}</h1>
          {collection.description && (
            <p className="mt-1 text-sm text-text-dim">{collection.description}</p>
          )}
          <div className="mt-3">
            <Badge variant="neutral">{problemCount} {problemCount === 1 ? 'problem' : 'problems'}</Badge>
          </div>
        </div>
        <div className="text-right">
          {subscribed ? (
            <span className="text-sm font-medium text-accent">In your library</span>
          ) : (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={subscribing}
              className="rounded-md border border-accent/60 px-3 py-1.5 text-sm text-accent hover:bg-accent/10 disabled:opacity-50"
            >
              {subscribing ? 'Adding…' : 'Add to library'}
            </button>
          )}
          {subError && <p className="mt-2 text-xs text-danger">{subError}</p>}
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-text-faint">Problems</h2>
      {problems.length === 0 ? (
        <p className="mt-3 text-sm text-text-dim">No problems in this collection yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-bg-card">
          {problems.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text">{p.title}</p>
                {p.tags?.length > 0 && (
                  <p className="mt-1 truncate text-xs text-text-faint">{p.tags.join(' · ')}</p>
                )}
              </div>
              <DifficultyPill difficulty={p.difficulty} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
