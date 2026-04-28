Below is a manual test plan organized as the user requested. Run with both servers up (npm run dev). Have an admin Bruno session ready to seed problems if needed.

1) Real use — golden paths
Auth & session bootstrap

Register a fresh user → land on /. Confirm dashboard renders with all zeros and "Last active: —".
Logout → /login shows. Hit / directly → bounced to /login.
Login again → dashboard hydrates within a beat; user email visible in header.
Subscribing
4. /collections → page through the list with the numbered pagination → click into one → "Add to library" → button flips to "In your library".
5. /library → confirm it appears, badge says "Active", problem count matches.

Run a real review session
6. From dashboard click "Start session →". Verify the header shows Card 1 of N, difficulty pill, and userState badge (should say "new" for first-time problems).
7. Click "Reveal description (1/5)" → description appears. Continue through intuition / steps / code / complexity. Confirm button label updates each press and label switches to "All revealed" at the end.
8. Confirm the rate buttons (Again / Hard / Easy) are disabled until "All revealed".
9. Rate one card with each of the three qualities across the session.
10. Walk the full queue. On the last card after rating, the summary screen renders with attempted count + per-quality counts.
11. Click "Back to dashboard" → totals on / reflect the session (Reviews increments by N, mastery breakdown shifts new → learning).

Multi-day streak
12. Run a session today, run another tomorrow (or set the system clock forward). Confirm streak increments and Last active updates.

Multi-collection
13. Subscribe to two collections → run a session → cards from both should appear (mixed by due-date order; new cards padded up to maxNew).
14. In /library, deactivate one → new session pulls only from the active one.

Profile preferences influence sessions
15. /profile → set maxSessionSize=3, save → start session → queue should have ≤ 3 problems.

1) Unexpected user behavior
Concurrency & navigation

16. Open /session in Tab A, then /session in Tab B. Tab A's session is silently abandoned by the backend on Tab B's start. Rate a card in Tab A → expect "Session is not active" error stays on the card; user can hit "End session" to escape.
2. Mid-session, hit browser back → goes to previous page; forward → back to /session which starts a brand-new session (StrictMode + remount). Confirm previous session is server-abandoned and progress for cards already rated in it persists in /progress.
3. Refresh in the middle of a session. Same as above — a new session starts; UI position is lost (documented V1 behavior). Verify nothing crashes.
4. Click "End session" before any card is rated → confirm prompt → "/" loads.
5. Click "End session" on the summary screen — there is no button there, but try navigating away mid-summary via header links. Should leave cleanly.

Reveal/rate edge cases
21. Mash "Reveal next" 20× rapidly → no crash, saturates at "All revealed".
22. Right after "All revealed", double-click "Easy" fast → the second click should be ignored (button is disabled while phase === 'rating').
23. With a problem that has multiple solutions: reveal halfway, switch to solution 2 → reveal resets to title-only. Confirm this is the intended UX with the user (you may want it to remember position).
24. Switch solutions back and forth several times → rate panel only re-enables after revealing through complexity again.

Empty / degenerate states
25. Logout, register a new user, immediately go to /session (no library) → empty state with "Go to library" CTA.
26. Subscribe to a collection that has 0 problems (admin-side: create one, leave problemIds empty) → /session → empty state.
27. Activate every collection then deactivate them all → /session → empty state.
28. /profile → set maxSessionSize=1 → start session → walk the single card → summary shows 1 of 1.

Auth interactions
29. While on /session, in another tab logout. Back in the first tab, click rate → 401 → app clears auth and bounces to /login.
30. Login → directly visit /session/some-id style URLs (none exist; route is /session). Visit /collections/<bogus-id> → error panel + back link, no crash.

Profile edits
31. /profile → change name to a long Unicode string (e.g. "禅 monk 🧘" — though the UI doesn't render emoji, see if backend stores it cleanly). Reload → reflected in header.
32. /profile → enter maxSessionSize=999 → expect server validation error inline, no UI corruption.

1) Bug-hunting probes
State machine

33. Start session → reveal everything → click "Easy" → while the request is in flight, kill the network (devtools → Offline) → expect rate error message, card stays, can retry after going back online. Confirm no duplicate attempts on retry (check /progress totalReviewed delta = exactly the number you successfully rated).
2. With network throttled to "Slow 3G", click rate twice. The second click should be a no-op due to disabled button. Verify by checking the network tab for exactly one POST per card.
3. Set network "Offline" before visiting /session → expect the start error panel with a "Back to dashboard" button; clicking it must navigate without leaving the app in a bad state.
4. Go offline mid-session while a problem is fetching content → "Loading solution…" persists with no retry. Likely UX bug: there's no retry surfaced for content fetch failures. Worth noting.

Content rendering
37. Seed a problem with a description containing newlines, code-fence backticks, and <script> text → render description: confirm newlines preserved (we use whitespace-pre-wrap) and HTML is escaped (React text node).
38. Seed a code snippet that's 200 lines / very wide → confirm <pre> scrolls horizontally inside the card and doesn't blow out the page width.
39. Seed a problem with no tags and no companies → header has no empty badge row.
40. Seed a problem with 5 solutions → confirm switcher wraps, all are clickable, ordering matches order field on the backend.
41. Seed a solution with steps: [] → "Steps" section shows the "No steps provided." fallback.

Dashboard
42. Hit dashboard immediately after logging in (race against profile hydration) → no flash of broken values; greeting falls back to "Welcome back" if name is missing.
43. With a user that has lastActiveDate set to yesterday → renders correctly. Set it to a malformed string via DB tinkering → safeFormat should return "—" (verify the catch path).
44. Streak after 0 reviews ever → "0d", not blank.

Header / nav / titles
45. Watch the browser tab title transitioning across pages — should track ~/dsa_coach/<slug> (e.g. ~/dsa_coach/session, ~/dsa_coach/dashboard).
46. Visit /collections/<id> for a collection whose name has spaces → tab title still reads ~/dsa_coach/collection (slug is the static page name, not the collection).

Library mutations during session
47. Start a session in Tab A. In Tab B, unsubscribe from one of the collections feeding it. Back in Tab A, rate a card from that collection → should still succeed (queue is locked at session start) — confirm no 404/409.
48. Same setup but in Tab B deactivate the collection mid-session → Tab A continues to work.

Pagination / Browse
49. /collections → jump to page 2, refresh → should preserve page (or land on page 1 if not persisted; flag the actual behavior).
50. Browse list while another tab adds a new collection (admin via Bruno) → refresh → new entry appears.

Re-subscribing
51. Subscribe → unsubscribe → subscribe again to the same collection. Library shows it once. Confirm server didn't double-create.
52. Try "Add to library" twice rapidly on the detail page → one POST, button flips, no duplicate.

Stress
53. Subscribe to 5+ collections totalling 50+ problems. Start session with maxSessionSize=50. Walk 10 cards, end session. Verify dashboard math, then start another → due cards shift correctly per SR.
