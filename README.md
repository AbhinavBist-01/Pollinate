# Pollinate

Create, share, and analyze polls in real-time.

## Stack

- **Frontend:** React 19, TanStack Router, Tailwind CSS v4, Socket.IO Client
- **Backend:** Express 5, Drizzle ORM, PostgreSQL, Socket.IO
- **Auth:** JWT (email/password), bcrypt

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Run database migrations

```bash
cd server
pnpm install
pnpm run db:migrate
```

### 3. Start the server

```bash
cd server
pnpm run dev
# API at http://localhost:8000
```

### 4. Start the client

```bash
cd client
pnpm install
pnpm run dev
# App at http://localhost:3000
```

Or use the root script to start both:

```bash
pnpm run dev
```

## Demo Flow

1. Open http://localhost:3000
2. Register a new account
3. Click **Create Poll** and add questions
4. Set a **timer** (seconds) per question if desired
5. Click **Create Poll** → you'll see the poll detail page
6. Click **Publish** to make it accessible
7. Copy the **share link** and open it in a private window
8. Submit a response on the public page
9. View **Results** (top performers, ranking) and **Analytics** (real-time via Socket.IO)

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Yes | Current user |
| POST | /api/polls | Yes | Create poll |
| GET | /api/polls | Yes | List polls |
| GET | /api/polls/:id | Yes | Get poll |
| PATCH | /api/polls/:id | Yes | Update poll |
| DELETE | /api/polls/:id | Yes | Delete poll |
| GET | /api/polls/:id/results | Yes | Results with top performers |
| GET | /api/polls/:id/analytics | Yes | Analytics with real-time |
| GET | /api/public/polls/:shareId | No | Get public poll |
| POST | /api/public/polls/:shareId/respond | No | Submit response |

## Socket Events

- Client → Server: `poll:join` (join poll room)
- Server → Client: `response:new` (new response submitted)
