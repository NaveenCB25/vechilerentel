# Render Deployment Guide (VRMS Pro)

This repo can be deployed as a single Render service (API + SPA) or as separate frontend + backend services.

## Option A: Single Render Web Service (Recommended)
- Create a Render **Web Service** from this repo.
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment variables (minimum):**
  - `NODE_ENV=production`
  - `PORT=3000`
  - `MONGODB_URI=...`
  - `JWT_SECRET=...`
  - `ADMIN_USERNAME=...`
  - `ADMIN_PASSWORD=...`

With this setup, the frontend calls the API on the same origin by default.

## Option B: Vercel Frontend + Render Backend
If you host the frontend separately, set:
- `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`

The frontend uses `VITE_API_BASE_URL` when provided; otherwise it defaults to the current site origin.
