# Database Schema Plan

## Purpose

Define the Supabase data model for V1.

## Core Tables

- `profiles`
- `clients`
- `sites`
- `site_assignments`
- `media_assets`
- `gallery_sections`
- `gallery_items`
- `analytics_mappings`
- `audit_logs`

## Relationships

- `profiles` stores the auth-linked user profile and role.
- `clients` stores client organizations.
- `sites` belongs to one client.
- `site_assignments` maps users to sites.
- `media_assets` belongs to one site and one owning client.
- `gallery_sections` belongs to one site.
- `gallery_items` links gallery sections to media assets.
- `analytics_mappings` maps a site to an analytics provider and provider site ID.
- `audit_logs` records important privileged actions.

## Data Model Rules

- Use UUID primary keys.
- Add `created_at` and `updated_at` timestamps where appropriate.
- Add `published` or equivalent status fields for content exposed publicly.
- Keep tenant ownership explicit on every tenant-scoped record.
- Do not rely on UI filters for isolation.

## Public Content Contract

- Public-facing content must come from dedicated views or server responses, not raw admin tables.
- The response schema must be versioned.
- Returned fields should be minimal and limited to published content.

## Implementation Notes

- Seed data should include at least one admin, one client, one client user, and one site.
- Schema should support one client with multiple sites and multiple assigned users per site.
- Future CMS tables are intentionally excluded from V1 unless needed for media/gallery/public content.

## Testing and Acceptance Criteria

- Migrations should apply cleanly in a new Supabase project.
- Seed data should create a usable V1 test environment.
- Every tenant-scoped table has a clear owning client/site path.
- The schema supports admin and client roles without separate per-client databases.

## Unresolved Decisions

- Whether `profiles` is populated by an auth trigger or by an admin provisioning flow first.
- Final set of nullable vs required fields for `sites`.
