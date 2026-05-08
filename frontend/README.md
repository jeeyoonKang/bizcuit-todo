# Bizcuit Todo Frontend

React + TypeScript + Vite frontend for the Bizcuit TODO code challenge.

This frontend provides a minimal UI for the main user flows:

- Register and login
- View tasks
- Create tasks
- Edit tasks
- Delete tasks
- Mark tasks as done or active
- Set task deadlines
- Filter and sort tasks

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Notes

The frontend is intentionally minimal. The main priority for this challenge was to implement a clean backend with authentication, authorization, SQL persistence, task CRUD, backend tests, and clear documentation.

For the full project setup and design choices, see the root README.
