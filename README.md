# InboxIQ AI - Phase 1 Email Intelligence Foundation

InboxIQ AI is a production-grade, enterprise SaaS platform designed to synchronize, index, and analyze user email accounts securely. Phase 1 provides the core foundation: Next.js App Router frontend, NestJS backend, stateless token authentication, BullMQ queue synchronizers, AES-256-GCM credentials encryption, and audit trailing.

---

## 🏗️ System Architecture & Separation of Scopes

InboxIQ AI separates application access from email ingestion to implement the **principle of least privilege**:

1. **Step 1: Application Authentication (Auth.js / NextAuth v5)**
   * Users sign in to the Next.js client via Google OAuth requesting only default profile and email scopes (`openid email profile`). Next.js sets an HttpOnly cookie session.
2. **Step 2: Gmail Ingestion Connection (NestJS OAuth)**
   * To connect their email, users initiate a separate flow requesting `gmail.readonly`. NestJS handles the OAuth callback, encrypts the credentials, and associates them with the user.
3. **Step 3: Stateless Backend Communication (JWT)**
   * Next.js acts as an API gateway. For frontend client requests, the Next.js server signs a short-lived backend JWT (`SHARED_JWT_SECRET`) containing the logged-in user profile and forwards it as a `Bearer` authorization token to NestJS.

```
Next.js Client ---[NextAuth Login]---> Google SSO (Scope: profile, email)
Next.js Client ---[API Requests]------> Next.js Server (Signs JWT) --[Bearer JWT]--> NestJS Backend
Next.js Client ---[Link Inbox]---------> NestJS Redirect ---> Google OAuth (Scope: gmail.readonly) ---> callback -> NestJS (AES Encryption)
```

---

## 🛠️ Technology Stack

* **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, TanStack Query.
* **Backend:** NestJS 10, TypeScript, Prisma ORM, NestJS EventEmitter2.
* **Queuing & Cache:** Redis, BullMQ (background synchronization queues).
* **Database:** PostgreSQL (relational core), Qdrant (future semantic vector search).
* **Authentication:** Auth.js (NextAuth v5), stateless custom JWT.

---

## 📂 Project Structure

```
├── backend/                  # NestJS backend application
│   ├── prisma/               # Prisma Database Schemas & Migrations
│   └── src/
│       ├── common/           # Custom Guards, Filters, Interceptors, and Services (Encryption, AuditLog)
│       ├── config/           # Zod Configuration & Environment Validators
│       ├── database/         # Prisma Client Connection Service
│       ├── infrastructure/   # Gmail API client wrapper
│       ├── interfaces/       # DTO Validations & Controllers (Auth, Gmail, Emails, Health)
│       └── modules/          # Business logic, repositories, and queue processors (Sync Workers)
│
├── frontend/                 # Next.js App Router client
│   └── src/
│       ├── app/              # Router, layouts, and page views (dashboard, inbox, settings)
│       ├── components/       # Layout structures & UI primitives
│       ├── services/         # Axios API client pointing to proxy route
│       ├── store/            # Zustand global UI controls
│       └── lib/              # Utility helpers (cn)
│
├── docker-compose.yml        # PostgreSQL, Redis, and Qdrant containers
├── package.json              # Workspace-level package script runner
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
Ensure you have the following installed on your system:
* **Node.js** (v18.x or v20.x recommended)
* **npm** (v9.x or v10.x)
* **Docker & Docker Compose** (for PostgreSQL, Redis, Qdrant)

---

### 2. Configure Environment Variables

Create local `.env` files in both directories from their templates:

#### Backend (`backend/.env`)
```ini
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/inboxiq_dev?schema=public
REDIS_URL=redis://localhost:6379
ENCRYPTION_KEY=your_aes_encryption_key_minimum_32_chars
SHARED_JWT_SECRET=your_shared_jwt_secret_shared_with_frontend

# Google Developer Console Credentials
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GMAIL_REDIRECT_URI=http://localhost:3001/api/gmail/connect/callback
```

#### Frontend (`frontend/.env`)
```ini
AUTH_SECRET=your_nextauth_auth_secret_minimum_32_chars
NEXTAUTH_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
SHARED_JWT_SECRET=your_shared_jwt_secret_shared_with_backend

# Google Developer Console Credentials
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

---

### 3. Spin Up Infrastructure Containers
Start PostgreSQL, Redis, and Qdrant:
```bash
docker compose up -d
```

---

### 4. Install Dependencies & Generate Prisma Clients
From the root workspace directory, install all packages and generate the Prisma database typings:
```bash
# 1. Install all dependencies
npm run install:all

# 2. Generate Prisma Client typings in backend
npm run db:generate --prefix backend
```

---

### 5. Execute Database Migrations
Create your database schema tables in PostgreSQL:
```bash
npm run db:migrate
```

---

### 6. Start the Local Development Servers
Run frontend and backend dev systems concurrently:
```bash
npm run dev
```
* **Frontend UI:** `http://localhost:3000`
* **Backend API Gateway:** `http://localhost:3001/api`
* **Swagger OpenAPI Docs:** `http://localhost:3001/docs`

---

## 🔒 Security Architecture Details

1. **AES-256-GCM Encrypted Credentials:** Google access and refresh tokens are encrypted using authenticated GCM payloads. The encryption tag prevents tamper modifications.
2. **Stateless API Guarding:** NestJS verifies incoming requests using the shared HMAC-SHA256 signature key. No session states are stored in the memory pool.
3. **Audit Trails:** Significant operations (e.g. connections, disconnects, sync triggers) log details, browser user agents, and IP addresses to the `AuditLog` table.
4. **Rate Limiting:** Protects routing gates, restricting endpoints to a maximum of 100 requests per minute per IP.

---

## 🔮 Future Evolution Roadmap

* **Phase 2: AI Email Analysis** — Triggers summaries and classifications via `EmailSyncedEvent` and saves embeddings to Qdrant.
* **Phase 3: Task Extraction Engine** — Triggers check-list extractions from `EmailAnalyzedEvent`.
* **Phase 4: Fraud Detection Engine** — Scans message spam indices, sending web-push alarms on threats.
* **Phase 5: Productivity Analytics** — Aggregates email counts and response logs into user dashboard charts.
* **Phase 6: AI Copilot** — Leverages RAG on Qdrant vectors to query inboxes in chat.
