export const STAGES = ['description', 'intuition', 'steps', 'code', 'complexity'];

export const QUALITIES = ['again', 'hard', 'easy'];

export function initialState() {
  return {
    phase: 'idle',
    sessionId: null,
    queue: [],
    config: null,
    meta: null,
    index: 0,
    revealStage: -1,
    revealStagesBySolution: { 0: -1 },
    solutionIndex: 0,
    contentCache: {},
    attempts: [],
    error: null
  };
}

export function isFullyRevealed(state) {
  return state.revealStage >= STAGES.length - 1;
}

export function currentProblem(state) {
  return state.queue[state.index] || null;
}

export function reducer(state, action) {
  switch (action.type) {
    case 'START_REQUEST':
      return { ...initialState(), phase: 'loading' };
    case 'START_SUCCESS': {
      const { sessionId, problems, config, meta } = action;
      const base = { ...initialState(), sessionId, config, meta, queue: problems };
      if (!problems || problems.length === 0) return { ...base, phase: 'empty' };
      return { ...base, phase: 'running' };
    }
    case 'START_ERROR':
      return { ...initialState(), phase: 'error', error: action.error };
    case 'CONTENT_LOADED':
      return {
        ...state,
        contentCache: { ...state.contentCache, [action.problemId]: action.content }
      };
    case 'REVEAL_NEXT': {
      const max = STAGES.length - 1;
      if (state.revealStage >= max) return state;
      const next = state.revealStage + 1;
      return {
        ...state,
        revealStage: next,
        revealStagesBySolution: { ...state.revealStagesBySolution, [state.solutionIndex]: next }
      };
    }
    case 'SET_SOLUTION_INDEX': {
      const idx = action.solutionIndex;
      const stored = state.revealStagesBySolution[idx];
      const restored = stored !== undefined ? stored : -1;
      return {
        ...state,
        solutionIndex: idx,
        revealStage: restored,
        revealStagesBySolution: { ...state.revealStagesBySolution, [idx]: restored }
      };
    }
    case 'RATE_PENDING':
      return { ...state, phase: 'rating' };
    case 'RATE_SUCCESS': {
      const attempts = [...state.attempts, action.attempt];
      const nextIndex = state.index + 1;
      if (nextIndex >= state.queue.length) {
        return { ...state, phase: 'summary', attempts, index: nextIndex };
      }
      return {
        ...state,
        phase: 'running',
        attempts,
        index: nextIndex,
        revealStage: -1,
        revealStagesBySolution: { 0: -1 },
        solutionIndex: 0,
        error: null
      };
    }
    case 'RATE_ERROR':
      return { ...state, phase: 'running', error: action.error };
    case 'SESSION_INVALIDATED':
      return { ...state, phase: 'invalidated', error: action.error || 'This session is no longer active.' };
    case 'ABANDONED':
      return { ...state, phase: 'abandoned' };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}
