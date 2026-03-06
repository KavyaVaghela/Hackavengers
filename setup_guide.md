# PetPooja - Setup & Deployment Guide (Supabase Edition)

This guide explains how to configure Google OAuth, set up Supabase PostgreSQL, run the project locally, and deploy it to Vercel and Render.

---

## 1. Create Google OAuth Credentials (Google Cloud Console)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > Credentials**.
4. Click **Create Credentials** -> **OAuth client ID**.
5. If prompted, configure the **OAuth consent screen** first (choose External, add app name, user support email, and save).
6. Once on the OAuth client ID creation page, select **Web application**.
7. Name it "PetPooja Web".
8. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local dev)
   - `https://your-vercel-domain.vercel.app` (for production)
9. Click **Create**.
10. Copy your **Client ID** and save it. 

---

## 2. Configure Supabase Database

1. Go to [Supabase](https://supabase.com/) and sign in.
2. Click **New Project**, select an organization, and give it a name (e.g., "PetPooja"). Let it generate a secure database password, choose a region closest to you, and click **Create new project**.
3. Once the project is provisioned, go to the **SQL Editor** on the left menu (it looks like a `>_` terminal icon).
4. Click **New Query** and paste the following SQL exactly as written:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "googleId" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create restaurants table
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "restaurantName" TEXT NOT NULL,
  "ownerName" TEXT NOT NULL,
  "gstNumber" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Protect internal tables from anonymous web access 
-- (Our backend uses the Service Role key to bypass Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
```

5. Click **Run** in the bottom right. Your tables are now created!
6. Finally, go to **Project Settings** (the gear icon `⚙️` at the bottom left) -> **API**.
7. Under "Project URL", copy the **URL**. This is your `SUPABASE_URL`.
8. Under "Project API keys", copy the **service_role** key (secret). This is your `SUPABASE_SERVICE_ROLE_KEY`.

---

## 3. Local Development

### Run the Backend Locally

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd petpooja/backend
   ```
2. Create a `.env` file (copy from `.env.example`) and fill it out:
   ```env
   PORT=5000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GOOGLE_CLIENT_ID=your_google_client_id
   JWT_SECRET=any_random_secure_string_here
   ```
3. Start the server:
   ```bash
   node server.js
   ```

### Run the Frontend Locally

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd petpooja/frontend
   ```
2. Create a `.env.local` file (copy from `.env.local.example`) and fill it out:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
3. Start the Next.js dev server:
   ```bash
   npm run dev
   ```

---

## 4. Deployment (Publishing your website)

To publish your website on the internet, you will use **Render** for the backend and **Vercel** for the frontend. Both services require you to have your code stored in a GitHub repository.

### Step 4.1: Push your code to GitHub

1. Ensure your local code is committed.
2. If you haven't yet, create an empty repository on GitHub and push it:
   ```bash
   git remote add origin https://github.com/<your-username>/petpooja.git
   git branch -M main
   git push -u origin main
   ```

### Step 4.2: Deploy Backend on Render

1. Go to [Render](https://render.com/) and create a new **Web Service** -> **Build and deploy from a Git repository**.
2. Connect your GitHub account and select your `petpooja` repository.
3. Configure the service:
   - **Root Directory**: `backend` (This is very important!)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Click **Advanced** and add these Environment Variables:
   - `SUPABASE_URL`: (Your Supabase URL)
   - `SUPABASE_SERVICE_ROLE_KEY`: (Your Supabase service_role key)
   - `GOOGLE_CLIENT_ID`: (Your Google Client ID)
   - `JWT_SECRET`: (Your secret string, e.g., `my_super_secret`)
5. Click **Create Web Service**. Wait for it to finish deploying and copy the deployed backend URL (e.g., `https://petpooja-api.onrender.com`).

### Step 4.3: Deploy Frontend on Vercel

1. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Import your `petpooja` GitHub repository.
3. Configure the project:
   - **Root Directory**: Click "Edit" and change it to `frontend`.
   - The Framework Preset should automatically be recognized as Next.js.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: (Your Google Client ID)
   - `NEXT_PUBLIC_API_URL`: (The URL of your deployed Render backend from Step 4.2, e.g., `https://petpooja-api.onrender.com`)
5. Click **Deploy**.
6. **Important Final Step**: Once Vercel generates your production domain (e.g., `https://petpooja-frontend.vercel.app`), go back to your Google Cloud Console and add this exact URL to the **Authorized JavaScript origins** section. Without this, Google Login will fail on the live site!
