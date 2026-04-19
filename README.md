# DSA Coach

Master data structures and algorithms through intelligent spaced repetition. Build lasting interview readiness with a system that adapts to your learning pace.

## What is DSA Coach?

DSA Coach is a flashcard application designed specifically for DSA interview preparation. Unlike traditional flashcard apps, it uses the SM-2 spaced repetition algorithm to optimize your review schedule, ensuring you spend time on problems that need it most.

**Key Features:**

- 🧠 **Spaced Repetition** - SM-2 algorithm schedules reviews at optimal intervals
- 📊 **Progressive Disclosure** - Reveal solutions step-by-step (intuition → approach → code → complexity)
- 🎯 **Focused Learning** - Track mastery by category and difficulty
- ⌨️ **Keyboard-First** - Efficient review sessions with shortcuts
- 🌙 **Terminal-Inspired UI** - Clean, distraction-free interface

## Quick Start

```bash
# Install dependencies
npm install

# Start both backend and frontend
npm run dev
```

Visit `http://localhost:5173` to get started.

## How It Works

1. **Create Cards** - Add problems with multiple solution approaches
2. **Review Daily** - The system shows you cards due for review
3. **Rate Your Recall** - Easy/Medium/Hard ratings adjust future scheduling
4. **Track Progress** - See your mastery grow over time

## Development

```bash
# Backend only
npm run server

# Frontend only
npm run frontend

# Both together
npm run dev

# Run tests
npm test
```

## Tech Stack

- **Backend:** Node.js, Express, MongoDB
- **Frontend:** React, Vite, Tailwind CSS
- **Auth:** JWT with bcrypt
- **Algorithm:** SM-2 Spaced Repetition

## License

ISC