 Frontend Build Plan — DSA Flashcard                                                       

 Context

 The backend is complete and exposes 7 route domains (auth, problems, collections, library,
 sessions, reviews, progress) with JWT auth, role-based admin gates, server-stateful
 sessions (Session + Attempt entities), and SM-2-style spaced repetition. There is no
 frontend yet. The package.json already wires npm run frontend → cd frontend && npm run dev
 and npm run dev → concurrent backend + frontend, so the project expects the frontend to
 live in /frontend.

 The goal of this plan is to break the UI into a build order that maps onto what the backend
  actually exposes — not what an older doc speculated. The ordering is dictated by data
 dependency: you cannot review without an active subscription, so library must work before
 the session screen is meaningful.

 Stack: Vite + React + Tailwind, React Router, Axios, plain JS. No admin UI in V1 — admins
 use Bruno + the existing dsa-card-onboarder skill.

 ---
 What the frontend must support (derived from src/routes/*)

 ┌─────────────┬─────────────────────────────────────┬──────────────────────────────────┐
 │   Domain    │              Endpoints              │             UI need              │
 ├─────────────┼─────────────────────────────────────┼──────────────────────────────────┤
 │ auth        │ register, login, GET/PUT            │ Login + register forms, profile  │
 │             │ /auth/profile                       │ page                             │
 ├─────────────┼─────────────────────────────────────┼──────────────────────────────────┤
 │ collections │ GET (public list), GET /:id         │ Browse + collection detail       │
 ├─────────────┼─────────────────────────────────────┼──────────────────────────────────┤
 │ library     │ GET, POST add, PATCH                │ "My Library" with toggles        │
 │             │ activate/deactivate, DELETE         │                                  │
 ├─────────────┼─────────────────────────────────────┼──────────────────────────────────┤
 │ sessions    │ POST /start, GET, GET /:id,         │ Session runner + (optional)      │
 │             │ /complete, /abandon                 │ history                          │
 ├─────────────┼─────────────────────────────────────┼──────────────────────────────────┤
 │ problems    │ GET /:id (with populated solutions) │ Card view inside session         │
 ├─────────────┼─────────────────────────────────────┼──────────────────────────────────┤
 │ reviews     │ POST                                │ Rate button → POST {problemId,   │
 │             │                                     │ quality, sessionId}              │
 ├─────────────┼─────────────────────────────────────┼──────────────────────────────────┤
 │ progress    │ GET                                 │ Dashboard stats                  │
 └─────────────┴─────────────────────────────────────┴──────────────────────────────────┘

 Admin endpoints (POST/PUT/DELETE on problems & collections) are intentionally out of scope.

 ---
 Ground rules

 1. Backend owns intelligence. Frontend never computes due dates, ordering, or session size.
  It calls /sessions/start, walks the returned queuedProblemIds, posts /reviews per card,
 done.
 2. One axios client at src/api/client.js with a request interceptor that attaches
 Authorization: Bearer <token> from localStorage, and a response interceptor that on 401
 clears auth and redirects to /login.
 3. One module per domain under src/api/ (auth.js, collections.js, library.js, sessions.js,
 reviews.js, progress.js, problems.js) — each function returns parsed JSON, throws on error.
  Components never call axios directly.
 4. Auth state via React context (AuthProvider) holding {token, user}, persisted to
 localStorage. A <RequireAuth> wrapper guards every route except /login and /register.
 5. Tailwind only for styling. No component library. OKLCH palette in tailwind.config.js.
 6. Vitest + React Testing Library for tests; one smoke test per phase before moving on.

 ---
 Phase 0 — Scaffold (half a day)

 Create /frontend:

 frontend/
   package.json          # vite, react, react-router-dom, axios, date-fns, tailwindcss,
 vitest, @testing-library/react
   vite.config.js        # dev server on 5173, proxy /api → http://localhost:3000
   tailwind.config.js    # OKLCH palette tokens
   index.html
   src/
     main.jsx            # RouterProvider + AuthProvider
     App.jsx
     api/
       client.js         # axios instance + interceptors
     auth/
       AuthContext.jsx
       RequireAuth.jsx
     pages/              # filled in later phases
     components/
     hooks/

 .env: VITE_API_BASE_URL=http://localhost:3000/api.

 Done when: npm run dev starts both servers; visiting localhost:5173 renders a placeholder;
 backend CORS already allows 5173.

 ---
 Phase 1 — Auth (1 day)

 Pages: /login, /register, /profile.

 - src/api/auth.js: register, login, getProfile, updateProfile.
 - AuthProvider: on mount reads token from localStorage, hydrates user via getProfile;
 exposes login(creds), register(payload), logout(), updateProfile(patch).
 - RequireAuth: redirects to /login if no token; shows a brief loader while hydrating.
 - Forms: native <form> + useState. Inline error from server (409, 401, validator messages).
  No form library.
 - /profile: shows email + name + role; lets user edit name and preferences (dailyGoal,
 maxSessionSize).

 Verify: register → land on /. Refresh → stays logged in. Logout → cannot access /. Bad
 creds → inline error.

 ---
 Phase 2 — Library + Browse (1–2 days)

 This must come before the session page, because a session is empty unless an active
 subscription exists.

 Pages: /collections (browse), /collections/:id (detail), /library (mine).

 - src/api/collections.js: list({page, limit}), getById(id).
 - src/api/library.js: list(), add(collectionId), activate(id), deactivate(id), remove(id).
 - /collections: paginated grid of public collections (name, problem count, "Add to library"
  button → 409 means already subscribed).
 - /collections/:id: collection metadata + populated problems list (title, difficulty pill,
 tags). Read-only.
 - /library: list of {collection, isActive}. Each row: activate/deactivate toggle,
 "Unsubscribe" with confirm. Empty state CTA → /collections.

 Verify: subscribe to a collection from /collections, see it in /library, toggle active,
 unsubscribe, re-subscribe.

 ---
 Phase 3 — Review Session (the core loop, 2–3 days)

 Page: /session. This is the only screen with non-trivial state.

 Flow:
 1. On mount, POST /sessions/start with optional {limit, maxNew} from user prefs. Store
 {sessionId, queuedProblemIds, config, meta}.
 2. Local state: currentIndex, revealLevel ∈ {title, description, intuition, steps, code,
 complexity}, solutionIndex (multi-solution problems are ordered brute → optimal).
 3. Lazy-fetch each problem via GET /problems/:id as the index advances (cache results in a
 Map).
 4. Render progressive reveal — one button "Reveal next" cycles through levels. When at
 complexity, the rate panel (Again / Hard / Easy) becomes active.
 5. On rate: POST /reviews { problemId, quality, sessionId }. Optimistically advance to next
  index. On the last card, show the completion screen.
 6. "End session" button → POST /sessions/:id/abandon, route to /.
 7. Empty session (queuedProblemIds.length === 0): show "Nothing due — add or activate a
 collection" with link to /library.

 Components:
 - SessionRunner — owns the state machine.
 - Card — pure presentational: title, tags, difficulty, body slots for each reveal layer.
 - RevealControls — "Reveal next" + multi-solution switcher.
 - RatePanel — three buttons; disabled until fully revealed.
 - SessionSummary — shown when currentIndex === queuedProblemIds.length; reads from meta and
  from local counts.

 Keyboard shortcuts deferred to Phase 5.

 Verify: start session → walk 3+ problems → each rating updates SR state (cross-check via
 GET /progress change). Abandon mid-way works. Refresh in the middle of a session lands you
 back on / cleanly (sessionId is server-stored; we accept losing UI position on reload in
 V1).

 ---
 Phase 4 — Dashboard (half a day)

 Page: / (replaces the placeholder).

 - src/api/progress.js: get().
 - Cards: total reviewed, streak, mastery breakdown (new/learning/review/mastered), last
 active date.
 - Big "Start Session" button → /session.
 - Quick links to /library and /collections.

 Verify: dashboard numbers match GET /progress directly. Streak increments after a review on
  a new day.

 ---
 Phase 5 — Polish (1–2 days, gated by your own use)

 Only do these once you've actually used the app for 2–3 days.

 - Keyboard shortcuts on /session (space reveal, 1/2/3 rate).
 - Loading skeletons on every fetch.
 - Toast for errors (one tiny component, no library).
 - Mobile pass: ensure /session is usable on a phone.
 - A11y pass: focus rings, ARIA on rate buttons, <main> landmarks.
 - Optional: /sessions history page (GET /sessions).

 ---
 Critical files

 New:
 - /frontend/** (entire directory)

 To update after plan approval:
 - /Users/abhyas/projects/dsa_flashcard/docs/frontend_plan.md — replace with a condensed
 version of this plan (it's currently stale: predates Session/Attempt entities, library
 subscriptions, and admin role).

 Reference (do not modify):
 - src/routes/*.js — endpoint contracts
 - src/models/*.js — entity shapes (especially Session, Attempt, UserProblemState)
 - tests/bruno/DSA Flashcard/ — example payloads for every endpoint; use as ground truth
 when building API modules.

 ---
 Verification (end-to-end)

 After Phase 3 you should be able to walk this manually:

 1. npm run dev (starts backend on 3000, frontend on 5173).
 2. Register a new user at /register.
 3. Have an admin (you, via Bruno) seed a collection with 5 problems if none exist.
 4. /collections → subscribe → /library → confirm active.
 5. /session → walk all 5 problems, reveal each layer, rate.
 6. / → progress reflects the 5 attempts; mastery breakdown updates.
 7. Refresh → still logged in, dashboard still correct.
 8. Logout → redirected to /login; protected routes blocked.

 Run npm test in /frontend between phases — at minimum the AuthProvider test and a
 SessionRunner state-machine test should be green before declaring Phase 3 done.

 ---
 What this plan deliberately omits

 - Admin UI for problems/collections (use Bruno + dsa-card-onboarder skill).
 - Card creation/editing pages.
 - Session history & analytics beyond /progress.
 - Tag/difficulty filters on the problem list (no user-facing problem search in V1; problems
  are reached only via collections).
 - Social/sharing/likes/comments.
 - Offline / PWA.

 These are easy to layer on later because the API client and auth layer make new screens
 cheap.