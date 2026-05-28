# Roadmap Review - Client Dashboard by ThisUncle

## 1. Executive Summary

The current `PROJECT_ROADMAP.md` is strong enough as a first roadmap, but it should be revised before implementation starts.

The overall build strategy is correct:

- Build one reusable multi-client dashboard.
- Keep existing client websites as separate projects.
- Use the dashboard as the source of managed media/gallery/portfolio content.
- Let websites fetch published content dynamically at runtime.
- Preserve static fallback content so websites do not break if the dashboard/API is unavailable.
- Add analytics through a proven analytics provider rather than building a custom event warehouse.

The main issue is phase order. The current roadmap puts the frontend shell before the database and authentication phases. That should be changed. The database/RLS foundation should come first, then authentication/access control, then the frontend shell should be built around real roles, permissions, and route boundaries.

Recommended decision: approve the roadmap direction, but revise before Phase 1 proceeds into implementation planning.

---

## 2. Confirmed V1 Scope

Version 1 should include:

- ThisUncle admin-created client accounts.
- Client login.
- ThisUncle admin role.
- Client role.
- One client managing one or multiple assigned websites.
- Admin visibility across all clients and sites.
- Client visibility limited to assigned sites.
- Client/site management by ThisUncle admin.
- Media upload and management.
- Cloudinary image/video storage.
- Supabase metadata storage.
- Gallery section management.
- Portfolio/project section management.
- Publish/unpublish workflow for gallery and portfolio items.
- Instant or very fast website updates through runtime data fetching.
- Static website fallback if dynamic fetching fails.
- Public published-content API/read layer.
- Traffic analytics per website.
- Admin analytics visibility across all websites.
- Client analytics visibility only for assigned websites.
- Basic audit logging for important changes, if practical in V1.

---

## 3. Explicitly Excluded From V1

Version 1 should not include:

- Full page builder.
- Drag-and-drop website editor.
- Full blog CMS.
- Advanced approval workflows.
- Multi-language support.
- Deployment automation for all websites.
- Complex custom analytics warehouse.
- Full universal content model for every page section.
- Design editing for client websites.
- GitHub-commit-driven publishing as the main update model.
- Migration of all existing client websites at once.
- Advanced asset transformation workflows beyond basic Cloudinary use.
- Complex team permissions beyond `admin` and `client`, unless absolutely required.

---

## 4. Phase-by-Phase Review

## Phase 0: Discovery and Existing System Study

### Current Purpose

Study existing websites and systems before building.

### Recommendation

Keep.

### Risks

- Discovery findings may become stale as more client websites are added.
- Cacla has both a dashboard and static site integration, so documentation must distinguish current runtime API use from older WordPress connector code.

### Missing Testing/Acceptance Criteria

Add explicit acceptance that the Cacla runtime API + static fallback pattern is the preferred reference pattern for V1 website integration.

---

## Phase 1: Product and Technical Planning

### Current Purpose

Define product structure, architecture, environment variables, security strategy, and deployment strategy.

### Recommendation

Keep, but make it more decision-oriented.

### Risks

- Planning can become too abstract if it does not produce concrete schemas, route maps, and provider decisions.
- Provider choices must be confirmed before implementation starts.

### Missing Testing/Acceptance Criteria

Add acceptance criteria for:

- approved revised phase order
- approved first pilot site
- approved data ownership model
- approved public content contract
- approved analytics provider

---

## Phase 2: Frontend Shell

### Current Purpose

Build static React/Vite visual shell before backend integration.

### Recommendation

Move later and rename to `Frontend Shell and Role-Based Routing`.

This should become Phase 4, after database/RLS and auth/access control.

### Reason

The requested reordering is correct. Authentication depends on database/RLS structure, and protected frontend routes depend on authentication. A role-aware dashboard UI is easier and cleaner after roles and permissions are defined.

### Risks

- If built too early, placeholder route assumptions may need to be rewritten.
- Navigation could expose pages clients should not see.
- UI state may not match real access boundaries.

### Missing Testing/Acceptance Criteria

When moved to Phase 4, add tests for:

- admin routes visible only to admins
- client routes scoped to assigned sites
- unauthenticated redirect behavior
- responsive layout after real route guards are added

---

## Phase 3: Supabase Database Schema

### Current Purpose

Create tables, migrations, seed data, and RLS.

### Recommendation

Move earlier and rename to `Supabase Database Foundation`.

This should become Phase 2.

### Risks

- RLS is the highest-risk part of the platform.
- Incorrect policies can leak client data.
- Public read endpoints must not expose drafts or private media.

### Missing Testing/Acceptance Criteria

Add acceptance criteria for:

- negative RLS tests
- public anon user cannot read private tables
- client user cannot access another client's site/media/gallery rows
- admin can access all tenant data
- service-role usage is limited to server-side functions

---

## Phase 4: Authentication and Access Control

### Current Purpose

Implement login, protected routes, roles, and no public signup.

### Recommendation

Move earlier to Phase 3.

### Risks

- Supabase Auth and profile/role records can drift if account creation is not controlled.
- Admin-created accounts need a clear workflow.
- Public signup must remain unavailable.

### Missing Testing/Acceptance Criteria

Add tests for:

- invite or admin-created account flow
- disabled public signup
- password reset behavior
- session expiration
- client assignment enforcement after login

---

## Phase 5: Admin Client/Site Management

### Current Purpose

Allow ThisUncle admins to create clients, create sites, and assign access.

### Recommendation

Keep as Phase 5.

### Risks

- Site/client assignment mistakes could expose data.
- Site terminology must be consistent: avoid switching between "site", "project", and "website" without clear definitions.

### Missing Testing/Acceptance Criteria

Add:

- deleting/deactivating a client does not orphan sensitive access
- unassigning a user removes access immediately
- site slug/domain uniqueness
- client cannot mutate site ownership fields

---

## Phase 6: Cloudinary Media Library

### Current Purpose

Add secure media upload and management.

### Recommendation

Keep as Phase 6.

### Risks

- Client cross-access through Cloudinary public IDs or folder paths.
- Unsigned upload misuse.
- Large videos may become expensive or slow.
- Deleting media used in published galleries could break websites.

### Missing Testing/Acceptance Criteria

Add:

- signed upload endpoint requires authenticated user
- upload signature is scoped to assigned site/client
- archive is preferred before hard delete
- published media cannot be deleted without warning or dependency check
- file type and size limits are enforced

---

## Phase 7: Gallery and Portfolio Manager

### Current Purpose

Create/manage gallery and portfolio content from media assets.

### Recommendation

Keep as Phase 7.

### Risks

- Gallery and portfolio may drift into full CMS/page-builder scope.
- Different sites have different gallery structures.
- Reordering and publishing state can become complex.

### Missing Testing/Acceptance Criteria

Add:

- published API order matches dashboard order
- draft/unpublished items never appear publicly
- replacing media updates public output without rebuild
- fallback still works if dynamic content fails

---

## Phase 8: Public Website Integration Layer

### Current Purpose

Expose published content to websites and integrate one pilot site.

### Recommendation

Keep as Phase 8.

### Risks

- Public API might expose private fields.
- CORS misconfiguration can block sites or overexpose endpoints.
- Existing static pages can break if integration scripts are too invasive.
- Website-specific HTML/CSS can make a generic `cms.js` difficult.

### Missing Testing/Acceptance Criteria

Add:

- public response schema documented and versioned
- integration script fails silently to fallback
- no layout shift that damages existing pages
- pilot site tested on mobile and desktop
- API cache duration is defined

---

## Phase 9: Analytics Integration

### Current Purpose

Show website traffic data inside the dashboard using Umami.

### Recommendation

Keep as Phase 9.

### Risks

- Analytics site IDs could be mapped to the wrong client/site.
- Provider API keys must not be exposed.
- Umami Cloud/self-hosted decision impacts ops burden.
- Recent visitor activity may be limited by provider API capabilities.

### Missing Testing/Acceptance Criteria

Add:

- client cannot request analytics for unassigned site
- admin aggregate view works
- analytics function validates site assignment before provider request
- date filters map correctly to provider API
- empty-state behavior for new sites

---

## Phase 10: Deployment and Production Setup

### Current Purpose

Deploy the dashboard safely.

### Recommendation

Keep as Phase 10, but add a preview/staging note.

### Risks

- Production secrets can leak through Vite env variables if misnamed.
- Supabase production RLS can differ from local/staging.
- Netlify functions need correct environment configuration.
- Cloudinary and Umami provider credentials must be separated from public frontend config.

### Missing Testing/Acceptance Criteria

Add:

- staging or preview deployment verification
- production env var audit
- frontend bundle secret audit
- provider webhook/API failure checks if used

---

## Phase 11: Hardening and QA

### Current Purpose

Make V1 stable.

### Recommendation

Keep as Phase 11, but include security regression tests explicitly.

### Risks

- QA becomes a checklist only if tests are not repeatable.
- Security issues may be found late if RLS testing is delayed.

### Missing Testing/Acceptance Criteria

Add:

- repeatable RLS test matrix
- browser/device smoke tests
- public API schema tests
- upload abuse tests
- audit log verification

---

## Phase 12: Future CMS Features

### Current Purpose

Plan future CMS capabilities after media management works.

### Recommendation

Keep as Phase 12.

### Risks

- Future CMS scope can creep into V1.
- A universal page builder would significantly increase complexity.

### Missing Testing/Acceptance Criteria

Add:

- future features require separate scoped roadmap entries
- no feature enters V1 unless tied to media/gallery/portfolio outcomes

---

## 5. Recommended Revised Phase Order

Recommended final phase list:

1. Phase 0: Discovery and Existing System Study
2. Phase 1: Product and Technical Planning
3. Phase 2: Supabase Database Foundation
4. Phase 3: Authentication and Access Control
5. Phase 4: Frontend Shell and Role-Based Routing
6. Phase 5: Admin Client/Site Management
7. Phase 6: Cloudinary Media Library
8. Phase 7: Gallery and Portfolio Manager
9. Phase 8: Public Website Integration Layer
10. Phase 9: Analytics Integration
11. Phase 10: Deployment and Production Setup
12. Phase 11: Hardening and QA
13. Phase 12: Future CMS Features

This revised order is better than the current order because it establishes the security and data model before UI assumptions are made.

---

## 6. Critical Architecture Assumptions

### One Reusable Dashboard Instead Of Dashboard-Per-Client

Confirmed.

One reusable dashboard is the correct long-term direction. Separate dashboards would duplicate maintenance, fragment analytics, and make shared improvements harder.

### Websites Remain Separate Projects

Confirmed.

Existing websites should remain independent. The dashboard should manage content and media, not absorb every website into one monolithic app.

### Supabase For Auth/Database

Confirmed.

Supabase fits the auth, Postgres, RLS, and API needs. RLS quality is critical.

### Cloudinary For Media Storage/CDN

Confirmed.

Cloudinary is a good fit for image/video delivery and transformations. Upload signing and tenant scoping must be designed carefully.

### Umami For Analytics

Confirmed for V1.

Umami is practical, privacy-friendly, and easier to embed into the dashboard than GA4. Revisit only if provider/API limitations block required reporting.

### Netlify For Hosting

Confirmed.

Netlify fits the React/Vite dashboard and serverless functions for signing uploads and fetching analytics securely.

### Runtime Website Fetch Instead Of GitHub-Commit-Driven Publishing

Confirmed.

Runtime fetch is the right default because it enables fast updates without rebuilds. GitHub-commit publishing should remain an exception, not the main model.

### Static Fallback On Client Websites

Confirmed.

Static fallback is essential. Existing websites should keep usable static content if the dashboard API fails.

---

## 7. Major Risks and Mitigations

### RLS/Security

Risk: Incorrect RLS policies could leak client data.

Mitigation:

- Build schema and RLS before UI.
- Add negative access tests.
- Keep service-role usage server-side only.
- Document a permission matrix.

### Media Upload Permissions

Risk: Clients could upload into another client's site/folder or access another client's media metadata.

Mitigation:

- Signed upload endpoint must validate the authenticated user's site assignment.
- Store media ownership in Supabase.
- Scope Cloudinary folders by site/client identifiers.
- Enforce file type and size limits.

### Client Cross-Access

Risk: A client user sees or edits another client's sites, galleries, or analytics.

Mitigation:

- Centralize permission checks.
- RLS on every tenant-scoped table.
- UI filters are not enough; database policies must enforce isolation.

### Public API Exposure

Risk: Public website endpoints expose drafts, private media, or internal metadata.

Mitigation:

- Use published-only views or serverless endpoints.
- Return minimal fields.
- Version public response schemas.
- Test anonymous access explicitly.

### Analytics Data Isolation

Risk: Client can query another site's analytics by changing IDs.

Mitigation:

- Analytics API calls must go through server-side functions.
- Function validates user assignment before calling Umami.
- Never expose Umami API keys in browser code.

### Website Integration Breaking Static Pages

Risk: `cms.js` changes layout or breaks existing site behavior.

Mitigation:

- Integrate one pilot site first.
- Preserve static fallback containers.
- Fail silently to static content.
- Avoid full site rewrites.
- Test mobile and desktop.

### Cloudinary/Umami/Supabase Configuration Complexity

Risk: Multiple providers increase setup mistakes.

Mitigation:

- Document environment variables clearly.
- Use staging/preview environment before production.
- Add provider configuration checklist.
- Keep provider IDs mapped in Supabase with admin-only write access.

---

## 8. Dependencies Between Phases

- Phase 0 informs Phase 1.
- Phase 1 must approve architecture, providers, schema direction, and pilot site before implementation.
- Phase 2 depends on Phase 1 decisions and creates the data/RLS foundation.
- Phase 3 depends on Phase 2 tables, profile model, and RLS.
- Phase 4 depends on Phase 3 auth and role data so routes can be role-aware.
- Phase 5 depends on Phase 2 and Phase 3 because client/site management must respect permissions.
- Phase 6 depends on Phase 5 because media must attach to real assigned sites.
- Phase 7 depends on Phase 6 because galleries and portfolios use media assets.
- Phase 8 depends on Phase 7 because public websites need stable published content contracts.
- Phase 9 depends on Phase 5 for site records and analytics mappings; it also depends on Phase 3 for access control.
- Phase 10 depends on a stable V1 feature set and provider configuration.
- Phase 11 depends on all V1 features being present enough to test end to end.
- Phase 12 depends on V1 feedback and should not block V1.

---

## 9. Recommended Changes To PROJECT_ROADMAP.md

Make these exact changes before proceeding:

1. Rename current `Phase 2: Frontend Shell` to `Phase 4: Frontend Shell and Role-Based Routing`.
2. Move current `Phase 3: Supabase Database Schema` to Phase 2 and rename it `Supabase Database Foundation`.
3. Move current `Phase 4: Authentication and Access Control` to Phase 3.
4. Update the "Recommended First Implementation Sequence" to match the revised order.
5. Add a short "V1 Scope" section near the top.
6. Add a short "Explicitly Excluded From V1" section near the top.
7. Add "first pilot site decision" to Phase 1 acceptance criteria.
8. Add "public content contract" to Phase 1 acceptance criteria.
9. Strengthen Phase 2 RLS tests with explicit negative client cross-access tests.
10. Strengthen Phase 3 auth tests with no-public-signup and account-creation checks.
11. Strengthen Phase 4 frontend tests with role-aware routing checks.
12. Add Cloudinary upload signing and tenant validation acceptance criteria to Phase 6.
13. Add public response schema/versioning acceptance criteria to Phase 8.
14. Add analytics server-side permission validation to Phase 9.
15. Add staging/preview deployment checks to Phase 10.
16. Add repeatable security regression testing to Phase 11.

---

## 10. Final Recommendation

Approve with edits.

The roadmap direction is correct, but it should be revised before moving into Phase 1 implementation planning. The most important edit is the phase reordering:

- database/RLS first
- authentication/access control second
- role-aware frontend shell third

This reduces rework and keeps security boundaries from becoming an afterthought.

Do not build the app yet. Update `PROJECT_ROADMAP.md` after this review is approved, then proceed to Phase 1 planning documents.
