Good. This is the layer that will decide whether your product actually works or just looks well-architected.

If repositories are about **data access**, services are about **behavior**.
And in your system, behavior = **learning loop quality**.

---

# 1. Core Principle for Services

Every service must answer:

> “What user outcome does this enable?”

If a service exists but doesn’t directly improve:

* starting a session
* reviewing a problem
* tracking progress

…it probably shouldn’t exist yet.

---

# 2. Service Boundaries (keep these strict)

You should have exactly these services in V1:

* AuthService
* SessionService ⭐ (core)
* ReviewService ⭐ (core)
* CollectionService
* ProblemService (admin-side)
* ProgressService

Avoid adding more.

---

# 3. SessionService (this is your product)

This is the most important piece of your entire backend.

### Responsibility

> Decide **what the user should solve right now**

---

## Method Contract

```id="s3_session_contract"
getSession(userId, options?)
→ {
  problems: Problem[],
  meta: {
    dueCount,
    newCount,
    total
  }
}
```

---

## Internal Flow (must be deterministic)

```id="s3_session_flow"
1. Fetch active collections
2. Extract all problemIds
3. Fetch user states for these problemIds
4. Partition:
   A. dueProblems (nextReviewAt <= now)
   B. newProblems (no state exists)

5. Sort:
   dueProblems by nextReviewAt ASC

6. Select:
   - N due (priority)
   - M new

7. Return ordered list:
   [due..., new...]
```

---

## Key Rules

* Due > New (always)
* No duplicates
* No randomness (initially)
* Small session size (7–10 max)

---

## Edge Cases (handle explicitly)

* No due → return only new
* No new → return only due
* No collections → return empty + hint

---

## Tests (critical)

* Due problems always appear first
* Session size respected
* Same input → same output (deterministic)
* Handles empty states correctly

---

# 4. ReviewService (learning engine executor)

### Responsibility

> Update learning state based on user feedback

---

## Method Contract

```id="s3_review_contract"
submitReview(userId, problemId, result)
→ updatedState
```

Where:
`result ∈ {again, hard, easy}`

---

## Logic (keep simple for V1)

```id="s3_review_logic"
if again:
  interval = 1
  repetitions = 0

if hard:
  interval *= 1.2
  repetitions += 1

if easy:
  interval *= 2
  repetitions += 1

nextReviewAt = today + interval
```

---

## Rules

* Pure calculation → then persist
* No branching outside SRS logic
* No dependency on collections

---

## Tests

* Correct interval changes
* nextReviewAt correct
* First-time review creates state
* No duplicate states (upsert works)

---

# 5. CollectionService

### Responsibility

> Manage user interaction with collections (not content creation)

---

## Methods

```id="s3_collection_methods"
getAllPublicCollections()

addToLibrary(userId, collectionId)

getUserLibrary(userId)

activateCollection(userId, collectionId)

deactivateCollection(userId, collectionId)
```

---

## Rules

* No duplication of problems
* No ownership logic (yet)
* Keep it simple

---

## Tests

* Add → appears in library
* Activate → reflected in session
* Multiple collections work together

---

# 6. ProblemService (admin-focused)

### Responsibility

> Manage problem data (not learning behavior)

---

## Methods

```id="s3_problem_methods"
createProblem(data)

getProblem(problemId)

listProblems(filters)

updateProblemMetadata(problemId, data)

updateProblemContent(problemId, content)
```

---

## Rules

* No user-specific logic
* No SRS awareness
* Keep reads optimized (light vs full)

---

## Tests

* CRUD works
* Filters work (tags, company)
* Content updates don’t break structure

---

# 7. ProgressService

### Responsibility

> Give user a sense of progress

---

## Methods

```id="s3_progress_methods"
getUserProgress(userId)
```

---

## Output Example

```id="s3_progress_output"
{
  totalSolved,
  totalReviewed,
  streak,
  masteryBreakdown: {
    new,
    learning,
    review,
    mastered
  }
}
```

---

## Rules

* Derived data only
* No heavy computation per request (optimize later if needed)

---

## Tests

* Correct aggregation
* Handles partial data
* No double counting

---

# 8. AuthService (keep minimal)

### Responsibility

> Authentication only

---

## Methods

```id="s3_auth_methods"
register(email, password)

login(email, password)

generateToken(user)
```

---

## Rules

* No business logic leakage
* No user stats here

---

## Tests

* Valid login works
* Invalid login fails
* Duplicate email rejected

---

# 9. Cross-Service Rules (very important)

## Rule 1: Services can call repositories, not vice versa

## Rule 2: Services may call other services (sparingly)

Example:

* SessionService → UserCollectionRepository
* NOT SessionService → CollectionService → Repo → Repo (avoid chains)

---

## Rule 3: No circular dependencies

If you see:

* Service A → Service B → Service A
  You’ve designed it wrong.

---

## Rule 4: Keep services stateless

No in-memory caching (for now)
No hidden state

---

# 10. Anti-Patterns (watch yourself here)

### ❌ Fat services doing everything

If a service has:

* 500+ lines
* multiple responsibilities

Split it.

---

### ❌ “Utility dumping ground”

Don’t create:

* HelperService
* CommonService

That’s where architecture dies.

---

### ❌ Hidden randomness

Don’t randomly pick problems yet.
You won’t be able to debug learning behavior.

---

# 11. Testing Strategy (Services)

This is where most of your tests should be.

## Unit Tests (mock repos)

* Session logic
* SRS updates
* edge cases

## Integration Tests

* Session + review flow end-to-end
* Data persistence correctness

---

# 12. What actually matters (don’t lose focus)

Your backend will feel “powerful” not because:

* it has many services
* it is perfectly layered

But because:

> SessionService consistently gives the *right problems*

and

> ReviewService makes progress *feel real*

---

# Final checkpoint

Before adding anything new, verify:

* Can one user use this for 5–7 days?
* Do sessions feel:

  * relevant
  * not overwhelming
  * progressive

If not → fix SessionService, not architecture.

---

If you want next, the highest leverage step is:
→ **define exact numeric strategy for sessions** (e.g., 70% due / 30% new, caps, difficulty balancing)

That’s where your product becomes sharp instead of generic.
