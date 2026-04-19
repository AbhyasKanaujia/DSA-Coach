# Frontend Plan

## Core Principle

This is not a flashcard app. It is a **guided recall engine**.

The UI controls how knowledge is revealed over time: problem → intuition → approach → code → complexity. A user should never think about the UI itself. The UI must feel like background music.

**Rule:** UI should never make the user think about the UI. If the user wonders "where do I click?" or "what next?", the design has failed.

## The 3 Core Flows

Everything in the product reduces to three flows. If these work, the product works.

1. **Review Session** — the core product
2. **Create / Edit Card**
3. **Browse / Manage Cards**

Secondary concerns (dashboards, stats, mobile polish, shortcuts) come later.

## The Review Flow (locked)

One screen. One card. One action at a time.

```
Show:   Question name + tags (e.g., Array, DP)
        ↓
User thinks
        ↓
Click:  "Reveal Intuition"
        ↓
Click:  "Reveal Steps"
        ↓
Click:  "Reveal Code"
        ↓
Click:  "Reveal Complexity"
        ↓
Rate:   Easy / Medium / Hard
        ↓
Next card (auto)
```

No jumping around. No clutter. Progressive disclosure only.

### Decisions

- **How many reviews per day?** Backend decides (due cards). No user setting in V1.
- **Quit mid-session?** Save after every review. Session is stateless. No "submit session" concept.
- **Mouse vs keyboard?** Mouse-first. Keyboard shortcuts (1/2/3 for rating) come later.
- **Mobile?** Supported but not designed mobile-first. Avoid complex layouts.
- **Multiple solutions per card?** One at a time, ordered brute → optimal. Never dump all at once.

## Information Architecture

```
/dashboard     → stats + "Start Review" CTA
/cards         → list + search + filters
/cards/new     → create card
/cards/:id     → edit card
/review        → full-screen session
```

Keep it boring. That's a feature.

## Phased Build

A phase is **complete only when**:
- flow works end-to-end
- a real user can use it without confusion
- basic tests pass
- no "what should I do next?" moments exist

After each phase, sit with the app for 10–15 minutes. If anything feels annoying, unclear, or makes you hesitate, do not advance.

### Phase 0 — UX contract

Write down (no code) exactly what happens at each step of the primary flow:

```
Open app → Dashboard → Click "Start Review"
→ See card → Think → Reveal (progressive) → Rate → Next card
→ End when no cards left → Show "Done for today"
```

If unclear, every later phase collapses.

### Phase 1 — Review Session (core product)

Build only `/review`. Nothing else.

- Fetch due cards from backend
- Show question name + tags
- Progressive reveal: intuition → steps → code → complexity
- Rating buttons: Easy / Medium / Hard
- Auto-save after each review
- One card at a time, no navigation clutter

**Test:** Can you review for 10 minutes without friction? Any "what next?" moments = fix first.

### Phase 2 — Minimal Card Creation

Build `/cards/new`.

- Question name
- Category / tags
- Solutions (simple input, not fancy)

Do **not**: build a fancy editor, support multiple languages, add complex UI.

**Test:** Can you add 3 cards in under 2 minutes? Hesitation = bad UX.

### Phase 3 — Card Listing

Build `/cards`.

- Question name (required and prominent)
- Category
- Due status (optional)

Every list item must be recognizable instantly. Do not show only patterns/categories — they are logically clean but useless for recognition.

**Test:** Can you scan and find a specific question in 3 seconds?

### Phase 4 — Session Refinements

Refine behavior, not features.

- Session progress indicator ("3 / 10 done")
- Safe quit (already handled by auto-save, just surface it)
- Optional keyboard shortcuts (1/2/3 for rating)

Do **not** add gamification or dashboards yet.

### Phase 5 — Dashboard

Build `/dashboard`.

- Due cards count
- Reviews today
- Streak
- Primary CTA: "Start Review"

Nothing else. No dopamine hacks.

### Phase 6 — Polish

Only after usage feels smooth:

- Spacing and typography
- Subtle animations
- Mobile tweaks
- Full keyboard navigation

## Anti-Goals

- No designing for every possible user behavior. Design for the ideal path and the most common failure (quit mid-session). Ignore the rest in V1.
- No gamification systems. "Cards reviewed today" + streak + "done for today" is enough.
- No premature abstractions, theming, or component libraries beyond what ships the flow.
- No mobile-first layout gymnastics.
- No perfecting UX upfront. Ship one clean flow, observe, improve.

## Checkpoint Before Advancing

Before moving from phase N to N+1, answer honestly:

1. Did I use this myself for 10–15 minutes?
2. Did anything feel annoying or unclear?
3. Did I hesitate even once?

If any answer fails, do not advance.

---

## Technical Implementation

### Tech Stack

- **Framework:** Vite + React
- **Styling:** Tailwind CSS with OKLCH color system
- **Routing:** React Router
- **API Client:** Axios
- **Utilities:** date-fns

### Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   │   ├── ReviewCard.jsx
│   │   ├── RevealLayer.jsx
│   │   ├── RatePanel.jsx
│   │   ├── SolutionForm.jsx
│   │   ├── StepsInput.jsx
│   │   ├── CodeEditor.jsx
│   │   ├── CardList.jsx
│   │   ├── CardRow.jsx
│   │   ├── FilterBar.jsx
│   │   ├── StatCard.jsx
│   │   └── StartReviewButton.jsx
│   ├── pages/         # Route pages
│   │   ├── Dashboard.jsx
│   │   ├── Review.jsx
│   │   ├── Library.jsx
│   │   ├── AddCard.jsx
│   │   └── Stats.jsx
│   ├── hooks/         # Custom hooks
│   ├── lib/           # API client, utilities
│   │   ├── api.js
│   │   └── colors.js
│   ├── styles/        # Global styles
│   │   └── global.css
│   └── main.jsx       # Entry point
├── public/
└── package.json
```

### Phase 0 — Project Setup

**Tasks:**
1. Initialize Vite + React project in `frontend/` directory
2. Install dependencies:
   - `react-router-dom` for routing
   - `tailwindcss` + `postcss` + `autoprefixer` for styling
   - `axios` for API calls
   - `date-fns` for date formatting
3. Configure Tailwind CSS with OKLCH color system from reference
4. Set up React Router with routes:
   - `/` → Dashboard
   - `/review` → Review Session
   - `/cards` → Library
   - `/cards/new` → Add Card
   - `/stats` → Stats
5. Set up API client (`src/lib/api.js`) with:
   - Base URL configuration
   - JWT token handling
   - Request/response interceptors
6. Configure OKLCH colors in Tailwind config:
   - Extract color palette from `docs/Frontend Reference Implementation/shell.jsx`
   - Add as custom colors in `tailwind.config.js`

**Verification:**
- Run `npm run dev` and verify app loads
- Verify Tailwind CSS is working
- Verify routing works between placeholder pages

### Phase 1 — Review Session (Core Product)

**API Endpoints:**
- `GET /api/sessions` - Get due cards
- `POST /api/sessions/review` - Submit review result

**Files to Create:**
- `src/lib/api.js` - API client with session methods
- `src/pages/Review.jsx` - Review session page
- `src/components/ReviewCard.jsx` - Card display
- `src/components/RevealLayer.jsx` - Progressive reveal layer
- `src/components/RatePanel.jsx` - Rating buttons

**Implementation Details:**
- Fetch due cards on mount
- Display current card with question name + tags
- Implement progressive reveal (7 layers):
  1. Problem name
  2. Recall constraints
  3. Intuition
  4. Approach steps
  5. Code
  6. Complexity
  7. Self-assessment
- Rating buttons: Easy / Medium / Hard
- Auto-save after each review
- Show "Done for today" when no cards left
- Keyboard shortcuts (Space to reveal, 1/2/3 to rate)

**Verification:**
- Start backend server
- Create test cards via API or use existing data
- Navigate to `/review`
- Complete a full review session
- Verify ratings are saved to backend
- Test keyboard shortcuts

### Phase 2 — Minimal Card Creation

**API Endpoints:**
- `POST /api/cards` - Create new card

**Files to Create:**
- `src/pages/AddCard.jsx` - Add card page
- `src/components/SolutionForm.jsx` - Solution input form
- `src/components/StepsInput.jsx` - Dynamic steps list
- `src/components/CodeEditor.jsx` - Code input with syntax highlighting placeholder

**Implementation Details:**
- Form with fields:
  - Question name (required)
  - Category (required)
  - Difficulty (easy/medium/hard)
  - Tags (comma-separated)
- Solutions section:
  - Solution name
  - Intuition
  - Steps (dynamic list)
  - Code (language + snippet)
  - Time complexity
  - Space complexity
- Add/remove multiple solutions
- Save button that submits to API

**Verification:**
- Navigate to `/cards/new`
- Fill out form with test data
- Submit and verify card is created in backend
- Verify card appears in review session

### Phase 3 — Card Listing

**API Endpoints:**
- `GET /api/cards` - List cards with filters

**Files to Create:**
- `src/pages/Library.jsx` - Library page
- `src/components/CardList.jsx` - Card list display
- `src/components/CardRow.jsx` - Single card row
- `src/components/FilterBar.jsx` - Filter controls

**Implementation Details:**
- Display list of all cards
- Each card shows:
  - Question name (prominent)
  - Category
  - Difficulty badge
  - Due status (optional)
- Filters:
  - Search by name/tag
  - Filter by difficulty
  - Filter by category
- Sort options:
  - Due date
  - Ease factor
  - Lapse count
  - Name

**Verification:**
- Navigate to `/cards`
- Verify all cards are displayed
- Test search functionality
- Test filters (difficulty, category)
- Test sorting options
- Click card to view details (placeholder for now)

### Phase 4 — Session Refinements

**Files to Modify:**
- `src/pages/Review.jsx` - Add progress, shortcuts, swipe
- `src/components/RatePanel.jsx` - Update with keyboard hints

**Implementation Details:**
- Add session progress indicator:
  - "3 / 10 done" display
  - Visual progress bar
- Implement safe quit:
  - Already handled by auto-save
  - Add "Exit Session" button
  - Show confirmation dialog
- Add keyboard shortcuts:
  - `1` / `←` - Hard
  - `2` / `↓` - Medium
  - `3` / `→` - Easy
  - `Space` - Reveal next
  - `Esc` - Exit session
- Add swipe gestures (optional, from reference):
  - Drag left = Hard
  - Drag down = Medium
  - Drag right = Easy

**Verification:**
- Start review session
- Verify progress indicator updates
- Test all keyboard shortcuts
- Test exit session with confirmation
- (Optional) Test swipe gestures

### Phase 5 — Dashboard

**API Endpoints:**
- `GET /api/auth/stats` - Get user stats

**Files to Create:**
- `src/pages/Dashboard.jsx` - Dashboard page
- `src/components/StatCard.jsx` - Single stat display
- `src/components/StartReviewButton.jsx` - CTA button

**Implementation Details:**
- Display key metrics:
  - Due cards count
  - Reviews today
  - Current streak
- Primary CTA: "Start Review" button
- Simple activity visualization (placeholder for now)

**Verification:**
- Navigate to `/`
- Verify stats are displayed
- Click "Start Review" and navigate to review session
- Verify stats update after completing reviews

### Phase 6 — Polish

**Files to Modify:**
- `src/styles/global.css` - Global styles and animations
- `src/components/*` - Update all components with polish
- `src/App.jsx` - Add keyboard shortcuts

**Implementation Details:**
- Refine spacing and typography:
  - Apply consistent spacing scale
  - Use JetBrains Mono for code, Inter for UI
  - Ensure proper line heights and font sizes
- Add subtle animations:
  - Reveal transitions
  - Button hover states
  - Page transitions
- Mobile tweaks:
  - Responsive layouts
  - Touch-friendly buttons
  - Mobile navigation (bottom nav)
- Full keyboard navigation:
  - Tab order
  - Focus states
  - Global shortcuts (e.g., `g r` for review)

**Verification:**
- Test on mobile viewport
- Test keyboard navigation
- Verify animations feel smooth
- Check accessibility (ARIA labels, focus states)

### Backend API Reference

**Authentication (`/api/auth`):**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/stats` - Get user learning statistics

**Cards (`/api/cards`):**
- `POST /api/cards` - Create new flashcard
- `GET /api/cards` - List cards with filters (category, difficulty, tags, pagination)
- `GET /api/cards/:cardId` - Get single card
- `PUT /api/cards/:cardId` - Update card content
- `DELETE /api/cards/:cardId` - Delete card
- `POST /api/cards/:cardId/solutions` - Add solution to card
- `PUT /api/cards/:cardId/solutions/:solutionIndex` - Update specific solution

**Sessions (`/api/sessions`):**
- `GET /api/sessions` - Get due cards for review session
- `POST /api/sessions/review` - Submit review result (easy/medium/hard)

### OKLCH Color System

Extracted from `docs/Frontend Reference Implementation/shell.jsx`:

```javascript
const T = {
  bg:        'oklch(0.14 0.01 240)',
  bgLift:    'oklch(0.17 0.01 240)',
  bgCard:    'oklch(0.19 0.01 240)',
  bgInset:   'oklch(0.12 0.01 240)',
  border:    'oklch(0.28 0.01 240)',
  borderLt:  'oklch(0.24 0.01 240)',
  text:      'oklch(0.94 0.005 85)',
  textDim:   'oklch(0.64 0.01 240)',
  textMuted: 'oklch(0.46 0.01 240)',
  accent:    'oklch(0.78 0.13 145)', // mastery green
  warn:      'oklch(0.78 0.13 75)',  // due amber
  danger:    'oklch(0.72 0.15 25)',  // lapse red
  info:      'oklch(0.78 0.13 230)', // info blue
};
```

### Typography

- **Code/Mono:** JetBrains Mono
- **UI/Sans:** Inter
