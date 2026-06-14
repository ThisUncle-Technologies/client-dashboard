# Security Plan

## Purpose

Define the security boundaries and verification strategy for V1.

## Security Boundaries

- Supabase RLS protects tenant-scoped data.
- Netlify Functions protect server-only secrets.
- Browser code only uses the Supabase anon key.
- Cloudinary and Umami secrets never ship to the client.
- Public content is read-only and published-only.

## Required Controls

- Disable public signup.
- Use admin-created accounts only.
- Keep permissions role-aware and assignment-aware.
- Centralize permission checks in shared helpers and server functions.
- Record important admin and client actions in audit logs.

## Required Negative Tests

- Client cannot access another client's data through direct DB queries.
- Client cannot tamper with site IDs to read foreign records.
- Anonymous users cannot reach private tables.
- Signed upload requests fail when the user is not assigned to the site.
- Analytics requests fail when the server-side permission check fails.

## Testing and Acceptance Criteria

- RLS tests are repeatable and documented.
- Security regressions are checked in staging or preview before release.
- Cross-client access fails at the database and API layers.
- No browser bundle contains service role, Cloudinary secret, or Umami key.

## Unresolved Decisions

- Whether password setup uses invite-first or invite-plus-reset flow for admin provisioning.
