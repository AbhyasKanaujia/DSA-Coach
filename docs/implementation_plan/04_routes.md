Good. Routes are where many projects quietly become messy. Keep them extremely thin and predictable.

---

# 1. Core Principle

Routes should only answer:

> “Which controller handles this request, and what middleware applies?”

They should NOT:

* contain logic
* know about services
* shape responses

If you ever see `if/else` in routes, you’re already drifting.

---

# 2. Route Design Goals

Your routing should be:

* **Predictable** → easy to guess endpoints
* **Stable** → won’t change when internals change
* **Minimal** → only expose what V1 needs

---

# 3. Route Structure (modular)

Organize by domain:

```
/api
  /auth
  /collections
  /library
  /sessions
  /reviews
  /problems (admin)
  /progress
```

Each has its own router file.

---

# 4. Route Definitions (V1 — exact plan)

## Auth Routes

```
POST /api/auth/register
POST /api/auth/login
```

Simple. No extras.

---

## Collections (discovery layer)

```
GET /api/collections
GET /api/collections/:collectionId
```

Purpose:

* browse available sheets

---

## Library (user-specific)

```
GET  /api/library
POST /api/library/:collectionId/add
PATCH /api/library/:collectionId/activate
PATCH /api/library/:collectionId/deactivate
```

Notes:

* Separate **collections** (global) vs **library** (user-specific)
* This separation avoids future confusion

---

## Session (core feature)

```
POST /api/sessions/start
```

Optional later:

```
POST /api/sessions/start?limit=10
```

Keep it POST even though it “reads”—because it triggers a computed session.

---

## Review (learning loop)

```
POST /api/reviews
```

Body:

```
{
  problemId,
  result
}
```

This is your most frequently hit endpoint.

---

## Progress

```
GET /api/progress
```

Simple aggregated data.

---

## Problems (Admin-only for now)

```
POST   /api/problems
GET    /api/problems
GET    /api/problems/:problemId
PUT    /api/problems/:problemId/metadata
PUT    /api/problems/:problemId/content
DELETE /api/problems/:problemId
```

Protect these with admin middleware.

---

# 5. Middleware Strategy

Each route should explicitly define middleware:

### Global Middleware

* error handler
* JSON parser

---

### Route-level Middleware

* `authMiddleware` (for all protected routes)
* `validationMiddleware`

---

### Example Flow

```
POST /api/reviews
→ authMiddleware
→ validateReview
→ ReviewController.submit
```

---

# 6. Naming Conventions (important)

Stick to:

* nouns for resources → `/collections`
* actions only when needed → `/sessions/start`

Avoid:

* `/getCollections`
* `/doReview`

---

# 7. Route Consistency Rules

* Always use plural nouns (`/collections`, not `/collection`)
* Always use `:id` format (`:collectionId`)
* Keep verbs consistent:

  * GET → read
  * POST → create/action
  * PATCH → partial update
  * PUT → full update

---

# 8. Response Shape (standardize early)

Every route should return predictable structure.

### Success

```
{
  success: true,
  data: ...
}
```

---

### Error

```
{
  success: false,
  error: {
    message,
    field (optional)
  }
}
```

---

# 9. Route-Level Anti-Patterns

### ❌ 1. Business logic in routes

Bad:

```
if (user.hasActiveCollection) ...
```

---

### ❌ 2. Calling repositories directly

Routes → Controllers → Services → Repos

Never skip layers.

---

### ❌ 3. Inconsistent endpoints

Bad:

* `/startSession`
* `/sessions/start`
* `/sessionStart`

Pick one pattern and stick to it.

---

### ❌ 4. Overloading routes

Don’t make:

```
POST /api/session
→ does 5 different things
```

Keep each route single-purpose.

---

# 10. Testing Strategy (Routes)

Routes should be tested with **integration tests**, not unit tests.

### What to test

* Route → correct controller triggered
* Middleware works (auth + validation)
* Unauthorized access blocked
* Valid requests reach controller

You don’t test business logic here—that’s service layer.

---

# 11. Versioning (light planning)

You don’t need it now, but prepare:

```
/api/v1/...
```

So later you don’t break clients.

---

# 12. Final Discipline Check

If someone new joins your project, they should be able to:

* look at routes
* understand your entire API surface in 2 minutes

If not, your routes are too complex.

---

# Final Thought

Your routes are not where your product wins.

They should feel:

* boring
* obvious
* consistent

If they do, it means your **real complexity is correctly pushed into services**, where it belongs.

---

If you want next, we should define:
→ **Controller contracts (exact request → response mapping)**

That’s where API clarity becomes real for frontend integration.
