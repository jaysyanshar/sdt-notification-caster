# Notification Caster

A TypeScript + Express.js service that manages users and automatically sends birthday greetings at 09:00 in each user's local timezone. Jobs are persisted in PostgreSQL via Prisma, retried with exponential backoff, and processed by a lightweight worker loop.

## Prerequisites
- Node.js 20+
- npm
- PostgreSQL database (empty schema is fine)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template and customize values:
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Apply migrations to your database:
   ```bash
   npm run prisma:migrate
   ```

## Environment Variables
All configuration is read from the environment. Key values:
- `DATABASE_URL` (required): PostgreSQL connection string.
- `PORT` (default `3000`): API port.
- `LOG_LEVEL` (default `info`).
- `WORKER_BATCH_SIZE` (default `10`): number of jobs claimed per poll.
- `WORKER_IDLE_MS` (default `30000`): idle sleep when no jobs are due.
- `EMAIL_SERVICE_URL` (default `https://email-service.digitalenvision.com.au`).
- `EMAIL_SERVICE_ENDPOINT` (default `/send-email`).
- `EMAIL_TIMEOUT_MS` (default `5000`).

## Running
- API (development):
  ```bash
  npm run dev
  ```
- API (production build):
  ```bash
  npm run build
  npm start
  ```
- Worker:
  ```bash
  npm run worker
  ```

## API
Base path: `/api/user`

### Create user
```bash
curl -X POST http://localhost:3000/api/user \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "birthDate": "1990-05-02",
    "timezone": "Asia/Jakarta"
  }'
```

### Update user
```bash
curl -X PUT http://localhost:3000/api/user/<userId> \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "birthDate": "1990-05-02",
    "timezone": "America/New_York"
  }'
```

### Delete user
```bash
curl -X DELETE http://localhost:3000/api/user/<userId>
```

## Scheduling & Delivery
- Birthdays are scheduled for **09:00 local time** in the provided IANA timezone. The timestamp is converted to UTC and stored as a job.
- If the current day/time is already past 09:00 locally, the next year is scheduled.
- **Feb 29 birthdays** are delivered on Feb 28 in non-leap years.
- Each job is unique per user/type/scheduledAtUtc (database constraint) to prevent duplicates.
- The worker polls for due jobs, claims them with `FOR UPDATE SKIP LOCKED`, and sends email payloads as `{ "email": "<user email>", "message": "Hey, <first> <last>, it's your birthday" }` with an `Idempotency-Key` header equal to the job id.
- Failures/timeouts set the job to `RETRY` with exponential backoff + jitter (capped at 1 hour) stored in `nextAttemptAtUtc`.
- After a successful send, the next year's birthday job is scheduled automatically.

## Formats
- `timezone`: IANA zone string (e.g., `Asia/Jakarta`, `America/New_York`, `Australia/Melbourne`).
- `birthDate`: ISO date `YYYY-MM-DD`.
- `email`: standard email address.

## Tests
Run all tests (unit + integration):
```bash
npm test
```

Tests include scheduling calculations, API flows, worker success/failure, and concurrency protections for duplicate sends.
