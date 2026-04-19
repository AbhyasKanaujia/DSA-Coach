# DSA Flashcard Backend

A spaced repetition flashcard backend for DSA interview prep with MongoDB + Express.

## Architecture

```
src/
├── config/          # DB, env, constants
├── middleware/      # auth, logging, error handling
├── models/          # Mongoose schemas
├── repositories/    # Data access layer
├── services/        # Business logic + SR algorithm
├── controllers/     # Request/response handling
├── routes/          # Endpoint definitions
└── app.js           # Express setup
```

## Setup

```bash
npm install
```

## Run

```bash
npm start
# or
npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `GET /api/auth/stats` - Get user stats

### Cards
- `POST /api/cards` - Create card
- `GET /api/cards` - List cards (filter by category, difficulty, tags)
- `GET /api/cards/:cardId` - Get card
- `PUT /api/cards/:cardId` - Update card
- `DELETE /api/cards/:cardId` - Delete card
- `POST /api/cards/:cardId/solutions` - Add solution
- `PUT /api/cards/:cardId/solutions/:solutionIndex` - Update solution

### Sessions
- `GET /api/sessions` - Get due cards for session
- `POST /api/sessions/review` - Submit review (easy/medium/hard)

## Card Model

```javascript
{
  userId: ObjectId,
  questionName: String,
  category: String,
  difficulty: "easy" | "medium" | "hard",
  tags: [String],
  solutions: [{
    name: String,
    approachOrder: Number,
    intuition: String,
    steps: [String],
    code: { language: String, snippet: String },
    timeComplexity: String,
    spaceComplexity: String
  }],
  selectedSolutionIndex: Number,
  revisionNotes: String,
  easeFactor: Number,
  interval: Number,
  repetition: Number,
  dueDate: Date,
  lastReviewed: Date,
  lastQuality: Number,
  lapseCount: Number
}
```

## Spaced Repetition

Uses SM-2 algorithm:
- easy → quality 5
- medium → quality 3
- hard → quality 1

Quality < 3 resets repetition and interval.