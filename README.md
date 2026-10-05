# Kindling — Vercel + Supabase

Kindling is an editorial publication platform powered by a static frontend, Vercel Serverless Functions, and Supabase Postgres.

- **Frontend**: Static `index.html` (Fraunces & Space Grotesk typography)
- **API**: Vercel Functions under `api/`
- **Persistence**: Supabase Postgres (`kindling_articles` table)
- **Public reading**: No login required
- **Contributing**: Login required (contributor or admin)
- **Admin deletion**: Admin accounts only

---

## 1. Quick Start Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Verify / Run Database Migration:**
   ```bash
   npm run migrate
   ```
   *(Uses `DATABASE_URL` from `.env` to create tables and indexes in Postgres and seed initial data).*

3. **Start the local production server:**
   ```bash
   npm start
   ```
   Open `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).

---

## 2. Environment Variables for Vercel

When deploying to Vercel (Project Settings → Environment Variables), add:

| Variable | Description | Example / Required Value |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Supabase Project URL | `https://hyqnynjyrrumtafjfxqq.supabase.co` |
| `SUPABASE_SECRET_KEY` | Supabase Service Role Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Optional alias)* Service Role Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `DATABASE_URL` | *(Optional for migration)* Postgres Connection | `postgresql://postgres...` |

> [!WARNING]
> Keep `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-side only. Never expose them to client-side bundles or `NEXT_PUBLIC_*` variables.

---

## 3. Deploying to Vercel

### Option A: Via GitHub (Recommended)
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), click **Add New...** → **Project** and import the repository.
3. Keep the default settings (Framework Preset: **Other**, Build Command: empty, Output Directory: empty).
4. Add the environment variables from Section 2.
5. Click **Deploy**.

### Option B: Via Vercel CLI
```bash
npx vercel
# Follow the prompts, then link project environment variables:
npx vercel env add SUPABASE_URL production
npx vercel env add SUPABASE_SECRET_KEY production
# Deploy to production:
npx vercel --prod
```

---

## 4. Accounts & Roles

| Username | Password | Role | Capabilities |
| :--- | :--- | :--- | :--- |
| `alvin` | `Alvin123` | Admin | Read, Compose, Delete any article |
| `yasha` | `Yasha123` | Admin | Read, Compose, Delete any article |
| `brittney` | `Brittney123` | Contributor | Read, Compose |
| `marcus` | `Marcus123` | Contributor | Read, Compose |
| `priya` | `Priya123` | Contributor | Read, Compose |
