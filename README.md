# TaskHub

A full-stack task and team management app — projects, Kanban boards, and role-based access control, built with React, TypeScript, Express, and MongoDB.

**Live demo:** [taskhub-ten-psi.vercel.app](https://taskhub-ten-psi.vercel.app)
*(hosted on Render's free tier — the API cold-starts after inactivity, so the first request can take 30-60s)*

## Try it

Log in with any of the seeded demo accounts (password `TaskHub@123`) to see how the UI and permissions change per role:

| Role | Email |
|---|---|
| Admin | `ava.whitfield@taskhub.dev` |
| Manager | `marcus.chen@taskhub.dev` |
| Team Lead | `sofia.novak@taskhub.dev` |
| Member | `liam.brooks@taskhub.dev` |
| Guest | `owen.baxter@taskhub.dev` |

## Features

- **Projects & tasks** — CRUD for projects, tasks, checklist items, comments, and file attachments (via Cloudinary)
- **Kanban board** — drag-and-drop task management per project
- **Role-based access control** — five roles (Admin, Manager, Team Lead, Member, Guest) with permission-gated actions and ownership scoping, enforced on both client and server
- **Teams & people** — team membership, employment records, and a people directory
- **Dashboard** — role-adaptive stat cards
- **Auth** — JWT access/refresh tokens in httpOnly cookies

## Tech stack

**Client** — React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, React Hook Form + Zod

**Server** — Express, TypeScript, MongoDB/Mongoose, JWT auth, Zod validation, Cloudinary for uploads

## Running locally

Requires Node 18.18+ and a MongoDB instance (local or Atlas).

```bash
# Server
cd server
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, Cloudinary keys
npm install
npm run seed            # optional: populate demo data
npm run dev              # http://localhost:5000

# Client (in a second terminal)
cd client
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

## Deploying

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full Render + Vercel + MongoDB Atlas setup.
