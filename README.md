# TeamFlow — Project & Task Management System

## Assignment Submission

**Project Title:** TeamFlow — Full-Stack Project & Task Management Application
**Technology Stack:** React, Node.js, Express, Prisma ORM, PostgreSQL
**Deployment Platform:** Railway (Frontend & Backend), Neon (Database)

---

## 📌 Live Application URLs

| Service | URL |
|---------|-----|
| Frontend (React App) | https://brave-amazement-production.up.railway.app |
| Backend (REST API) | https://teamflow-production-805f.up.railway.app |
| API Health Check | https://teamflow-production-805f.up.railway.app/health |

---

## 🔑 Demo Login Credentials

The following accounts are pre-seeded in the database for evaluation purposes:

| Name | Email | Password | Role |
|------|-------|----------|------|
| Sarah Chen | admin@teamflow.dev | Admin123 | Admin |
| Arjun Mehta | dev@teamflow.dev | Member123 | Member |
| Priya Nair | design@teamflow.dev | Member123 | Member |

> **Note:** Admin accounts can create and manage projects. Member accounts can view projects they are assigned to and manage their tasks.

---

## 📂 GitHub Repository

**Repository URL:** https://github.com/sahithirao23/teamflow

---

## 📋 Project Overview

TeamFlow is a full-stack web application designed to help teams manage projects and tasks efficiently. It provides role-based access control, real-time task tracking, and a clean, modern user interface.

### Key Features

- **User Authentication** — Secure login and signup using JWT tokens stored in httpOnly cookies
- **Role-Based Access Control** — Admin and Member roles with different permissions
- **Project Management** — Create, view, and manage projects (Admin only)
- **Task Management** — Create, assign, update, and track tasks within projects
- **Activity Feed** — Track all recent activity across projects
- **Demo Accounts** — Pre-seeded accounts for quick evaluation
- **Responsive UI** — Clean dark-themed interface that works across devices

---

## 🛠 Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| React Router v6 | Client-side routing |
| Axios | HTTP client for API calls |
| Context API | Global state management (Auth) |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | JavaScript runtime |
| Express.js | Web framework |
| Prisma ORM | Database access and migrations |
| JSON Web Tokens (JWT) | Authentication |
| bcryptjs | Password hashing |
| cookie-parser | httpOnly cookie handling |
| cors | Cross-origin resource sharing |
| helmet | Security headers |
| express-validator | Input validation |

### Database
| Technology | Purpose |
|-----------|---------|
| PostgreSQL | Relational database |
| Neon | Managed cloud PostgreSQL hosting |

### Deployment
| Service | Platform |
|---------|---------|
| Frontend | Railway |
| Backend | Railway |
| Database | Neon PostgreSQL |

---

## 📁 Project Structure

```
teamflow/
│
├── frontend/                        # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication state management
│   │   ├── lib/
│   │   │   └── api.js               # Axios instance with interceptors
│   │   ├── pages/
│   │   │   └── AuthPage.jsx         # Login and Signup page
│   │   └── main.jsx                 # App entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── railway.toml                 # Railway deployment config
│
├── backend/                         # Express.js Backend API
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   └── migrations/              # Database migrations
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.js            # Prisma client instance
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication middleware
│   │   │   ├── errorHandler.js      # Global error handler
│   │   │   └── validate.js          # Input validation middleware
│   │   ├── routes/
│   │   │   ├── auth.js              # Authentication routes
│   │   │   ├── projects.js          # Project routes
│   │   │   ├── tasks.js             # Task routes
│   │   │   ├── users.js             # User routes
│   │   │   └── activity.js          # Activity routes
│   │   └── index.js                 # Express app entry point
│   ├── package.json
│   └── railway.toml                 # Railway deployment config
│
└── README.md
```

---

## 🗄 Database Schema

The application uses 6 database tables:

| Table | Description |
|-------|-------------|
| User | Stores user accounts with hashed passwords and roles |
| Project | Stores project details created by Admin users |
| ProjectMember | Junction table linking users to projects |
| Task | Stores tasks with status, priority, assignee, and due date |
| Activity | Logs all actions taken within the application |
| _prisma_migrations | Tracks applied database migrations |

---

## 🔐 Authentication Flow

1. User submits login credentials (email + password)
2. Backend validates credentials and compares hashed password using bcryptjs
3. On success, a signed JWT token is generated and stored in an httpOnly cookie
4. All subsequent API requests include the cookie automatically
5. The token is also stored in localStorage as a fallback Bearer token
6. On logout, the cookie is cleared and localStorage is cleaned up

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register a new user |
| POST | /api/auth/login | Login with email and password |
| POST | /api/auth/logout | Logout and clear cookie |
| GET | /api/auth/me | Get current authenticated user |
| PATCH | /api/auth/me | Update profile or password |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | Get all projects |
| POST | /api/projects | Create a new project (Admin only) |
| GET | /api/projects/:id | Get project details |
| PATCH | /api/projects/:id | Update a project |
| DELETE | /api/projects/:id | Delete a project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | Get all tasks |
| POST | /api/tasks | Create a new task |
| PATCH | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | Get all users |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/activity | Get recent activity feed |

---

## ⚙️ Environment Variables

### Backend (.env)
```
DATABASE_URL=<neon-postgresql-connection-url>
JWT_SECRET=<your-secure-random-secret>
JWT_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://brave-amazement-production.up.railway.app
PORT=5000
```

### Frontend (.env)
```
VITE_API_URL=https://teamflow-production-805f.up.railway.app/api
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js v18 or higher
- npm v9 or higher
- PostgreSQL database (or Neon account)

### Step 1 — Clone the Repository
```bash
git clone https://github.com/sahithirao23/teamflow.git
cd teamflow
```

### Step 2 — Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:
```
DATABASE_URL=<your-postgresql-url>
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Run database migrations:
```bash
npx prisma migrate dev
```

Start the backend server:
```bash
npm run dev
```

Backend runs on: http://localhost:5000

### Step 3 — Setup Frontend
```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend folder:
```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

Frontend runs on: http://localhost:5173

---

## 📦 Deployment

The application is deployed on **Railway** with automatic deployments triggered on every push to the `main` branch on GitHub.

### Deployment Configuration
- Backend uses `railway.toml` to define the build and start commands
- Frontend uses `railway.toml` with Vite build output
- Environment variables are configured directly in Railway's dashboard

---

## 🔒 Security Measures

- Passwords are hashed using **bcryptjs** with salt rounds of 12
- JWT tokens are stored in **httpOnly cookies** to prevent XSS attacks
- **Helmet.js** adds secure HTTP headers
- **CORS** is configured to only allow requests from the frontend domain
- Input validation is performed on all API endpoints using **express-validator**
- SQL injection is prevented by **Prisma ORM** parameterized queries

---

## 👤 Author

**Sahithi Rao**
GitHub: https://github.com/sahithirao23
