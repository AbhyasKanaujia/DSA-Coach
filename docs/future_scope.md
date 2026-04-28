# Future Scope

## UI

### Collection Page

1. On what basis do we sort the collections? (createdAt? most popular? most active?)
2. **Collection detail N+1 fan-out.** `GET /api/collections/:id` does not populate problems, so the detail page issues one `GET /api/problems/:id` per problemId. Browsers cap concurrent requests per origin (~6), so a 30-problem collection serializes into 5 round-trips and feels slow. Fix: add a server-side option to populate problem metadata on the collection-get endpoint (e.g. `GET /api/collections/:id?expand=problems` → returns problems with `id, title, difficulty, tags`), or expose a batch problems lookup (`GET /api/problems?ids=a,b,c`).
3. **Dangling problem refs in collections.** `Collection.problemIds` can contain ObjectIds whose `Problem` document was deleted out-of-band (admin DB edits, partial deletes). The detail page currently swallows the 404s and silently shows fewer rows than the count badge advertises. Fix options: (a) backend cleans up dangling refs lazily when serving collection-get, (b) admin maintenance script, (c) constrain the count badge to the populated list length once #2 lands.

### Library

1. **Cross-tab staleness.** Library + Browse pages compute "subscribed" state at mount time. If a user subscribes/unsubscribes in another tab, the first tab continues to show the stale state until the user navigates or refreshes. Acceptable for V1; later, push updates via a `BroadcastChannel`, the existing `storage` event channel (publish a tiny "library:updated" tick), or a websocket.

### General

1. Pagination and filters must update URL query params to allow sharing and bookmarking.

### Session

Sesssion must be able to be fully operated by keybowrd. Not just for accessibility, but as the main interaction mode for the flashcard workflow. This includes:
- Space bar to reveal the next step
- 1,2,3... to select a solution
- A, H, E for "Again", "Hard", "Easy" grading buttons
- Esc to exit session and return to library

#### Known Bugs

1. **Solution switching resets reveal state (T23).** Switching between approaches mid-reveal resets the reveal counter to 1/5 and hides all previously revealed content. The user must re-reveal through all 5 steps for the new solution. Expected: either preserve reveal position per solution, or document this as intended UX.

2. **Multiple active sessions not abandoned (T16).** When a user starts a new session (e.g., by opening /session in a second tab or refreshing), the backend creates a new session without abandoning the previous active one. API queries show multiple active sessions for the same user. Expected: `POST /sessions/start` should abandon any existing active session before creating a new one, and subsequent rating attempts on the abandoned session should return "Session is not active".