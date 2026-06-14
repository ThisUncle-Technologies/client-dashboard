# Decision Log

## Confirmed Decisions

- Reusable multi-client dashboard is the V1 direction.
- One dashboard serves all clients.
- ThisUncle admin and client are the only V1 roles.
- Supabase is the auth and database platform.
- Cloudinary is the media platform.
- Umami is the recommended analytics provider for V1.
- Netlify hosts the dashboard and serverless functions.
- Public website integration uses runtime fetch plus static fallback.

## Open Decisions

- Exact pilot site for the first integration.
- Umami Cloud vs self-hosted.
- Whether public-content delivery should start as a Netlify Function or Supabase view first.
- Whether admin provisioning uses invite links only or invite plus password reset.
- Final production/staging domain names.

## Decision Criteria

- Favor the simplest option that preserves tenant isolation.
- Keep secrets server-side.
- Prefer versioned public contracts over ad hoc payloads.
- Avoid per-client dashboards or per-client code forks.

## Phase 1 Exit Criteria

- Architecture is documented.
- Database and RLS direction are approved.
- Auth plan is documented.
- Media, analytics, deployment, and security boundaries are documented.
- Unresolved items are visible and do not block Phase 2 unless they affect data model or access control.
