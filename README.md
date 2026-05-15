# Pollinate

Create, share, run, and analyze live polls and quiz-style sessions in real time.

## Stack

- **Frontend:** React 19, TanStack Router, Tailwind CSS v4, shadcn/ui, Socket.IO Client
- **Backend:** Express 5, Drizzle ORM, PostgreSQL, Socket.IO
- **Auth:** JWT, email/password, Google OAuth, bcryptjs

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Install and migrate

```bash
pnpm install
pnpm run db:migrate
```

### 3. Start the app

```bash
pnpm run dev
```

- Client: http://localhost:3000
- API: http://localhost:8000

## Demo Flow

1. Open http://localhost:3000
2. Register or sign in.
3. Create a poll with questions, options, correct answers, timers, and anonymous mode.
4. Click **Go Live** on the poll detail page.
5. Share the `/p/:shareId` link or join code.
6. Use **Start Live**, **Next Question**, **Close Responses**, and **Finish Quiz** from the owner page.
7. Respondents see only the current host-controlled question while the timer is active.
8. After completion, respondents can only view the read-only leaderboard.
9. The owner can still view live results and analytics from the dashboard.

## Railway Deploy

Use the repo root as the Railway service root.

```bash
pnpm install
pnpm run build
pnpm run start
```

Set these Railway variables:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=<strong-random-secret>
APP_URL=https://your-railway-app.up.railway.app
API_URL=https://your-railway-app.up.railway.app
CORS_ORIGIN=https://your-railway-app.up.railway.app
GOOGLE_CLIENT_ID=<optional>
GOOGLE_CLIENT_SECRET=<optional>
```

For Google OAuth, add this authorized redirect URI in Google Console:

```bash
https://your-railway-app.up.railway.app/api/auth/google/callback
```

## API Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/auth/google | No | Start Google OAuth |
| POST | /api/polls | Yes | Create poll |
| GET | /api/polls | Yes | List polls |
| GET | /api/polls/:id | Yes | Get poll |
| PATCH | /api/polls/:id | Yes | Update poll |
| DELETE | /api/polls/:id | Yes | Delete poll |
| GET | /api/polls/:id/results | Yes | Results and owner leaderboard |
| GET | /api/polls/:id/analytics | Yes | Analytics |
| GET | /api/public/polls/:shareId | No | Get live or completed public poll |
| GET | /api/public/polls/:shareId/leaderboard | No | Read-only leaderboard after quiz completion |
| POST | /api/public/polls/:shareId/respond | No | Submit response while active |

## Socket Events

- Client to Server: `poll:join`
- Client to Server: `poll:leave`
- Owner to Server: `poll:live-state:set`
- Server to Client: `poll:live-state`
- Server to Client: `participant:count`
- Server to Client: `response:new`
