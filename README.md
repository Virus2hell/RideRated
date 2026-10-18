# RideRated

Road reviews and rides from the biker community. Riders pin a road on the map, rate it
(surface, scenery, traffic, safety), add photos, and others like and comment.
Launching first around **Mumbai and Pune**.

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React 19 (Vite), React Router, TanStack Query, Tailwind CSS v4 |
| Backend  | Node.js, Express 5, Zod validation, JWT in httpOnly cookies |
| Database | PostgreSQL + PostGIS (geospatial "roads near me" search) |

## Project structure

```
riderated/
├── client/                    React app
│   └── src/
│       ├── components/        Reusable UI (Navbar, FormField, ProtectedRoute)
│       ├── context/           AuthContext: current user, login/register/logout
│       ├── lib/api.js         Axios instance + error helpers
│       └── pages/             One file per route
└── server/                    Express API
    └── src/
        ├── config/env.js      Validated environment variables
        ├── db/
        │   ├── migrations/    Plain SQL files, applied in order
        │   ├── migrate.js     Migration runner
        │   └── pool.js        Postgres connection pool
        ├── middleware/        Auth (requireAuth/optionalAuth), error handler
        ├── controllers/       Request handlers (business logic)
        ├── routes/            URL → controller mapping
        ├── utils/
        ├── app.js             Express app setup
        └── index.js           Starts the server
```

## Running locally

Prerequisites: Node 20+, PostgreSQL 14+ with the PostGIS extension.

```bash
# 1. Create the database
createdb riderated

# 2. API
cd server
cp .env.example .env          # then edit DATABASE_URL and JWT_SECRET
npm install
npm run migrate
npm run dev                   # http://localhost:4000

# 3. Client (new terminal)
cd client
npm install
npm run dev                   # http://localhost:5173 (proxies /api to :4000)
```

## API

| Method | Path                 | Auth | Description |
|--------|----------------------|------|-------------|
| GET    | `/api/health`        |      | Health check |
| POST   | `/api/auth/register` |      | `{ username, email, password, displayName }` |
| POST   | `/api/auth/login`    |      | `{ email, password }` |
| POST   | `/api/auth/logout`   |      | Clears the auth cookie |
| GET    | `/api/auth/me`       | ✔    | Current user |

## Roadmap

- [x] Project setup, database schema, authentication
- [ ] Road reviews: create, list, view, with map pin and ratings
- [ ] Explore map (Leaflet + OpenStreetMap), "roads near me"
- [ ] Photo uploads (Cloudinary)
- [ ] Likes and comments
- [ ] Rider profiles and garage (bikes), Instagram/YouTube links
- [ ] Follow riders, home feed
- [ ] Short ride videos / reels
- [ ] Bad-roads heatmap
