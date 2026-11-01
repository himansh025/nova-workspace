<p align="center">
  <img src="frontend/public/brand/logo-mark.png" alt="Nova Workspace" width="80" />
</p>

<h1 align="center">Nova Workspace</h1>

<p align="center">
  <strong>An open-source, multi-tenant software engineering workspace with AI-powered coding agents, GitHub integration, project management, and real-time collaboration.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Express-5-green?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## ✨ Features

### 🗂️ Project Management
- **Tasks & Kanban Boards** — Create, assign, and track tasks with statuses, priorities, labels, and due dates
- **Projects** — Organize work under projects with role-based access control
- **Sprints** — Plan and manage development sprints
- **Releases** — Track and manage software releases

### 🤖 AI Coding Agent
- **Autonomous Coding Agent** — AI agent that reads your codebase, plans changes, writes code, applies patches, runs tests, and self-corrects
- **Sandboxed Execution** — Code runs in an isolated sandbox with allowlisted commands
- **Git Workflow** — Agent creates branches, commits, and opens pull requests automatically
- **GitHub Publish** — Push agent-authored changes and open PRs directly on GitHub
- **Multi-Model Support** — Gemini 2.5 Pro, Gemini 2.5 Flash, and more
- **Secret Redaction** — Automatic detection and masking of API keys, tokens, and credentials in AI context
- **Token Budget Management** — Context optimization with token ledgers and intelligent model routing

### 🔗 GitHub Integration
- **GitHub App Architecture** — Secure RS256 JWT authentication with short-lived installation tokens
- **Repository Explorer** — Browse file trees, read source files, view commit history, and search code
- **Webhook Processing** — HMAC-SHA256 verified webhooks for push events, PR lifecycle, and auto-status transitions
- **Pull Request Management** — Create, review, merge, and track PRs with AI-powered code review scoring

### 👥 Team Collaboration
- **Multi-Tenant Organizations** — Complete tenant isolation with cryptographic session boundaries
- **Role-Based Access Control (RBAC)** — Owner, Admin, Member, and Viewer roles with granular permission overrides
- **Team Invites** — Email-based invitation system with token verification
- **Activity Feed** — Real-time activity tracking across the workspace

### 🛡️ Security
- **Argon2id Password Hashing** — Industry-leading password storage with server-side pepper
- **AES-256-GCM Encryption** — API keys and credentials encrypted at rest
- **Rate Limiting** — Configurable rate limits on auth and API endpoints
- **CSRF Protection** — State-based verification for OAuth flows
- **Path Traversal Prevention** — Multi-layer sanitization blocking `../`, encoded sequences, null bytes
- **Webhook Idempotency** — Duplicate delivery detection and safe replay

### 📊 Additional Features
- **AI Chat Assistant** — Conversational AI with multi-provider support (Gemini, OpenAI, Anthropic, Ollama)
- **Architecture Visualization** — Service mesh topology and distributed system monitoring
- **Specifications** — Technical spec documents with version tracking
- **Insights & Analytics** — Project velocity, burndown, and team performance metrics
- **Email Service** — SMTP integration for verification emails and password resets
- **Outgoing Webhooks** — Dispatch HMAC-signed payloads to external services

---

## 🏗️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (Turbopack), React 19, Tailwind CSS 4, Lucide Icons |
| **Backend** | Node.js, Express 5, TypeScript 5.9 |
| **Database** | MongoDB Atlas (Mongoose 9) |
| **Auth** | JWT Sessions, Argon2id, AES-256-GCM |
| **AI** | Google Gemini API, OpenAI, Anthropic, Ollama |
| **GitHub** | GitHub App (RS256 JWT), Webhooks (HMAC-SHA256) |
| **Email** | Nodemailer (SMTP) |

---

## 📁 Project Structure

```
nova-workspace/
├── frontend/                   # Next.js 16 + React 19 frontend
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── app/            # Authenticated workspace pages
│   │   │   │   ├── agent/      # AI Coding Agent dashboard
│   │   │   │   ├── ai/         # AI Chat assistant
│   │   │   │   ├── code/       # Repository explorer
│   │   │   │   ├── projects/   # Project management
│   │   │   │   ├── tasks/      # Task boards
│   │   │   │   ├── sprints/    # Sprint planning
│   │   │   │   ├── team/       # Team management
│   │   │   │   ├── settings/   # Workspace settings
│   │   │   │   └── ...
│   │   │   ├── login/          # Authentication
│   │   │   └── signup/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React context providers
│   │   ├── hooks/              # Custom React hooks
│   │   └── lib/                # Utility libraries
│   └── .env.example
│
├── backend/                    # Express 5 API server
│   ├── config/                 # Environment & database config
│   ├── controllers/            # Route handlers
│   ├── middlewares/             # Auth, rate limiting, error handling
│   ├── models/                 # Mongoose schemas (29 models)
│   ├── routes/                 # API route definitions
│   ├── services/               # Business logic
│   │   ├── ai/                 # AI providers, agents, tools
│   │   │   └── agent/          # Coding agent pipeline
│   │   ├── auth.ts             # Session management
│   │   ├── rbac.ts             # Role-based access control
│   │   ├── githubAppService.ts # GitHub App integration
│   │   └── ...
│   ├── tests/                  # 13 comprehensive test suites
│   └── .env.example
│
├── .gitignore
├── ARCHITECTURE.md             # Detailed architecture documentation
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **MongoDB** — Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **GitHub App** (optional) — For repository integration ([setup guide](#github-app-setup))

### 1. Clone the Repository

```bash
git clone https://github.com/himansh025/nova-workspace.git
cd nova-workspace
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your values:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/nova-workspace
SESSION_SECRET=<generate-a-strong-32-char-secret>
ARGON2_PEPPER=<generate-another-strong-secret>
CREDENTIAL_ENCRYPTION_KEY=<generate-another-strong-secret>

# Optional — GitHub App
GITHUB_APP_ID=<your-github-app-id>
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_URL=https://github.com/apps/<your-app-slug>
GITHUB_WEBHOOK_SECRET=<your-webhook-secret>
```

> **Tip:** Generate strong secrets with: `openssl rand -hex 32`

Start the backend:

```bash
npm run dev
```

The API server starts on **`http://localhost:5000`**.

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy and configure environment variables
cp .env.example .env
```

Edit `frontend/.env`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The app opens at **`http://localhost:3007`**.

### 4. Create Your Account

1. Navigate to `http://localhost:3007/signup`
2. Register with your name, email, and password
3. You'll be automatically signed in and an organization will be created for you

---

## <a id="github-app-setup"></a>🔗 GitHub App Setup (Optional)

To enable repository browsing, code exploration, webhook automation, and AI-powered PR workflows:

1. Go to [GitHub Developer Settings → GitHub Apps](https://github.com/settings/apps) and create a **New GitHub App**
2. Set the following:
   - **Homepage URL:** `http://localhost:3007`
   - **Callback URL:** `http://localhost:3007/app/settings`
   - **Setup URL:** `http://localhost:3007/app/settings` (check "Redirect on update")
   - **Webhook URL:** `https://<your-public-url>/api/webhooks/github` (or use a tunnel like ngrok for local dev)
3. **Permissions:**
   - Repository → Contents: **Read & write**
   - Repository → Metadata: **Read-only**
   - Repository → Pull requests: **Read & write**
   - Repository → Actions: **Read & write** (optional)
4. Generate a **Private Key** (`.pem` file) and note the **App ID**
5. Add these values to `backend/.env`
6. Install the app on your GitHub account from the app's public page
7. In Nova → Settings → Credentials, click **"Connect GitHub App"**

---

## 🧪 Running Tests

The backend includes 13 comprehensive test suites covering security, API endpoints, tenant isolation, GitHub workflows, and the AI agent pipeline:

```bash
cd backend
npm test
```

| Test Suite | Coverage |
| :--- | :--- |
| Repository Explorer Unit Tests | Path sanitization, binary detection, language detection |
| Repository Explorer Integration Tests | Auth enforcement, tenant isolation, path security |
| Express API Audit | All 18 API endpoint categories |
| User Model Tests | Registration, authentication, validation |
| Security & Isolation Tests | OWASP tenant isolation, brute-force mitigation |
| GitHub Workflow Tests | Webhooks, PR lifecycle, auto-transitions |
| GitHub Security Hardening | HMAC verification, idempotency, CSRF |
| Agent Foundation Tests | Path safety, tool registry, run isolation |
| Agent Workspace Tests | File operations, diffs, workspace isolation |
| Agent Sandbox Tests | Command allowlisting, output truncation, self-fix |
| Agent Git Workflow Tests | Branch creation, commits, verification gates |
| Agent GitHub Publish Tests | Push, PR creation, idempotency, authorization |
| Context Optimization Tests | Caching, token budgets, model routing |

---

## 🔒 Security Considerations

- **No secrets are committed** — All sensitive values are loaded from environment variables
- **`.gitignore`** blocks `.env`, `.env.*`, `*.pem`, `*.key`, and other sensitive file types
- **`.env.example`** files contain only safe placeholder values
- **Passwords** are hashed with Argon2id (memory-hard, timing-safe)
- **API keys** stored in the database are encrypted with AES-256-GCM
- **GitHub webhooks** are verified with HMAC-SHA256 raw-body signatures
- **Sessions** use cryptographically signed JWTs with configurable expiry
- **Rate limiting** protects auth endpoints from brute-force attacks
- **Tenant isolation** is enforced at every API layer — cross-organization data access is impossible

---

## 📄 API Overview

All API endpoints are prefixed with `/api` and require JWT authentication (except auth routes):

| Category | Endpoints | Description |
| :--- | :--- | :--- |
| **Auth** | `/api/auth/*` | Register, login, logout, password reset, email verification |
| **Tasks** | `/api/tasks/*` | CRUD, status transitions, assignments, labels |
| **Projects** | `/api/projects/*` | Create, manage, access control |
| **Sprints** | `/api/sprints/*` | Sprint planning and tracking |
| **Team** | `/api/team/*` | Members, invitations, roles |
| **Organization** | `/api/org/*` | Org settings, RBAC, member management |
| **GitHub** | `/api/integrations/github/*` | App status, repositories, branches, file explorer |
| **Pull Requests** | `/api/pull-requests/*` | PR management, AI review, merge |
| **AI Chat** | `/api/ai/*` | Chat conversations, model settings |
| **Agent** | `/api/agent/*` | Coding agent runs, status, proposals |
| **Webhooks** | `/api/webhooks/github` | Inbound GitHub webhook processing |
| **Health** | `/health` | Server health check |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) — React framework
- [Express.js](https://expressjs.com/) — Backend framework
- [MongoDB](https://www.mongodb.com/) — Database
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Lucide](https://lucide.dev/) — Icons
- [Google Gemini](https://ai.google.dev/) — AI models

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/himansh025">Himanshu Singh</a>
</p>
