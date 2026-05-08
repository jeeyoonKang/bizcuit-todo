# Bizcuit Todo Challenge

Full-stack todo application for the Bizcuit code challenge.

Stack:
- Frontend: React + Vite + TypeScript
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Auth: JWT + bcrypt

## Approach

I approached the challenge by building the backend first around the core business rules:

- users can register and log in
- authenticated users can manage only their own tasks
- tasks support CRUD, completion state, and optional deadlines

The goal was to keep the implementation small, explicit, and easy to review within the challenge time limit. I prioritized:

- clear module boundaries
- database-backed ownership checks
- DTO validation at the API boundary
- test coverage for the most important backend flows

## Design Choices

### Why NestJS

NestJS provides a clean module structure for auth, tasks, and infrastructure concerns. For a challenge project, it makes the code easier to navigate and keeps controllers, services, DTOs, and guards separated by responsibility.

### Why PostgreSQL + Prisma

The challenge explicitly asks for Node.js, TypeScript, and an SQL database. PostgreSQL is a strong default for relational data, and Prisma keeps the schema, migrations, and typed database access straightforward.

### Why JWT Authentication

The challenge allows HTTP Basic Auth at minimum, but JWT is a better fit for a modern frontend + backend setup:

- stateless authentication
- easy frontend integration using bearer tokens
- simple route protection with Nest guards and Passport

Passwords are hashed with `bcrypt` before storage.

### Why A Minimal React Frontend

The challenge is primarily backend-focused, so I kept the frontend intentionally small. Its purpose is to demonstrate the main user flows against the real API:

- register and log in
- persist the JWT on the client
- create, list, update, and delete tasks
- mark tasks done or undone
- apply basic task filtering and sorting

For simplicity, the frontend stores the JWT in `localStorage`. In a production setup, I would evaluate `httpOnly` cookies depending on the deployment model and security constraints.

## Backend Overview

### Modules

- `AuthModule`: registration, login, JWT issuance, JWT validation
- `TasksModule`: protected task CRUD and task state management
- `PrismaModule`: shared Prisma client lifecycle

### Data Model

#### User

- `id`
- `email` unique
- `passwordHash`
- timestamps

#### Task

- `id`
- `title`
- `description` nullable
- `deadline` nullable
- `done`
- `userId` foreign key to `User`
- timestamps

Each task belongs to exactly one user. Task access is restricted by `userId` in service-layer queries.

### Validation and Authorization

- DTO validation is handled with Nest `ValidationPipe`
- only authenticated users can access `/tasks`
- users can only read, update, and delete their own tasks
- passwords are hashed with `bcrypt`

### Filtering and Sorting

`GET /tasks` supports:

- `status=all|active|done|overdue`
- `sort=newest|deadlineAsc`

## Frontend Overview

The frontend is a small React + Vite application built as a reviewer-facing MVP rather than a full product UI.

It includes:

- login and registration in a single screen
- local token persistence
- authenticated task list retrieval
- create and edit task form
- done/undone toggles
- delete action
- filter and sort controls

I kept the frontend state management in plain React state to avoid adding unnecessary complexity for a time-boxed challenge.

## Security Considerations

- Passwords are hashed with `bcrypt` before storage.
- Task endpoints are protected with JWT authentication.
- Task access is scoped by the authenticated `userId`, so users can only access their own tasks.
- Request payloads are validated with DTOs and Nest's `ValidationPipe`.
- Secrets and database configuration are provided through environment variables.

## Performance Considerations

The backend keeps task queries simple and scoped by `userId`, which matches the main access pattern of a personal todo application.

`GET /tasks` supports basic filtering and sorting. With more time, I would add pagination to avoid returning too many tasks at once as the dataset grows.

## API Summary

### Auth

- `POST /auth/register`
  - body: `{ "email": "user@example.com", "password": "password123" }`
  - returns: `{ accessToken, user }`

- `POST /auth/login`
  - body: `{ "email": "user@example.com", "password": "password123" }`
  - returns: `{ accessToken, user }`

### Tasks

All task endpoints require:

```http
Authorization: Bearer <jwt>
```

* `POST /tasks`

  * create a task

* `GET /tasks`

  * list current user's tasks
  * optional query params: `status`, `sort`

* `GET /tasks/:id`

  * get one owned task

* `PATCH /tasks/:id`

  * update owned task fields

* `PATCH /tasks/:id/done`

  * mark task done

* `PATCH /tasks/:id/undone`

  * mark task undone

* `DELETE /tasks/:id`

  * delete owned task

The dedicated `/done` and `/undone` endpoints are convenience endpoints for common task state transitions.

## Running the Project

### Prerequisites

* Node.js
* npm
* Docker

### Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bizcuit_todo?schema=public"
JWT_SECRET="super-secret-change-me"
JWT_EXPIRES_IN="1h"
```

Copy `frontend/.env.example` to `frontend/.env` if you want to override the default API URL:

```env
VITE_API_BASE_URL="http://localhost:3000"
```

### Start PostgreSQL

From the repo root:

```bash
docker compose up -d
```

### Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Run Prisma Migrations

```bash
cd backend
npx prisma migrate deploy
```

For local development, `npx prisma migrate dev` is also fine.

### Start Backend

```bash
cd backend
npm run start:dev
```

Backend runs on `http://localhost:3000`.

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Testing

### Backend Unit Tests

```bash
cd backend
npm test
```

### Backend E2E Tests

```bash
cd backend
npm run test:e2e
```

Current backend tests cover:

* auth service
* auth controller
* JWT strategy
* task service
* task controller
* auth/task e2e flows, including authorization boundaries between users

## What I Would Improve Next

Given more time, I would add:

* pagination for `GET /tasks`
* Swagger or OpenAPI documentation
* refresh token or token rotation strategy
* database-backed e2e tests using a dedicated test PostgreSQL instance
* centralized exception/response formatting
* CI to run lint, unit tests, and e2e tests automatically

## Time-Limited Tradeoffs

Because this was a time-boxed challenge, I intentionally kept some parts minimal:

* pagination is not implemented yet
* API documentation is written in the README instead of generated through Swagger
* e2e tests currently focus on request/response flows and authorization boundaries with mocked persistence
* advanced features such as task groups, offline support, and PWA caching were left as future improvements
* README is focused on reviewer usability rather than exhaustive system documentation
