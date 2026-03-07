TaskIQ Monorepo

## Backend JWT Setup

Set these environment variables in `backend/.env`:

- `JWT_ACCESS_TOKEN_SECRET=<strong-random-secret>`
- `JWT_ACCESS_TOKEN_TTL=15m` (optional, default `15m`)
- `JWT_REFRESH_TOKEN_TTL_DAYS=7` (optional, default `7`)
- `FRONTEND_URL=http://localhost:5173`
- `INVITE_LINK_BASE_URL=http://localhost:5173` (optional)

## Auth API Changes

- `POST /api/auth/ceo/login` returns `user`, `accessToken`, `refreshToken`
- `POST /api/auth/ceo/register` returns `user`, `accessToken`, `refreshToken`
- `POST /api/auth/users/register-with-invite` returns `user`, `accessToken`, `refreshToken`
- `POST /api/auth/users/refresh` rotates refresh token and returns new tokens
- `POST /api/auth/users/logout` invalidates the stored refresh token

Protected routes now require `Authorization: Bearer <accessToken>`.