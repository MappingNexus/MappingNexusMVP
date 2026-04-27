# Implementation Notes

## BullMQ Embedding Queue Feature

### What was built
Implemented an asynchronous background worker queue using Redis and BullMQ to generate embedding vectors for the AI Matching Engine. This replaces the previous synchronous process, allowing the Express API to respond instantly while embeddings are processed in the background. The queue relies on the OpenRouter API (`text-embedding-3-small`) to generate 384-dimensional vectors that are written to the Neon DB.

### Files added/modified
- **Added**: `backend/src/workers/queue.ts` - Initializes the BullMQ Queue and exports the `enqueueEmbeddingJob` helper function.
- **Added**: `backend/src/workers/embedding.worker.ts` - Implements the BullMQ Worker that processes jobs, calls the OpenRouter API, and executes the SQL UPDATE against Neon DB.
- **Modified**: `backend/src/routes/employees.routes.ts` - Refactored `POST /` and `PUT /:id` to insert skills synchronously with `embedding: null` and invoke the background queue instead of waiting for the API.
- **Modified**: `backend/src/server.ts` - Imported the worker so it is launched automatically with the Express server.
- **Modified**: `backend/.env.example` - Appended `REDIS_URL` documentation.
- **Modified**: `backend/package.json` - Added `bullmq` and `ioredis` to dependencies (via `npm install`).

### How to set up Redis (Render or Upstash free tier instructions)
You will need a Redis instance to act as the message broker for BullMQ. You can use free tiers from either Upstash or Render.

**Using Upstash (Recommended for serverless):**
1. Go to [Upstash](https://upstash.com/) and create a free account.
2. Create a new Redis database.
3. Scroll down to the "Node" connection settings and copy the `ioredis` connection string (it will look like `redis://default:password@endpoint:port`).
4. Set this as your `REDIS_URL` in your `.env` file.

**Using Render:**
1. Go to [Render](https://render.com/) and log in.
2. Click "New" -> "Redis".
3. Name your instance and select the free instance type.
4. Once deployed, copy the "Internal Redis URL" (if backend is on Render) or "External Redis URL" (if running locally).
5. Set this as your `REDIS_URL` in your `.env` file.

### Environment variables needed
The following variables must be added to your `backend/.env` file:
```env
REDIS_URL=redis://your-redis-url-here
OPENROUTER_API_KEY=sk-or-your-key-here
```
