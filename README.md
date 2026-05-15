# Pollinate

Pollinate is a live polling and quiz platform built for real-time audience responses. Hosts can create timed questions, publish a share link or QR code, control which question is currently live, watch responses arrive instantly, and finish with a read-only leaderboard.

Production: [pollinate.abhinavsingh01.dev](https://pollinate.abhinavsingh01.dev)

## Features

- Email/password authentication with JWT
- Google OAuth sign in
- Poll creation with title, description, questions, options, timers, and correct answers
- Single-choice, multiple-choice, and text questions
- Anonymous voting or account-based voting
- Host-controlled live quiz flow
- Real-time participant count
- Real-time response/result updates with Socket.IO
- Manual publish, close responses, next question, and finish quiz controls
- Public poll link and QR code sharing
- Read-only public leaderboard after quiz completion
- Owner dashboard with poll management, results, and analytics
- Dark/light theme toggle
- Responsive React UI with Tailwind and shadcn/ui

## Tech Stack

| Area | Tech |
| --- | --- |
| Frontend | React 19, Vite, TanStack Router, Tailwind CSS v4, shadcn/ui |
| State/Data | Zustand, Axios, Socket.IO Client |
| Backend | Node.js, Express 5, Socket.IO |
| Database | PostgreSQL, Drizzle ORM, Drizzle Kit |
| Auth | JWT, bcryptjs, Google OAuth |
| Tooling | pnpm workspaces, TypeScript, ESLint, Prettier, Husky |
| Deployment | Railway |

## Project Structure

```text
Pollinate/
  client/
    src/
      components/
      lib/
      routes/
      state/
  server/
    src/
      app/
        lib/
        middleware/
        modules/
      db/
  package.json
  pnpm-workspace.yaml
  README.md
```

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

On Windows PowerShell, if `pnpm` is blocked by execution policy, use:

```powershell
cmd /c pnpm install
```

### 2. Create env files

Create `server/.env`:

```env
DATABASE_URL=postgres://postgres:password@localhost:5433/pollinate
PORT=8000
API_URL=http://localhost:8000
APP_URL=http://localhost:3000
JWT_SECRET=change-this-to-a-secure-secret
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

### 3. Start PostgreSQL

From the `server` folder:

```bash
docker compose up -d
```

The local database runs on:

```text
localhost:5433
```

### 4. Create database tables

For local development, the fastest setup is:

```bash
pnpm run db:push
```

For migration-based flow:

```bash
cd server
pnpm run db:generate
pnpm run db:migrate
```

### 5. Start development servers

From the repo root:

```bash
pnpm run dev
```

Local URLs:

```text
Client: http://localhost:3000
API:    http://localhost:8000
Health: http://localhost:8000/api/health
```

## Scripts

Run from the repo root:

| Command | Description |
| --- | --- |
| `pnpm run dev` | Start client and server |
| `pnpm run dev:client` | Start Vite client only |
| `pnpm run dev:server` | Start Express server only |
| `pnpm run build` | Build client and server |
| `pnpm run start` | Start built server |
| `pnpm run lint` | Run ESLint in client and server |
| `pnpm run typecheck` | Run TypeScript checks |
| `pnpm run format` | Format with Prettier |
| `pnpm run format:check` | Check formatting |
| `pnpm run db:migrate` | Run Drizzle migrations |

Server-only DB scripts:

```bash
cd server
pnpm run db:generate
pnpm run db:migrate
pnpm run db:push
pnpm run db:studio
```

## App Flow

1. Host registers or signs in.
2. Host creates a poll with questions, options, correct answers, and timers.
3. Host publishes the poll.
4. Host shares the public `/p/:shareId` link or QR code.
5. Respondent joins anonymously or with a Pollinate account.
6. Host starts the live quiz.
7. Respondents see only the currently active question.
8. Responses are accepted only while the timer is running.
9. Host moves to the next question.
10. Host finishes the quiz.
11. Respondents can only view the read-only leaderboard.
12. Host can review results and analytics from the dashboard.

## Scoring Rules

- Only non-text questions with correct options are scored.
- Each fully correct question gives `1 point`.
- Radio questions require the selected option to match the correct option.
- Checkbox questions require the selected option set to exactly match all correct options.
- Leaderboard is sorted by highest score first.
- Ties are sorted by earlier submission time.

## API Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register with email/password |
| POST | `/api/auth/login` | No | Login with email/password |
| GET | `/api/auth/me` | Yes | Current authenticated user |
| GET | `/api/auth/google` | No | Start Google OAuth |
| GET | `/api/auth/google/callback` | No | Google OAuth callback |
| POST | `/api/polls` | Yes | Create poll |
| GET | `/api/polls` | Yes | List owner polls |
| GET | `/api/polls/:id` | Yes | Get owner poll detail |
| PATCH | `/api/polls/:id` | Yes | Update poll |
| DELETE | `/api/polls/:id` | Yes | Delete poll |
| GET | `/api/polls/:id/results` | Yes | Results and owner leaderboard |
| GET | `/api/polls/:id/analytics` | Yes | Analytics |
| GET | `/api/public/polls/:shareId` | No | Get public poll |
| POST | `/api/public/polls/:shareId/respond` | Optional | Submit public response |
| GET | `/api/public/polls/:shareId/leaderboard` | No | Public read-only leaderboard |

## Socket Events

| Direction | Event | Description |
| --- | --- | --- |
| Client to Server | `poll:join` | Join a poll room |
| Client to Server | `poll:leave` | Leave a poll room |
| Owner to Server | `poll:live-state:set` | Owner updates active question/timer state |
| Server to Client | `poll:live-state` | Broadcast current live state |
| Server to Client | `participant:count` | Broadcast live participant count |
| Server to Client | `response:new` | Notify result viewers about a new response |

## Google OAuth Setup

In Google Cloud Console, create an OAuth client:

- Application type: `Web application`
- Authorized JavaScript origin:

```text
https://pollinate.abhinavsingh01.dev
```

- Authorized redirect URI:

```text
https://pollinate.abhinavsingh01.dev/api/auth/google/callback
```

For local development, add:

```text
http://localhost:3000
http://localhost:8000/api/auth/google/callback
```

Railway variables required for Google OAuth:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APP_URL=https://pollinate.abhinavsingh01.dev
API_URL=https://pollinate.abhinavsingh01.dev
```

## Railway Deployment

Use the repo root as the Railway service root.

Build command:

```bash
pnpm install && pnpm run build
```

Start command:

```bash
pnpm run start
```

Required Railway variables:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=strong-random-production-secret
APP_URL=https://pollinate.abhinavsingh01.dev
API_URL=https://pollinate.abhinavsingh01.dev
CORS_ORIGIN=https://pollinate.abhinavsingh01.dev,https://pollinate-production.up.railway.app
CLIENT_ORIGIN=https://pollinate.abhinavsingh01.dev
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

If the database has no tables after deployment, run:

```bash
cd server && pnpm run db:push
```

When running DB commands from your local machine against Railway Postgres, use Railway's public database URL in local `server/.env`:

```env
DATABASE_URL=<DATABASE_PUBLIC_URL>
```

Inside Railway, the app service should keep Railway's internal `DATABASE_URL`.

## Production Smoke Test

After deployment:

1. Open [pollinate.abhinavsingh01.dev](https://pollinate.abhinavsingh01.dev).
2. Register with email/password.
3. Try Google sign in.
4. Create a poll with at least two scored questions.
5. Publish it.
6. Open the public link in incognito or another device.
7. Join anonymously and submit answers.
8. Join again from another browser as a logged-in user.
9. Finish the quiz from the host page.
10. Confirm the public leaderboard shows score as `correct / total`.
11. Confirm owner results and analytics pages load.

## Troubleshooting

### `eslint is not recognized`

The workspace install is incomplete. Reinstall dependencies:

```powershell
cmd /c pnpm install
```

If Windows locks native Tailwind files, stop running Node processes and retry:

```powershell
Stop-Process -Name node -Force
cmd /c pnpm install
```

### Google OAuth shows `invalid_request`

Check that `APP_URL` and `API_URL` include `https://` and match the Google redirect URI exactly:

```env
APP_URL=https://pollinate.abhinavsingh01.dev
API_URL=https://pollinate.abhinavsingh01.dev
```

Google redirect URI:

```text
https://pollinate.abhinavsingh01.dev/api/auth/google/callback
```

### Registration fails in production

Check that the Postgres database has tables. If not, run:

```bash
cd server && pnpm run db:push
```

### CORS blocks the deployed domain

Make sure Railway has:

```env
CORS_ORIGIN=https://pollinate.abhinavsingh01.dev,https://pollinate-production.up.railway.app
CLIENT_ORIGIN=https://pollinate.abhinavsingh01.dev
```

## License

ISC
