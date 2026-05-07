# Freelance Platform

A full-stack freelance marketplace application with a Node.js/Express backend, React frontend, and Playwright end-to-end tests.

## Project Structure

```
.
├── backend/              # Express API server (port 9001)
├── frontend/            # React + Vite frontend (port 9000)
├── automation_tests/    # Playwright E2E test suite
├── manual_test_cases/   # Manual test documentation
├── start.bat            # Windows launcher script
└── cmds.txt             # Test command reference
```

## Quick Start

### 1. Start Backend and Frontend

**Windows:** Double-click `start.bat` — it launches both servers in separate terminal windows.

**Manually:**
```bash
# Terminal 1 — Backend
cd backend
npm install
npm start        # runs on http://localhost:9001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev      # runs on http://localhost:9000
```

### 2. Seed the Database (optional)

```bash
cd backend
npm run seed
```

Loads sample users, projects, bids, and milestones so you can explore the app without starting from scratch.

## Test Commands

```bash
# Run automated E2E tests (headless)
npm run test

# Run tests in a visible browser (Chromium)
npm run test:headed

# Open the Playwright UI for interactive test running
npm run test:ui

# Open the HTML test report
npm run report
```

## Technology Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, React Router, Axios |
| Backend | Express 5, Mongoose, MongoDB |
| Auth | JWT + bcryptjs |
| Testing | Playwright |
| In-memory DB | mongodb-memory-server (dev) |

## Key Backend Routes

| Route | Description |
|-------|-------------|
| `POST /api/auth/register` | Register a new user |
| `POST /api/auth/login` | Login and receive JWT |
| `GET /api/projects` | List all projects |
| `POST /api/projects` | Create a project |
| `GET /api/bids/:projectId` | Get bids for a project |
| `POST /api/bids` | Place a bid |
| `GET /api/milestones/:projectId` | Get milestones for a project |
| `POST /api/milestones` | Create a milestone |

## Environment Variables (backend/.env)

```env
PORT=9001
MONGO_URI=mongodb://localhost:27017/freelance_db
JWT_SECRET=your_secret_here
```

The backend uses `mongodb-memory-server` by default in development, so no local MongoDB installation is required.