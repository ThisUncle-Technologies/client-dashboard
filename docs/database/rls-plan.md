# RLS Plan

## Purpose

Define the row-level security boundaries for V1.

## RLS Principles

- Enable RLS on all tenant-scoped tables.
- Deny by default.
- Grant access only through explicit policies.
- Treat UI filtering as convenience only.
- Prefer simple policies that can be tested and explained.

## Role Rules

- ThisUncle admin:
  - can read and write all tenant data
  - can provision and assign users
  - can manage analytics mappings and audit logs
- Client user:
  - can only read assigned client and site rows
  - can only write rows permitted for assigned sites
  - cannot read another client's data
- Anonymous user:
  - cannot read dashboard tables
  - can only reach approved public content endpoints or views

## Required Negative Tests

- Client A cannot read Client B sites.
- Client A cannot update or delete Client B records.
- Client A cannot read Client B media assets.
- Client A cannot read Client B gallery or analytics mappings.
- Anonymous requests cannot access private dashboard tables.
- Tampered site IDs in client requests must fail.

## Policy Coverage Checklist

- `profiles`
- `clients`
- `sites`
- `site_assignments`
- `media_assets`
- `gallery_sections`
- `gallery_items`
- `analytics_mappings`
- `audit_logs`

## Testing and Acceptance Criteria

- RLS is enabled on every tenant-scoped table.
- All policies are verified with positive and negative test cases.
- Cross-client access fails in direct database tests, not just in the UI.
- Public access is limited to published content only.

## Unresolved Decisions

- Whether some admin-only support tables should remain outside RLS or still be protected by admin-only policies.
