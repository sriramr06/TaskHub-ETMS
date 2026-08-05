# Deploying TaskHub

TaskHub is two separate apps in one repo — `server/` (Express API) and `client/` (React SPA) — plus MongoDB and Cloudinary as external services. The usual free-tier split is:

- **MongoDB Atlas** — database
- **Render** — `server/` as a Node web service
- **Vercel** — `client/` as a static site
- **Cloudinary** — already used for file uploads, no change needed

Deploy the server first — the client needs its URL, and the server needs the client's URL back for CORS, so there's one round trip.

## 1. MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Database Access → add a user with a strong password.
3. Network Access → add `0.0.0.0/0` (Render's outbound IPs aren't static on the free tier, so this is the practical option — Atlas still requires the correct username/password on top of it).
4. Get the connection string (Connect → Drivers) — it looks like `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/taskHub`. Keep the database name (`taskHub` or whatever you pick) in the URI.

## 2. Server → Render

Create a **Web Service** pointed at this repo with:

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Environment variables (Render dashboard → Environment):

```
NODE_ENV=production
PORT=10000                # Render sets its own PORT and injects it — safe to omit; if you set one Render still overrides it via its own PORT env var
CLIENT_URL=https://<your-vercel-app>.vercel.app   # set after step 3, see note below
MONGO_URI=<your Atlas connection string>
JWT_SECRET=<generate a long random value — do NOT reuse the local dev one>
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=14d
COOKIE_NAME=tms_token
CLOUDINARY_CLOUD_NAME=<from your Cloudinary dashboard>
CLOUDINARY_API_KEY=<from your Cloudinary dashboard>
CLOUDINARY_API_SECRET=<from your Cloudinary dashboard>
```

Generate `JWT_SECRET` with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` — don't hand-type one.

You won't have the real `CLIENT_URL` yet on the first deploy — put in a placeholder (e.g. `https://placeholder.vercel.app`), deploy, then come back and update it once Vercel gives you the real URL (step 4).

Once it's live, `https://<your-render-app>.onrender.com/api/health` should return `{"success":true,"message":"ok"}`.

## 3. Client → Vercel

Import the repo as a new Vercel project with:

| Setting | Value |
|---|---|
| Root Directory | `client` |
| Framework Preset | Vite |
| Build Command | `npm run build` (default) |
| Output Directory | `dist` (default) |

Environment variable:

```
VITE_API_URL=https://<your-render-app>.onrender.com/api
```

`vercel.json` in `client/` already handles the SPA rewrite so client-side routes (e.g. `/tasks/abc123`) don't 404 on refresh — no extra config needed there.

## 4. Close the loop

Once Vercel gives you the real `https://<your-vercel-app>.vercel.app` URL, go back to Render and update `CLIENT_URL` to that value, then redeploy (or let Render's auto-redeploy-on-env-change kick in). This matters more than it looks: cookies are set with `SameSite=None; Secure` in production for the cross-origin login flow to work at all, and CORS only allows the exact origin in `CLIENT_URL` — a mismatch here is the most common "login works locally but not in prod" bug.

## 5. Seed some data (optional but recommended for a demo link)

From your machine, point the seed script at the Atlas database instead of local Mongo:

```bash
cd server
MONGO_URI="<your Atlas connection string>" npm run seed
```

This creates the showcase users/teams/projects/tasks described in the seed script (all with password `TaskHub@123`) so the deployed app isn't an empty shell the first time someone opens it.

## Notes

- **Render free tier spins down after inactivity** — the first request after idle can take 30-60s to respond while it cold-starts. If you're sending this link to a recruiter, open it yourself a minute before to warm it up, or upgrade off the free tier.
- **Logs**: in production the app logs to stdout only (visible in Render's Logs tab) — it no longer writes local log files, since those aren't accessible on Render anyway.
- **Rate limiting**: login is capped at 10 attempts / 15 min per IP (`server/src/middlewares/rateLimiter.ts`). If you're demoing live and hit it while testing, wait out the window or redeploy to reset the in-memory counter.
- The client bundle is ~530KB minified (~153KB gzipped) — Vite flags this as large. It builds and runs fine as-is; splitting it further (route-based lazy loading) is a legitimate follow-up but not required to ship.
