# TalabaUy backend setup

This project now uses a Node.js + Express + Prisma backend with JWT auth and a SQLite database.
The backend also serves the static frontend files in this folder.

## Quick start
1. `npm install`
2. Set `.env` values (see `.env.example` for required keys).
3. `npm run prisma:migrate`
4. `npm run prisma:seed`
5. `npm run dev`

Open `http://localhost:4000` in your browser.

## Notes
- Admin credentials are controlled by `ADMIN_EMAIL`, `ADMIN_USER`, and `ADMIN_PASS`.
- Listings CRUD is at `/api/listings`. Admin actions require a JWT token.
- Uploaded images are stored in `uploads/` and served at `/uploads/...`.
