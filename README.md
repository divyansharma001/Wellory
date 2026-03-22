# Health Tracker Server

AI-powered backend for a health tracking app with:

- text health logs
- grounded nutrition chat
- photo-based food logging
- daily nutrition summaries and goals

## Stack

- `Express` for the API
- `Better Auth` for auth/session handling
- `PostgreSQL + Drizzle ORM` for app data
- `Redis + BullMQ` for background jobs
- `Qdrant` for vector memory
- `Gemini` for embeddings, chat, fact extraction, and food image analysis

## What It Does

- `POST /api/logs`: save a health log and process it in the background
- `POST /api/chat`: answer health/nutrition questions using stored context
- `POST /api/food`: upload a meal photo for AI nutrition analysis
- `GET /api/food`, `GET /api/food/:id`, `PATCH /api/food/:id`, `DELETE /api/food/:id`
- `GET /api/goals`, `PUT /api/goals`
- `GET /api/goals/nutrition?period=day|week`
- `GET /api/goals/progress?days=30`

Food uploads are stored locally under `server/uploads/food` and served from `/uploads/food/...`.

## Project Structure

```text
server/
  src/
    middleware/   # auth, validation, upload, error handling
    routes/       # logs, chat, food, goals
    schemas/      # Zod validation
    services/     # chat context + nutrition aggregation
    workers/      # BullMQ workers
    db/           # Drizzle schema + DB connection
    lib/          # auth, Gemini, Qdrant, Redis, queues
    utils/        # helpers, logger, app errors
```

## Main Flows

### Health Logs

1. User sends a text log to `/api/logs`
2. The API stores it in Postgres
3. A worker embeds it, extracts facts, and updates daily context in Qdrant

### Food Photos

1. User uploads a meal image to `/api/food`
2. The API stores the file and creates a pending `food_log`
3. A worker sends the image to Gemini for analysis
4. The result is saved to Postgres, embedded into Qdrant, and rolled into the user's daily nutrition summary

### Goals and Dashboard

- `nutrition_goal` stores calorie and macro targets
- `daily_nutrition_summary` stores per-day totals and meal splits
- goal and progress endpoints read from these summaries for fast dashboard queries

## Local Setup

Create `server/.env` with:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/health_tracker_db
BETTER_AUTH_SECRET=your_random_secure_string_here
BETTER_AUTH_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
GEMINI_API_KEY=your_gemini_api_key
```

Start infra:

```bash
cd server
docker compose up -d
```

Install and run:

```bash
npm install
npm run db:generate
npm run dev
```

## Notes

- Drizzle migrations live in `server/drizzle/`
- This is a coaching/tracking backend, not a medical diagnosis system
- Live verification still depends on Postgres, Redis, Qdrant, auth, and Gemini all being available
