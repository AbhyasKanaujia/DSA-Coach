import { useEffect, useReducer, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as sessionsApi from '../api/sessions';
import * as reviewsApi from '../api/reviews';
import * as problemsApi from '../api/problems';
import { extractErrorMessage } from '../api/errors';
import Badge from '../components/Badge';
import DifficultyPill from '../components/DifficultyPill';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  STAGES,
  QUALITIES,
  reducer,
  initialState,
  isFullyRevealed,
  currentProblem
} from '../session/sessionMachine';

export default function Session() {
  useDocumentTitle('Session');
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const navigate = useNavigate();
  const dispatchRef = useRef(dispatch);

  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      dispatchRef.current({ type: 'START_REQUEST' });
      try {
        const data = await sessionsApi.start();
        if (cancelled) return;
        dispatchRef.current({
          type: 'START_SUCCESS',
          sessionId: String(data.sessionId),
          problems: data.problems || [],
          config: data.config,
          meta: data.meta
        });
      } catch (err) {
        if (!cancelled) {
          dispatchRef.current({ type: 'START_ERROR', error: extractErrorMessage(err, 'Failed to start session') });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const problem = currentProblem(state);
  const problemId = problem ? String(problem._id || problem.id) : null;
  const cachedContent = problemId ? state.contentCache[problemId] : null;

  useEffect(() => {
    if (!problemId || cachedContent) return;
    let cancelled = false;
    (async () => {
      try {
        const full = await problemsApi.getById(problemId);
        if (!cancelled) dispatch({ type: 'CONTENT_LOADED', problemId, content: full });
      } catch (err) {
        if (!cancelled) dispatch({ type: 'RATE_ERROR', error: extractErrorMessage(err, 'Failed to load problem') });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [problemId, cachedContent]);

  const handleReveal = () => dispatch({ type: 'REVEAL_NEXT' });
  const handleSetSolution = (idx) => dispatch({ type: 'SET_SOLUTION_INDEX', solutionIndex: idx });

  const handleRate = async (quality) => {
    if (!problemId || !state.sessionId) return;
    dispatch({ type: 'RATE_PENDING' });
    try {
      const result = await reviewsApi.submit({ problemId, quality, sessionId: state.sessionId });
      dispatch({ type: 'RATE_SUCCESS', attempt: { problemId, quality, result } });
    } catch (err) {
      const status = err?.response?.status;
      const message = extractErrorMessage(err, 'Could not submit review');
      if (status === 409 && /not active/i.test(message)) {
        dispatch({ type: 'SESSION_INVALIDATED', error: message });
        return;
      }
      dispatch({ type: 'RATE_ERROR', error: message });
    }
  };

  const handleAbandon = async () => {
    if (!state.sessionId) {
      navigate('/');
      return;
    }
    if (!window.confirm('End this session? Your progress so far is saved.')) return;
    try {
      await sessionsApi.abandon(state.sessionId);
    } catch {
      // even if abandon fails (e.g. already completed), still navigate away
    }
    dispatch({ type: 'ABANDONED' });
    navigate('/');
  };

  if (state.phase === 'loading' || state.phase === 'idle') {
    return <p className="text-sm text-text-dim">Starting session…</p>;
  }

  if (state.phase === 'error') {
    return (
      <ErrorPanel
        message={state.error}
        actionLabel="Back to dashboard"
        onAction={() => navigate('/')}
      />
    );
  }

  if (state.phase === 'empty') {
    return (
      <div className="rounded-lg border border-border bg-bg-card p-8 text-center">
        <h1 className="text-lg font-semibold">Nothing due right now</h1>
        <p className="mt-2 text-sm text-text-dim">
          Add or activate a collection to start reviewing.
        </p>
        <Link
          to="/library"
          className="mt-4 inline-block rounded-md border border-accent/60 px-3 py-1.5 text-sm text-accent hover:bg-accent/10"
        >
          Go to library
        </Link>
      </div>
    );
  }

  if (state.phase === 'summary') {
    return <SessionSummary state={state} onDone={() => navigate('/')} />;
  }

  if (state.phase === 'invalidated') {
    return (
      <ErrorPanel
        message={state.error || 'This session is no longer active. A new session was started in another tab.'}
        actionLabel="Back to dashboard"
        onAction={() => navigate('/')}
      />
    );
  }

  const total = state.queue.length;
  const stagesRevealed = state.revealStage + 1;
  const fullyRevealed = isFullyRevealed(state);
  const rating = state.phase === 'rating';

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-faint">
            Card {state.index + 1} of {total}
          </p>
          <h1 className="mt-1 text-xl font-semibold">{problem?.title || '…'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {problem?.difficulty && <DifficultyPill difficulty={problem.difficulty} />}
          {problem?.userState?.status && (
            <Badge variant="neutral">{problem.userState.status}</Badge>
          )}
        </div>
      </header>

      <ProgressBar current={state.index} total={total} />

      <Card
        problem={problem}
        content={cachedContent}
        revealStage={state.revealStage}
        solutionIndex={state.solutionIndex}
        onSetSolution={handleSetSolution}
      />

      {state.error && (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleReveal}
          disabled={fullyRevealed || !cachedContent}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-text hover:bg-bg-hover disabled:opacity-40"
        >
          {fullyRevealed
            ? 'All revealed'
            : `Reveal ${STAGES[state.revealStage + 1]} (${stagesRevealed + 1}/${STAGES.length})`}
        </button>

        <RatePanel
          disabled={!fullyRevealed || rating}
          rating={rating}
          onRate={handleRate}
        />

        <button
          type="button"
          onClick={handleAbandon}
          className="rounded-md border border-danger/40 px-3 py-1.5 text-xs text-danger hover:bg-danger/10"
        >
          End session
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-bg-lift">
      <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Card({ problem, content, revealStage, solutionIndex, onSetSolution }) {
  if (!problem) return null;

  const tags = problem.tags || [];
  const solutions = content?.solutions || [];
  const solution = solutions[solutionIndex];
  const showAt = (stageIdx) => revealStage >= stageIdx;

  return (
    <article className="space-y-5 rounded-lg border border-border bg-bg-card p-6">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Badge key={t} variant="neutral">{t}</Badge>
          ))}
        </div>
      )}

      <Section label="Description" hidden={!showAt(0)}>
        <p className="whitespace-pre-wrap text-sm text-text">{problem.description}</p>
      </Section>

      {!content && showAt(0) && (
        <p className="text-xs text-text-faint">Loading solution…</p>
      )}

      {solutions.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-text-faint">Approach</span>
          {solutions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSetSolution(idx)}
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                idx === solutionIndex
                  ? 'border-accent/60 bg-accent/10 text-accent'
                  : 'border-border text-text-dim hover:bg-bg-hover'
              }`}
            >
              {idx + 1}. {s.name}
            </button>
          ))}
        </div>
      )}

      {solution && (
        <>
          <Section label="Intuition" hidden={!showAt(1)}>
            <p className="whitespace-pre-wrap text-sm text-text">{solution.intuition}</p>
          </Section>

          <Section label="Steps" hidden={!showAt(2)}>
            {solution.steps?.length ? (
              <ol className="list-decimal space-y-1 pl-5 text-sm text-text">
                {solution.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-text-dim">No steps provided.</p>
            )}
          </Section>

          <Section label="Code" hidden={!showAt(3)}>
            {(solution.codeSnippets || []).map((snip, i) => (
              <div key={i} className="overflow-hidden rounded-md border border-border bg-bg">
                <div className="border-b border-border bg-bg-lift px-3 py-1 text-xs text-text-faint">
                  {snip.language}
                </div>
                <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-text">
                  <code>{snip.code}</code>
                </pre>
              </div>
            ))}
          </Section>

          <Section label="Complexity" hidden={!showAt(4)}>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-faint">Time</dt>
                <dd className="font-mono text-text">{solution.timeComplexity}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-faint">Space</dt>
                <dd className="font-mono text-text">{solution.spaceComplexity}</dd>
              </div>
            </dl>
          </Section>
        </>
      )}
    </article>
  );
}

function Section({ label, hidden, children }) {
  if (hidden) return null;
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-faint">{label}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

const RATE_VARIANTS = {
  again: 'border-danger/50 text-danger hover:bg-danger/10',
  hard: 'border-warn/50 text-warn hover:bg-warn/10',
  easy: 'border-accent/60 text-accent hover:bg-accent/10'
};

function RatePanel({ disabled, rating, onRate }) {
  return (
    <div className="flex items-center gap-2">
      {QUALITIES.map((q) => (
        <button
          key={q}
          type="button"
          disabled={disabled}
          onClick={() => onRate(q)}
          className={`rounded-md border px-3 py-1.5 text-sm capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${RATE_VARIANTS[q]}`}
        >
          {rating ? '…' : q}
        </button>
      ))}
    </div>
  );
}

function SessionSummary({ state, onDone }) {
  const counts = state.attempts.reduce(
    (acc, a) => {
      acc[a.quality] = (acc[a.quality] || 0) + 1;
      return acc;
    },
    { again: 0, hard: 0, easy: 0 }
  );
  return (
    <div className="space-y-5 rounded-lg border border-border bg-bg-card p-8 text-center">
      <h1 className="text-xl font-semibold">Session complete</h1>
      <p className="text-sm text-text-dim">
        {state.attempts.length} of {state.queue.length} cards reviewed.
      </p>
      <dl className="mx-auto grid max-w-xs grid-cols-3 gap-3 text-sm">
        <Stat label="Again" value={counts.again} variant="danger" />
        <Stat label="Hard" value={counts.hard} variant="warn" />
        <Stat label="Easy" value={counts.easy} variant="accent" />
      </dl>
      <button
        type="button"
        onClick={onDone}
        className="mt-2 rounded-md border border-accent/60 px-4 py-1.5 text-sm text-accent hover:bg-accent/10"
      >
        Back to dashboard
      </button>
    </div>
  );
}

const STAT_TONE = {
  accent: 'text-accent',
  warn: 'text-warn',
  danger: 'text-danger'
};

function Stat({ label, value, variant }) {
  return (
    <div className="rounded-md border border-border bg-bg p-3">
      <div className={`text-2xl font-semibold ${STAT_TONE[variant] || ''}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-text-faint">{label}</div>
    </div>
  );
}

function ErrorPanel({ message, actionLabel, onAction }) {
  return (
    <div className="rounded-lg border border-danger/40 bg-danger/10 p-6 text-sm text-danger">
      <p>{message}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-3 rounded-md border border-danger/40 px-3 py-1.5 text-xs text-danger hover:bg-danger/20"
      >
        {actionLabel}
      </button>
    </div>
  );
}
