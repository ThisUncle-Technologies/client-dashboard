# System Architecture

## Purpose

Define the V1 architecture for the reusable ThisUncle client dashboard before implementation begins.

## Final Architecture

- One reusable dashboard serves all clients.
- Frontend: React + Vite + Tailwind CSS.
- Hosting: Netlify.
- Auth, database, and RLS: Supabase.
- Media storage and delivery: Cloudinary.
- Analytics: Umami, accessed through server-side functions only.
- Public website integration: lightweight runtime fetch from a published-content endpoint, with static HTML as fallback.

## Core Model

- ThisUncle admin users manage every client and site.
- Client users can only access their assigned client and site records.
- One client can own many sites.
- One site belongs to one owning client and can have multiple assigned users.
- The dashboard is tenant-aware at every layer: UI, API, and database.

## Runtime Boundaries

- Browser code uses only the Supabase anon key.
- Service role, Cloudinary secret, and Umami API key stay server-side.
- Netlify Functions handle secret-backed operations:
  - Cloudinary signed upload requests
  - analytics fetches
  - public-content delivery if direct Supabase views are not sufficient
- Public websites never receive dashboard secrets or service credentials.

## Public Website Integration

- Websites keep their static content as fallback.
- A small runtime script fetches published content for approved sections only.
- If fetch fails, the static DOM remains intact.
- Public responses must not include drafts, private media, or internal metadata.
- Response schemas are versioned so website consumers can depend on stable contracts.

## Environment Variables

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

- Only one dashboard codebase exists for all clients.
- Admin and client roles resolve correctly after login.
- Client users cannot see another client's data in the UI or by direct request.
- Secret-backed operations are only reachable through server-side functions.
- Public websites still work with static fallback when the API is unavailable.
- Public content delivery uses a documented versioned schema.

## Unresolved Decisions

- Final pilot site selection.
- Whether public-content delivery is implemented as a Netlify Function or Supabase read layer first.
- Whether Umami will be Cloud-hosted or self-hosted.
