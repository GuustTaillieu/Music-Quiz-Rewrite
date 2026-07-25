# 🚀 Step-by-Step Monorepo Deployment Guide (100% Free)

This guide walks you through deploying your **Spotify Music Quiz** app to the cloud using completely free services:
1. **Neon** for serverless PostgreSQL database.
2. **Render** for NestJS + WebSockets Backend.
3. **Netlify** for TanStack Start SSR Web Frontend.
4. **Spotify Developer Dashboard** for setting up production OAuth.

---

## Step 1: Set Up Free PostgreSQL Database on Neon

1. Go to [Neon.tech](https://neon.tech) and sign up for a free account.
2. Click **Create Project** and name it `spotify-music-quiz`.
3. Copy your **Connection String**. It will look like this:
   `postgresql://alex:abc123xyz@ep-sample-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require`
4. On your local machine, run the following command to push your Drizzle schema directly to Neon:
   ```bash
   DATABASE_URL="postgresql://alex:abc123xyz@ep-sample-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require" pnpm --filter @spotify-music-quiz/backend db:push
   ```
   *Your production database tables are now ready!*

---

## Step 2: Deploy Backend (NestJS + WebSockets) to Render

1. Go to [Render.com](https://render.com) and log in.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `spotify-quiz-backend`
   - **Root Directory**: `apps/backend`
   - **Environment**: `Node`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start:prod` (or `node dist/main`)
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add the following keys:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: *(Your Neon connection string from Step 1)*
   - `FRONTEND_URL`: `https://spotify-music-quiz.netlify.app` *(or your Netlify URL)*
   - `BETTER_AUTH_SECRET`: *(A random 32-character secret)*
   - `BETTER_AUTH_URL`: `https://spotify-music-quiz.netlify.app/api/auth`
   - `SPOTIFY_CLIENT_ID`: *(Your Spotify Client ID)*
   - `SPOTIFY_CLIENT_SECRET`: *(Your Spotify Client Secret)*
6. Click **Create Web Service**.
7. Once deployed, copy your Render URL (e.g. `https://spotify-quiz-backend.onrender.com`).

---

## Step 3: Deploy Frontend (TanStack Start) to Netlify

1. Go to [Netlify.com](https://netlify.com) and log in.
2. Click **Add new site** -> **Import an existing project**.
3. Connect your GitHub repository.
4. Netlify will automatically detect `netlify.toml`. Configure build settings:
   - **Base directory**: *(Leave blank or set to root)*
   - **Build command**: `pnpm --filter @spotify-music-quiz/web build`
   - **Publish directory**: `apps/web/dist/client`
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://spotify-quiz-backend.onrender.com` *(Your Render URL from Step 2)*
   - `VITE_WS_URL`: `https://spotify-quiz-backend.onrender.com` *(Your Render URL from Step 2)*
6. Click **Deploy Site**.

---

## Step 4: Update Spotify Developer Dashboard

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Select your app.
3. Click **Settings**.
4. In **Redirect URIs**, add:
   `https://<your-netlify-app-name>.netlify.app/api/auth/callback/spotify`
5. Click **Save**.

---

## ⚡ Painfree Local Development

Your local development flow remains unchanged!
- Run `pnpm backend:dev` to start local NestJS & local Docker database.
- Run `pnpm web:dev` to start local TanStack web frontend.
