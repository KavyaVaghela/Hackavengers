# PetPooja - Setup & Deployment Guide

This guide explains how to configure Google OAuth, set up MongoDB Atlas, run the project locally, and deploy it to Vercel and Render.

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
10. Copy your **Client ID** and save it. You do not strictly need the Client Secret for `@react-oauth/google`.

---

## 2. Configure MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a free shared cluster.
3. In **Database Access**, create a new database user with a secure username and password.
4. In **Network Access**, click Add IP Address and allow access from anywhere (`0.0.0.0/0`) since Render IPs are dynamic.
5. In **Database**, click **Connect** -> **Connect your application**.
6. Copy the connection string (URI). It looks like:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/petpooja?retryWrites=true&w=majority`
7. Replace `<username>` and `<password>` with your database user credentials. Add `petpooja` before the `?` to specify the database name.

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
   MONGO_URI=your_mongodb_connection_string
   GOOGLE_CLIENT_ID=your_google_client_id
   JWT_SECRET=any_random_secure_string_here
   ```
3. Start the server:
   ```bash
   node server.js
   ```
   *You should see "MongoDB connected successfully" and "Server is running on port 5000".*

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
4. Open `http://localhost:3000` in your browser.

---

## 4. Connect Frontend with Backend locally

The connection is already handled. The Next.js components use Axios to send requests to `process.env.NEXT_PUBLIC_API_URL` (which points to `http://localhost:5000` locally). The Express server responds using CORS (allowed by `app.use(cors())`).

---

## 5. Deployment (Publishing your website)

To publish your website on the internet, you will use **Render** for the backend and **Vercel** for the frontend. Both services require you to have your code stored in a GitHub repository.

### Step 5.1: Push your code to GitHub

1. I have already initialized a local Git repository for your project.
2. Go to [GitHub](https://github.com/) and create a new repository (e.g., named `petpooja`). Do NOT initialize it with a README, .gitignore, or license.
3. Open your terminal in the `petpooja` folder and run the commands GitHub gives you to push an existing repository. It usually looks like this:
   ```bash
   git remote add origin https://github.com/<your-username>/petpooja.git
   git branch -M main
   git push -u origin main
   ```
4. Now your code is live on GitHub!

### Step 5.2: Deploy Backend on Render

1. Go to [Render](https://render.com/) and create a new **Web Service**.
2. Connect your GitHub account and select your `petpooja` repository.
3. Once connected, configure the service:
   - **Root Directory**: `backend` (This is very important!)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Click **Advanced** and add these Environment Variables:
   - `MONGO_URI`: (Your Atlas connection string)
   - `GOOGLE_CLIENT_ID`: (Your Google Client ID)
   - `JWT_SECRET`: (Your secret string, e.g., `my_super_secret`)
   *(Render will assign a PORT automatically)*
5. Click **Create Web Service**. Wait for it to finish deploying and copy the deployed backend URL (e.g., `https://petpooja-api.onrender.com`).

### Step 5.3: Deploy Frontend on Vercel

1. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Import your `petpooja` GitHub repository.
3. Configure the project:
   - **Root Directory**: Click "Edit" and change it to `frontend`.
   - The Framework Preset should automatically be recognized as Next.js.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: (Your Google Client ID)
   - `NEXT_PUBLIC_API_URL`: (The URL of your deployed Render backend from Step 5.2, e.g., `https://petpooja-api.onrender.com`)
5. Click **Deploy**.
6. **Important Final Step**: Once Vercel generates your production domain (e.g., `https://petpooja-frontend.vercel.app`), go back to your Google Cloud Console and add this exact URL to the **Authorized JavaScript origins** section. Without this, Google Login will fail on the live site!
