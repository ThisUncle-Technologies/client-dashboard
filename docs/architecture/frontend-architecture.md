# Frontend Architecture

## Purpose

Define the V1 dashboard shell and client-side routing model.

## Frontend Stack

- React
- Vite
- Tailwind CSS
- A lightweight router such as `react-router-dom`

## App Structure

- `AppLayout` owns the shared shell.
- Sidebar and topbar render from role-aware navigation data.
- Route guards protect authenticated pages.
- Placeholder pages are used until feature phases are built.

## Routing and Access

- Unauthenticated users go to login.
- `admin` users can access all dashboard sections.
- `client` users only see assigned sites and allowed pages.
- Route visibility is not the security boundary; Supabase RLS and server-side checks are.

## UI Behavior

- Shell must be responsive on desktop and mobile.
- Navigation must degrade gracefully when a user has limited access.
- Empty states should explain what the user can do next.
- The shell should not assume all modules are present before their phase is implemented.

## Auth Plan

- Supabase Auth is the only login mechanism for V1.
- Public signup is disabled.
- Accounts are created by ThisUncle admins.
- Session state persists across refreshes.
- Login, logout, and password reset flows are kept simple and explicit.

## Environment Inputs

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Testing and Acceptance Criteria

- App boots and routes without backend feature code.
- Authenticated admin and client users land on the correct shell state.
- Unauthorized users cannot reach protected routes.
- Mobile navigation works without breaking access rules.
- No browser bundle contains server-only secrets.

## Unresolved Decisions

- Exact route names and dashboard landing pages.
- Whether password setup uses invite links only or also reset links during admin provisioning.
