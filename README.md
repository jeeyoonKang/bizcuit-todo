# Bizcuit Todo Challenge

A small full-stack todo application built for the Bizcuit code challenge.

The project includes a NestJS backend, PostgreSQL database, Prisma ORM, JWT authentication, and a lightweight React frontend to exercise the main user flows.

## Stack

- Frontend: React, Vite, TypeScript
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT, bcrypt
- Testing: Jest, Supertest

## What Is Included

This submission covers:

- user registration and login
- password hashing with bcrypt
- JWT-based authentication
- user-scoped task CRUD
- optional task deadlines
- task completion state
- basic filtering and sorting
- backend unit tests
- backend request-level e2e tests
- a simple React frontend for manual review

## Approach

I started with the backend because the core of the challenge is around authentication, task ownership, and API correctness.

The main business rules are:

- users can register and log in
- authenticated users can manage their own tasks
- users cannot access tasks owned by another user
- tasks can be created, listed, updated, completed, and deleted
- tasks can optionally have a deadline

Within the time limit, I focused on making the main path complete and easy to review rather than adding a large feature set. The backend has clear module boundaries, DTO validation at the API boundary, database-backed ownership checks, and tests around the most important flows.

The frontend is intentionally small. Its job is to make the API easy to try out without needing Postman or curl.

## Design Choices

### NestJS

NestJS gives the backend a clear structure without much extra setup. Controllers, services, DTOs, guards, and modules are separated by responsibility, which makes the project easier to navigate during review.

The main backend modules are:

- `AuthModule` for registration, login, JWT issuing, and JWT validation
- `TasksModule` for protected task CRUD
- `PrismaModule` for database access and Prisma client lifecycle

### PostgreSQL and Prisma

The challenge asks for a Node.js + TypeScript backend with an SQL database. PostgreSQL is a reliable default for relational data, and Prisma keeps schema definition, migrations, and typed database access straightforward.

The data model is intentionally simple:

#### User

- `id`
- `email`
- `passwordHash`
- `createdAt`
- `updatedAt`

#### Task

- `id`
- `title`
- `description`
- `deadline`
- `done`
- `userId`
- `createdAt`
- `updatedAt`

Each task belongs to exactly one user.

### JWT Authentication

The challenge allows basic authentication, but I chose JWT because it fits a frontend/backend application better.

The backend returns an access token after registration or login. Protected routes require:

```http
Authorization: Bearer <token>
````

Passwords are never stored directly. They are hashed with `bcrypt` before being saved.

### Authorization Model

Task ownership is enforced in the service layer by always querying or mutating tasks with both:

* the task ID
* the authenticated user ID

For example, update and delete operations are scoped by `id` and `userId`, so a user cannot modify another user's task even if they know the task ID.

### Frontend Scope

The frontend is a small reviewer-facing UI, not a polished product interface.

It supports:

* registration
* login
* persisted login using the access token
* task creation
* task editing
* task deletion
* done/undone toggles
* filtering and sorting

I used plain React state instead of adding a larger state-management or data-fetching library. For this scope, that keeps the code easier to follow.

The access token is stored in `localStorage` for simplicity. In a production setup, I would revisit this and consider `httpOnly` cookies depending on the deployment and security requirements.

## API Summary

### Auth

#### Register

```http
POST /auth/register
```

Body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Returns:

```json
{
  "accessToken": "...",
  "user": {
    "id": "...",
    "email": "user@example.com"
  }
}
```

#### Login

```http
POST /auth/login
```

Body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Returns:

```json
{
  "accessToken": "...",
  "user": {
    "id": "...",
    "email": "user@example.com"
  }
}
```

### Tasks

All task endpoints require a bearer token.

#### Create Task

```http
POST /tasks
```

Creates a task for the authenticated user.

#### List Tasks

```http
GET /tasks
```

Lists the authenticated user's tasks.

Optional query parameters:

```http
GET /tasks?status=active&sort=deadlineAsc
```

Supported `status` values:

* `all`
* `active`
* `done`
* `overdue`

Supported `sort` values:

* `newest`
* `deadlineAsc`

#### Get One Task

```http
GET /tasks/:id
```

Returns one task owned by the authenticated user.

#### Update Task

```http
PATCH /tasks/:id
```

Partially updates an owned task.

#### Mark Task Done

```http
PATCH /tasks/:id/done
```

Marks an owned task as completed.

#### Mark Task Undone

```http
PATCH /tasks/:id/undone
```

Marks an owned task as not completed.

#### Delete Task

```http
DELETE /tasks/:id
```

Deletes an owned task.

## Validation and Security

The backend includes:

* DTO validation with NestJS `ValidationPipe`
* JWT route protection for task endpoints
* password hashing with `bcrypt`
* user-scoped task access
* UUID validation for task route parameters
* environment-based configuration for secrets and database connection values

Current security tradeoff:

* the frontend stores the access token in `localStorage` to keep the challenge implementation simple

For a production application, I would review token storage, token expiry, refresh strategy, CSRF implications, and deployment-specific security requirements.

## Filtering and Sorting

`GET /tasks` supports basic filtering and sorting.

Filtering:

* `all`: returns all owned tasks
* `active`: returns incomplete tasks
* `done`: returns completed tasks
* `overdue`: returns incomplete tasks with a deadline in the past

Sorting:

* `newest`: newest tasks first
* `deadlineAsc`: earliest deadline first

This keeps the API useful while avoiding unnecessary complexity for the challenge scope.

## Running the Project

### Prerequisites

* Node.js
* npm
* Docker

### Environment Variables

Create a backend environment file:

```bash
cp backend/.env.example backend/.env
```

Example backend `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bizcuit_todo?schema=public"
JWT_SECRET="super-secret-change-me"
JWT_EXPIRES_IN="1h"
```

Create a frontend environment file if you want to override the default API URL:

```bash
cp frontend/.env.example frontend/.env
```

Example frontend `.env`:

```env
VITE_API_BASE_URL="http://localhost:3000"
```

### Quick Start

From the repository root:

```bash
docker compose up -d
```

Install backend dependencies:

```bash
cd backend
npm install
```

Run database migrations:

```bash
npx prisma migrate deploy
```

Start the backend:

```bash
npm run start:dev
```

In a second terminal, install and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

The frontend runs on:

```text
http://localhost:5173
```

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

The backend tests cover:

* auth service behavior
* auth controller behavior
* JWT strategy behavior
* task service behavior
* task controller behavior
* register/login request flows
* protected task routes
* user ownership boundaries

The e2e tests validate request/response behavior and authorization boundaries at the Nest application layer, but they do not hit a real PostgreSQL database. `PrismaService` is overridden with mocked in-memory persistence for those tests. I chose that tradeoff to keep the suite fast and meaningful within the challenge timeframe, while accepting that it is not a full database integration test.

## Project Structure

```text
backend/
  prisma/
    schema.prisma
  src/
    auth/
    common/
    prisma/
    tasks/
    app.module.ts
    main.ts

frontend/
  src/
    components/
    api.ts
    App.tsx
    types.ts
    utils.ts
```

## What I Would Improve Next

Given more time, I would add:

* pagination for `GET /tasks`
* Swagger/OpenAPI documentation
* database-backed e2e tests with a dedicated test database
* refresh tokens or another token renewal strategy
* centralized error response formatting
* CI for linting, unit tests, and e2e tests
* stronger frontend handling for expired sessions
* more polished loading and empty states in the UI

## Known Limitations

For simplicity, the frontend stores the JWT access token in `localStorage`. This keeps the challenge implementation small and easy to run locally. In a production application, I would consider using secure, `HttpOnly` cookies or another deployment-appropriate token storage strategy to reduce exposure to XSS risks.

The e2e tests currently exercise request/response flows, validation, authentication, authorization, and task behavior using mocked persistence. With more time, I would add a dedicated test PostgreSQL instance to verify Prisma schema, migrations, and real database behavior end to end.

## Time-Limited Tradeoffs

A few choices were kept deliberately simple:

* no pagination yet
* no generated API documentation
* no refresh token flow
* no dedicated test database for e2e tests
* lightweight frontend state management
* no advanced task features such as labels, priorities, sharing, or reminders

The goal was to submit a complete, understandable implementation of the core todo/auth flow rather than a broader but less finished application.
