Good. Validators are where you enforce **discipline at the boundaries**. If this layer is weak, garbage flows into your system and your services become defensive and messy.

Keep this layer strict, predictable, and boring.

---

# 1. Core Principle

Validators should answer only one question:

> “Is this input structurally and logically valid?”

They should NOT:

* access DB
* apply business rules
* compute anything meaningful

---

# 2. Validator Scope (very important)

You need two levels:

### (A) Field Validators (reusable)

Small, composable checks:

* email format
* password strength
* ObjectId validity
* enum checks

---

### (B) Request Validators (endpoint-specific)

These validate full payloads:

* register request
* review submission
* session start (if options exist)

---

# 3. Validator Modules (V1 structure)

Keep it clean:

* AuthValidator
* CollectionValidator
* SessionValidator
* ReviewValidator
* ProblemValidator (admin)
* CommonValidators (shared)

Do NOT create too many.

---

# 4. Common Validators (foundation)

These will be reused everywhere.

### Must include:

* `validateObjectId(id)`
* `validateEnum(value, allowedValues)`
* `validateNonEmptyString(value, fieldName)`
* `validateOptionalArray(array)`
* `validateNumberRange(value, min, max)`

---

### Rules

* Throw structured errors (not strings)
* Include field name in error
* No silent correction (fail fast)

---

### Tests

* Valid inputs pass
* Invalid inputs throw correct error
* Edge cases (null, undefined, empty string)

---

# 5. AuthValidator

### Responsibilities

* Validate registration & login input

---

### Methods

```id="val_auth_methods"
validateRegister(data)

validateLogin(data)
```

---

### Checks

* email format
* password length (≥ 6 or 8)
* no empty fields

---

### Tests

* invalid email rejected
* weak password rejected
* missing fields rejected

---

# 6. CollectionValidator

### Responsibilities

* Validate collection-related actions

---

### Methods

```id="val_collection_methods"
validateCollectionId(collectionId)

validateAddToLibrary(userId, collectionId)
```

---

### Checks

* valid ObjectId
* required fields present

---

### Important

Do NOT check:

* if collection exists → repository responsibility

---

### Tests

* invalid ID rejected
* missing params rejected

---

# 7. SessionValidator

### Responsibilities

* Validate session creation inputs

---

### Methods

```id="val_session_methods"
validateStartSession(options)
```

---

### Checks

* session size within limits (e.g., 1–20)
* optional filters valid (if added later)

---

### Keep it minimal

Most session inputs are derived from user state, not request.

---

### Tests

* invalid session size rejected
* valid request passes

---

# 8. ReviewValidator (critical)

### Responsibilities

* Validate user feedback input

---

### Methods

```id="val_review_methods"
validateReviewSubmission(data)
```

---

### Required Fields

* problemId
* result

---

### Checks

* problemId is valid ObjectId
* result ∈ {again, hard, easy}

---

### Rules

* This must be strict
* No fallback values

---

### Tests

* invalid result rejected
* missing fields rejected
* invalid ObjectId rejected

---

# 9. ProblemValidator (admin-side)

### Responsibilities

* Validate problem creation & updates

---

### Methods

```id="val_problem_methods"
validateCreateProblem(data)

validateUpdateMetadata(data)

validateUpdateContent(content)
```

---

### Checks

* title required
* difficulty ∈ {easy, medium, hard}
* tags array valid
* companies array valid
* solution limits (if enforced)

---

### Important

Keep content validation light in V1.

Don’t enforce:

* max 10 solutions
* deep structure rules

That’s over-optimization right now.

---

### Tests

* missing title rejected
* invalid difficulty rejected
* malformed arrays rejected

---

# 10. Error Design (standardize this)

All validators should throw structured errors:

```id="val_error_format"
{
  type: "ValidationError",
  message: "Invalid difficulty",
  field: "difficulty"
}
```

---

### Rules

* Always include field when possible
* No generic “Invalid input”
* No leaking internal logic

---

# 11. Anti-Patterns (avoid these)

### ❌ 1. DB calls inside validators

Bad:

* checking if problem exists

That belongs in service/repo.

---

### ❌ 2. Business logic validation

Bad:

* “user cannot review more than 10 problems”

That’s service logic.

---

### ❌ 3. Silent normalization

Bad:

* auto-trimming everything
* auto-correcting values

Fail instead. Be strict.

---

### ❌ 4. Over-validation

Don’t validate things twice.

If schema already enforces:

* required fields
* enums

Validator should just ensure request correctness.

---

# 12. Where Validators Sit in Flow

Correct order:

```id="val_flow"
Controller
  → Validator
    → Service
```

Never:

* Service → Validator (avoid)

---

# 13. Testing Strategy

Validators should have **pure unit tests**.

No DB. No mocks needed.

### Coverage:

* happy path
* missing fields
* wrong types
* boundary values

---

# 14. Final Discipline Rule

If your validators are strong:

* Services become clean
* Bugs reduce early
* Debugging is easier

If they are weak:

* Every service becomes defensive
* You repeat checks everywhere

---

# Final Check

Before moving on, ask:

* Can invalid input ever reach my services?

If yes → validator is incomplete.

---

If you want next, we should define:
→ **Controllers layer with exact request/response contracts**

That’s where your API becomes predictable and usable.
