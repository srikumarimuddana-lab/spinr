# Deployment Guide: Vercel + Fly.io Hybrid

This guide explains how to deploy the Spinr application using a hybrid approach:
- **Frontend (Expo Web)**: Vercel (Static Site)
- **Admin Dashboard (Next.js)**: Vercel (Next.js App)
- **Backend (Python/FastAPI)**: Fly.io (Persistent WebSocket Service)

## 1. Backend Deployment (Fly.io)

The backend must be deployed first so you have the URL to provide to the frontend.

1.  **Install Fly.io CLI**:
    ```bash
    curl -L https://fly.io/install.sh | sh
    ```
2.  **Login**:
    ```bash
    fly auth login
    ```
3.  **Launch (First Time)**:
    - Run from the **root directory**:
    ```bash
    fly launch --copy-config
    ```
    - When asked "Do you want to tweak these settings?", say **No** (we have a `fly.toml` already).
    - It might ask for a name; provide `spinr-backend` or similar.

4.  **Set Secrets**:
    - You must set your environment variables before deploying:
    ```bash
    fly secrets set SUPABASE_URL=your_url \
                    SUPABASE_KEY=your_key \
                    JWT_SECRET=your_jwt_secret \
                    FIREBASE_SERVICE_ACCOUNT_JSON="$(cat path/to/firebase-admin.json)"
    ```

5.  **Deploy**:
    ```bash
    fly deploy
    ```
6.  **Get URL**: The CLI will output your URL (e.g., `https://spinr-backend.fly.dev`).

## 2. Frontend Deployment (Vercel)

Deploy the Expo Web app as a static site.

1.  **Create Vercel Account**: Go to [vercel.com](https://vercel.com).
2.  **Install Vercel CLI** (Optional but recommended): `npm i -g vercel`
3.  **Import Project**:
    - Click "Add New..." -> "Project".
    - Import your `spinr` repository.
4.  **Configure Project**:
    - **Root Directory**: `frontend` (Click "Edit" next to Root Directory).
    - **Framework Preset**: Select "Other" or "Vite" (Expo exports static files).
    - **Build Command**: `npx expo export --platform web`
    - **Output Directory**: `dist`
5.  **Environment Variables**:
    You **MUST** set these environment variables in the Vercel Project Settings for the app to work:

    - `EXPO_PUBLIC_BACKEND_URL`: The URL of your Fly.io backend (e.g., `https://spinr-backend.fly.dev`).
    - `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps API Key.

    **Firebase Configuration (Required):**
    - `EXPO_PUBLIC_FIREBASE_API_KEY`: Your Firebase Web API Key.
    - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`: `your-project.firebaseapp.com`
    - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`: `your-project-id`
    - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`: `your-project.appspot.com`
    - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Your Sender ID.
    - `EXPO_PUBLIC_FIREBASE_APP_ID`: Your App ID.

6.  **Deploy**: Click "Deploy".

**Note**: The `vercel.json` file in `frontend/` handles routing rewrites for the SPA.

## 3. Admin Dashboard Deployment (Vercel)

Deploy the Next.js admin panel.

1.  **Import Project**:
    - Go to Vercel Dashboard.
    - Click "Add New..." -> "Project".
    - Import the SAME repository again.
2.  **Configure Project**:
    - **Project Name**: `spinr-admin` (or similar).
    - **Root Directory**: `admin-dashboard` (Click "Edit").
    - **Framework Preset**: Next.js (Should be auto-detected).
3.  **Environment Variables**:
    - Add `NEXT_PUBLIC_API_URL`: The URL of your Fly.io backend (e.g., `https://spinr-backend.fly.dev`).
4.  **Deploy**: Click "Deploy".

## Troubleshooting

-   **Firebase Error (auth/invalid-api-key)**: Ensure `EXPO_PUBLIC_FIREBASE_API_KEY` is set correctly in Vercel Environment Variables.
-   **CORS Issues**: Ensure your Backend Environment Variable `ALLOWED_ORIGINS` includes your new Vercel domains.
-   **Missing API Key**: If maps don't load, verify `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set in Vercel.
-   **WebSockets**: Fly.io supports persistent WebSockets natively. Ensure your client connects via `wss://` if on HTTPS.
