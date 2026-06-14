# Deployment Plan

## Purpose

Define the Netlify and production rollout plan for V1.

## Target Stack

- Netlify for the dashboard frontend.
- Supabase production project for auth and database.
- Cloudinary production account for media.
- Umami production instance or account for analytics.

## Environments

- Local development
- Preview or staging
- Production

## Deployment Rules

- Preview/staging must pass smoke checks before production promotion.
- Production deploys must verify auth, RLS, media upload, analytics fetch, and pilot website integration.
- Environment variables must be configured per environment.
- Secrets must remain server-side.

## Required Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `UMAMI_API_URL`
- `UMAMI_API_KEY`
- `APP_PUBLIC_URL`

## Testing and Acceptance Criteria

- Production build succeeds.
- Preview/staging builds are smoke-tested.
- Auth works in production.
- RLS works in production.
- Cloudinary uploads work in production.
- Analytics fetches work in production.
- Pilot website integration works in preview/staging and production.
- No frontend bundle leaks secrets.

## Unresolved Decisions

- Final production domain and any required staging subdomain names.
