# ⬡ TeamFlow — Team Task Manager

A full-stack project and task management web app with role-based access control, built with **React + Express + Prisma + PostgreSQL**.

---

## 🚀 Live Demo

> **URL:** `https://your-app.up.railway.app`
> 
> **Demo Accounts:**
> | Name | Email | Password | Role |
> |------|-------|----------|------|
> | Sarah Chen | admin@teamflow.dev | Admin123 | Admin |
> | Arjun Mehta | dev@teamflow.dev | Member123 | Member |
> | Priya Nair | design@teamflow.dev | Member123 | Member |

---

## 📸 Features

| Feature | Details |
|---------|---------|
| 🔐 **Authentication** | JWT-based signup/login with httpOnly cookies |
| 🏗 **Projects** | Create, view, and manage projects with color coding |
| ✅ **Tasks** | Full CRUD with status, priority, due date, assignee |
| 📋 **Kanban Board** | Per-project kanban: To Do → In Progress → Review → Done |
| 👥 **Team Management** | Admin can add/remove members and change roles |
| 📊 **Reports** | Workload per member, project progress, overdue tracking |
| 🛡 **Role-Based Access** | Admins manage everything; Members see their own tasks |
| 🔍 **Filters** | Filter tasks by status, priority, assignee |
| ⚡ **Activity Feed** | Real-time log of all project activity |

---

## 🗂 Project Structure

```
teamflow/
├── backend/                  # Express REST API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (User, Project, Task, Activity)
│   │   └── seed.js           # Demo data seeder
│   ├── src/
│   │   ├── index.js          # Express server entry
│   │   ├── lib/prisma.js     # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT verify, requireAdmin, requireProjectMember
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js   # express-validator helper
│   │   └── routes/
│   │       ├── auth.js       # POST /signup /login /logout GET /me PATCH /me
│   │       ├── projects.js   # Full CRUD + member management
│   │       ├── tasks.js      # Full CRUD + filters + stats
│   │       ├── users.js      # Admin user management
│   │       └── activity.js   # Activity feed
│   └── railway.toml
│
└── frontend/                 # React + Vite SPA
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx   # Global auth state
    │   ├── hooks/
    │   │   └── useFetch.js       # Data fetching hooks
    │   ├── lib/
    │   │   └── api.js            # Axios instance with interceptors
    │   ├── components/
    │   │   └── Layout.jsx        # Sidebar + topbar shell
    │   └── pages/
    │       ├── AuthPage.jsx      # Login / Signup
    │       ├── DashboardPage.jsx # Stats, charts, overdue tasks
    │       ├── ProjectsPage.jsx  # Project grid + create modal
    │       ├── ProjectDetailPage.jsx # Kanban board
    │       ├── TasksPage.jsx     # Task table with filters
    │       ├── TeamPage.jsx      # Member management (Admin)
    │       └── ReportsPage.jsx   # Analytics (Admin)
    └── railway.toml
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (local or [Neon](https://neon.tech) free tier)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/teamflow.git
cd teamflow

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/teamflow"
JWT_SECRET="change-this-to-a-long-random-string"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=5000
FRONTEND_URL="http://localhost:5173"
```

### 3. Set Up Database

```bash
cd backend

# Create tables
npx prisma migrate dev --name init

# Seed demo data
npm run db:seed
```

### 4. Configure Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api  (default, no change needed for local)
```

### 5. Run Both Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5173**

---

## 🌐 Deploy to Railway

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/teamflow.git
git push -u origin main
```

### Step 2 — Create Railway Project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo**

### Step 3 — Add PostgreSQL

In your Railway project → **+ New** → **Database** → **PostgreSQL**

Railway auto-sets `DATABASE_URL` as a shared variable.

### Step 4 — Backend Service

1. **+ New** → **GitHub Repo** → select your repo
2. Set **Root Directory** to `backend`
3. Add environment variables:
   ```
   JWT_SECRET=your-super-secret-64-char-random-string
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend.up.railway.app
   ```
4. Railway uses `backend/railway.toml` automatically — it runs migrations + seed on first deploy.

### Step 5 — Frontend Service

1. **+ New** → **GitHub Repo** → same repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```
4. Railway uses `frontend/railway.toml` automatically.

### Step 6 — Link Domains

- Copy your **backend** Railway URL → paste into `FRONTEND_URL` on the backend service
- Copy your **frontend** Railway URL → done!

---

## 📡 REST API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | — | Create account |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | — | Logout |
| GET | `/api/auth/me` | ✓ | Get current user |
| PATCH | `/api/auth/me` | ✓ | Update name / password |

### Projects
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | ✓ | List accessible projects |
| GET | `/api/projects/:id` | ✓ | Project detail + tasks |
| POST | `/api/projects` | Admin | Create project |
| PATCH | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tasks` | ✓ | List tasks (filterable) |
| GET | `/api/tasks/:id` | ✓ | Task detail |
| POST | `/api/tasks` | ✓ | Create task |
| PATCH | `/api/tasks/:id` | ✓ | Update task |
| DELETE | `/api/tasks/:id` | ✓ | Delete task |
| GET | `/api/tasks/stats/overview` | ✓ | Aggregated stats |

**Query params for GET /api/tasks:**
- `myTasks=true` — only my assigned tasks
- `projectId=<id>` — filter by project
- `status=TODO|IN_PROGRESS|REVIEW|DONE`
- `priority=LOW|MEDIUM|HIGH`
- `overdue=true` — past due date, not done

### Users (Admin only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | ✓ | List all users |
| POST | `/api/users` | Admin | Create user |
| PATCH | `/api/users/:id` | Admin | Change role |
| DELETE | `/api/users/:id` | Admin | Delete user |

---

## 🛡 Security

- Passwords hashed with **bcrypt** (12 rounds)
- JWT stored in **httpOnly cookie** + Authorization header fallback
- Rate limiting: 20 req/15min on auth, 300 req/15min on API
- Input validation via **express-validator** on every route
- Helmet.js security headers
- Role-based access: Members cannot access admin routes
- Project membership enforced on all task operations

---

## 🧱 Tech Stack

**Backend:** Node.js · Express · Prisma ORM · PostgreSQL · JWT · bcrypt · Helmet · express-validator

**Frontend:** React 18 · React Router v6 · Vite · Axios · date-fns

**Deployment:** Railway (Backend + Frontend + PostgreSQL)

---

## 📄 License

MIT — free to use for personal and commercial projects.
