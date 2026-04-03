TaskIQ Monorepo

TaskIQ is a full-stack team productivity platform for CEO, Manager, and Employee workflows.

- Backend: Node.js + Express + MongoDB + JWT + capability-based RBAC
- Frontend: React + TypeScript + Vite
- Architecture: Monorepo with separate `backend/` and `frontend/` apps

## Latest Updates (March 2026)

- Added capability-driven authorization middleware across core routes (`projects`, `tasks`, `teams`, `invite`, `activity`).
- Added role resolution middleware that computes effective role, manager scope, and capability set per request.
- Added manager scope-aware filters for projects, tasks, teams, and activity feed.
- Added manager scope backfill script: `backend/scripts/backfillManagerScope.js`.
- Expanded project lifecycle APIs with assign/revoke team endpoints.
- Added CEO settings APIs (`/me`, `/me/password`) and frontend settings panel integration.
- Added API-backed project management in dashboards (create, edit, assign, revoke).
- Expanded Manager dashboard panels (projects, tasks, teams, activity, my assignments) with richer filtering and pagination hooks.

## Repository Structure

```text
TaskIQ/
	backend/    # Express API + MongoDB models + middleware
	frontend/   # React app (Vite + TypeScript)
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or hosted)

## Environment Variables

Create `backend/.env`:

```env
PORT=3000
MONGO_URI=<your-mongodb-connection-string>

JWT_ACCESS_TOKEN_SECRET=<strong-random-secret>
JWT_ACCESS_TOKEN_TTL=15m
JWT_REFRESH_TOKEN_TTL_DAYS=7

FRONTEND_URL=http://localhost:5173
INVITE_LINK_BASE_URL=http://localhost:5173

SENDGRID_API_KEY=<your-sendgrid-api-key>
EMAIL_FROM=TaskIQ <verified-sender@your-domain.com>

# Optional: set to false/0/off/no to disable manager team scope filtering
RBAC_SCOPED_ENFORCEMENT=true
```

Create `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:3000
```

## Install and Run

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Backend Scripts

From `backend/`:

- `npm start`: run API with nodemon
- `npm run migrate:manager-scope`: backfill manager scope and scoped team IDs

## Authentication

- Access token: JWT (`Authorization: Bearer <accessToken>`)
- Refresh token: opaque token stored hashed on the server
- Login/Register responses return: `user`, `accessToken`, `refreshToken`
- Frontend auto-refreshes access tokens via `/api/auth/users/refresh`

Auth endpoints:

- `POST /api/auth/ceo/register`
- `POST /api/auth/ceo/login`
- `POST /api/auth/users/register-with-invite`
- `POST /api/auth/users/refresh`
- `POST /api/auth/users/logout`
- `GET /api/auth/users/me` (CEO)
- `PUT /api/auth/users/me` (CEO)
- `PATCH /api/auth/users/me/password` (CEO)

## Core API Domains

- `api/invite`: create and validate invites
- `api/teams`: team CRUD and membership operations
- `api/members`: company member CRUD and role promotion/demotion
- `api/projects`: project CRUD, assign/revoke teams
- `api/tasks`: task CRUD, bulk actions, status/assignment updates
- `api/activity`: company activity feed

## Authorization Model

Request flow on protected routes:

1. `authenticateJWT` validates token and populates `req.user`
2. `roleResolution` computes `req.authz` (effective role, scope, capabilities)
3. `authorizeRoles` checks role gates
4. `authorizeCapability` checks fine-grained permissions
5. Scope filters restrict company/team visibility where enabled

Manager scope behavior:

- `managerScope=company`: manager can operate across company resources
- `managerScope=team`: manager is restricted to scoped teams
- Enforced when `RBAC_SCOPED_ENFORCEMENT=true`

## Frontend Highlights

- Route protection by auth/role (`frontend/src/protection/`)
- Token-aware API client with automatic refresh (`frontend/src/services/apiClient.ts`)
- Dashboard experiences for CEO, Manager, and Employee roles
- Manager dashboard includes:
	- Projects panel with search, status/team filters, due-date risk labels, sort presets, and create/edit/assign/revoke modals
	- Task workflows with query-driven pagination and assignment/status controls
	- Activity feed, teams visibility, and "My Assignments" split view

## Notes

- Root `package.json` is minimal; run backend/frontend commands in their own folders.
- If invite emails are enabled, ensure `SENDGRID_API_KEY` is valid and `EMAIL_FROM` is a verified sender in SendGrid.