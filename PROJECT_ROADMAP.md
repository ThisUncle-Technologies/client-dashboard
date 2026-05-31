# Client Dashboard by ThisUncle - Project Roadmap

## Project Purpose

Client Dashboard by ThisUncle is a reusable multi-client platform for websites managed by ThisUncle Technologies. It should let ThisUncle admins create client accounts, assign one or more websites/projects to each client, manage media and gallery/portfolio content, and later evolve into a practical headless CMS.

Recommended baseline architecture:

- Hosting: Netlify for the dashboard frontend.
- Frontend: React + Vite + Tailwind CSS.
- Auth/database: Supabase.
- Media storage/CDN: Cloudinary.
- Analytics: Umami.
- Website integration: static sites remain independent and fetch published content dynamically through a safe public read layer.

## V1 Scope

V1 is the first production-ready release of the reusable ThisUncle client dashboard. It includes:

- Multi-client authentication and access control.
- Role-aware dashboard shell for `admin` and `client` users.
- Supabase-backed client, site, and assignment management.
- Secure media upload and library management through Cloudinary.
- Gallery and portfolio management for assigned sites.
- Public website content delivery for one approved pilot site.
- Site-level analytics surfaced in the dashboard through a server-side integration.
- Netlify deployment, preview/staging validation, and production hardening.

## Explicitly Excluded From V1

These items are intentionally out of scope for V1 and should be planned separately if needed later:

- Public signup or self-service account creation.
- A full universal page builder.
- Multi-language content management.
- A custom analytics warehouse or custom tracking platform.
- Scheduled publishing/workflow automation beyond the core dashboard flow.
- Website hosting or deployment automation for every client site.
- Full CMS feature families such as blog/news, team members, services, and advanced SEO tooling.

This roadmap is intentionally phased. Each phase has a clear stopping point so implementation stays controlled and avoids overengineering.

---

## Phase 0: Discovery and Existing System Study

### Goal

Study the existing websites and systems before building the new dashboard.

### What Will Be Built

No app features. This phase produces discovery notes and architectural direction.

### What Will Not Be Built Yet

- No React app.
- No Supabase project.
- No Cloudinary integration.
- No authentication.
- No website integration code.

### Findings To Document

- Existing websites under `projects/websites`.
- `systems/Cacla-dashboard`.
- `websites/cacla`.
- Media/gallery patterns across existing sites.
- Static fallback patterns.
- Dashboard-to-website update patterns.
- Architecture choices to reuse or avoid.

### Current Findings

- Most existing websites are vanilla HTML/CSS/JS with no build step.
- Gibeon and Maasai Horizons have the strongest gallery/portfolio references.
- Cacla website uses a better future-facing pattern: runtime fetch from a dashboard API with static fallback.
- Cacla-dashboard is Laravel/MySQL and client-specific. It should remain separate and be used as a reference only.
- The new dashboard should not be built on Cacla-dashboard because it lacks multi-client roles, tenant isolation, media management, and the desired Supabase/Cloudinary/Netlify architecture.
- Avoid backend-generated HTML/CSS strings as the standard integration model.
- Avoid cloning one dashboard per client.

### Files/Folders Likely Involved

- `PROJECT_ROADMAP.md`
- Future planning docs, if needed:
  - `docs/discovery.md`
  - `docs/architecture.md`

### Dependencies

- Access to existing local website/system folders.
- Final confirmation of preferred stack.

### Testing Checklist

- Confirm all relevant website folders were inspected.
- Confirm Cacla dashboard and Cacla website integration were inspected.
- Confirm roadmap reflects the observed patterns.

### Acceptance Criteria

- Existing system findings are documented clearly.
- Recommended architecture is confirmed.
- Reusable and non-reusable patterns are identified.
- No production app code is created.

### Stopping Point Before Next Phase

Stop after documentation. Do not scaffold the app until product and technical planning are approved.

---

## Phase 1: Product and Technical Planning

### Goal

Define the final product structure before writing app code.

### What Will Be Built

Planning documents only.

Recommended documents:

- `docs/architecture.md`
- `docs/data-model.md`
- `docs/security.md`
- `docs/integrations.md`
- `docs/deployment.md`

### What Will Not Be Built Yet

- No frontend shell.
- No Supabase migrations.
- No auth screens.
- No Cloudinary upload flow.
- No analytics UI.

### Decisions To Finalize

- Frontend stack: React + Vite + Tailwind CSS.
- Backend/API approach:
  - Supabase directly for authenticated dashboard data.
  - Supabase views/functions or lightweight serverless endpoints for public published content.
  - Netlify Functions only where secrets are required, such as Cloudinary signed uploads or analytics provider API calls.
- Database/storage:
  - Supabase Postgres for structured data.
  - Cloudinary for images/videos.
- Analytics:
  - Umami as the recommended first provider.
- Multi-client/multi-site model:
  - ThisUncle admin can view/manage all clients and sites.
  - Client users can only access assigned sites.
  - One client can have many sites.
  - One site belongs to one owning client but can have multiple assigned users.
- Roles:
  - `admin`
  - `client`
  - optional later: `editor`, `viewer`
- No public signup.
- Admin-created accounts only.

### Proposed Folder Structure

```txt
client-dashboard/
├── PROJECT_ROADMAP.md
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   ├── deployment.md
│   ├── integrations.md
│   └── security.md
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── routes/
│   └── styles/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── netlify/
│   └── functions/
└── public/
```

The `src`, `supabase`, `netlify`, and `public` folders should not be created until implementation phases require them.

### Environment Variables To Plan

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `UMAMI_API_URL`
- `UMAMI_API_KEY`
- `APP_PUBLIC_URL`

### Deployment Strategy

- Dashboard frontend hosted on Netlify.
- Supabase production project created before Phase 2.
- Cloudinary account/folder structure created before Phase 6.
- Umami site IDs configured before Phase 9.
- Production subdomain candidate: `dashboard.thisuncle.co.tz`.

### Security Strategy

- Supabase Auth for users.
- Disable public signup.
- RLS on all tenant-scoped tables.
- Server-only secrets kept in Netlify Functions.
- Clients cannot read another client's sites, media, galleries, or analytics mappings.
- Audit important admin/client actions.

### Files/Folders Likely Involved

- `PROJECT_ROADMAP.md`
- `docs/*.md`

### Dependencies

- Final decision on hosting and providers.
- Supabase project ownership decision.
- Cloudinary account ownership decision.
- Umami Cloud vs self-hosted decision.

### Testing Checklist

- Confirm architecture supports one client with multiple sites.
- Confirm architecture supports many clients.
- Confirm no browser-exposed secrets.
- Confirm public website integration can work without rebuilds.

### Acceptance Criteria

- Stack is approved.
- Data model draft is approved.
- Security model is approved.
- Deployment target is approved.
- First pilot site decision is approved.
- Public content contract is approved for the pilot integration.
- No app features are implemented.

### Stopping Point Before Next Phase

Stop after planning approval. Do not scaffold React until the architecture and schema direction are accepted.

---

## Phase 2: Supabase Database Foundation

### Goal

Design and create the database and RLS foundation.

### What Will Be Built

- Supabase migrations.
- Seed data.
- Row-level security policies.
- Core tenant tables and relationships.

### What Will Not Be Built Yet

- No frontend shell.
- No login/auth logic.
- No CRUD UI.
- No media uploads.
- No analytics UI.
- No public website integration.

### Tables To Include

- `profiles`
- `clients`
- `sites`
- `site_assignments`
- `media_assets`
- `gallery_sections`
- `gallery_items`
- `analytics_mappings`
- `audit_logs`

Possible later tables:

- `content_blocks`
- `testimonials`
- `news_posts`
- `team_members`
- `service_items`

### Access Model

- Admin can read and write all rows.
- Client users can read assigned client/site records.
- Client users can write only allowed records for assigned sites.
- Public read access should only expose published content through controlled views or API endpoints.

### Files/Folders Likely Involved

```txt
supabase/migrations/*.sql
supabase/seed.sql
docs/data-model.md
src/lib/supabase.ts
```

### Dependencies

- Supabase project.
- Supabase CLI if local migrations are used.
- Approved schema.

### Testing Checklist

- Migrations apply cleanly.
- Seed data loads.
- RLS blocks unauthorized rows.
- Admin can access all rows.
- Client A cannot read, insert, update, or delete Client B rows through direct queries.
- Anonymous access is denied to tenant-scoped tables.
- Public users cannot access private dashboard tables.

### Acceptance Criteria

- Core tables exist.
- RLS policies are enabled and verified with negative cross-access tests.
- Seed admin/client/site data exists.
- Data model supports multi-client and multi-site access.

### Stopping Point Before Next Phase

Stop when schema and RLS are verified. Do not build auth UI until access rules are proven.

---

## Phase 3: Authentication and Access Control

### Goal

Allow secure login and role-based dashboard access.

### What Will Be Built

- Supabase Auth setup.
- Login page.
- Logout flow.
- Protected routes.
- Session persistence.
- Admin role handling.
- Client role handling.
- Access-aware navigation.
- No public signup.
- Admin-created client account workflow, possibly manual at first.

### What Will Not Be Built Yet

- No client/site CRUD UI beyond what is required to test access.
- No media library.
- No gallery manager.
- No analytics.

### Files/Folders Likely Involved

```txt
src/features/auth/
src/routes/LoginPage.tsx
src/components/auth/ProtectedRoute.tsx
src/lib/supabase.ts
src/lib/session.ts
src/lib/permissions.ts
```

### Dependencies

- Phase 2 schema and RLS.
- Supabase Auth configuration.
- Email templates/domain decision if using invite/password reset emails.

### Testing Checklist

- Admin login works.
- Client login works.
- Logout works.
- Unauthenticated users are redirected to login.
- Client cannot access admin-only routes.
- Client cannot access unassigned site data.
- Public signup is disabled or unavailable.
- Admin-created account or invite flow can create a usable client login.

### Acceptance Criteria

- Only authenticated users can access dashboard pages.
- Role-based route protection works.
- Client users only see assigned sites.
- Admin users can see all sites.
- Public signup remains disabled.
- Admin-created client account provisioning is verified.

### Stopping Point Before Next Phase

Stop when login and permissions are reliable. Do not add client/site management until access control is stable.

---

## Phase 4: Frontend Shell and Role-Based Routing

### Goal

Build the visual dashboard foundation around authenticated access.

### What Will Be Built

- React/Vite app setup.
- Tailwind setup.
- Base routing.
- Dashboard layout.
- Sidebar.
- Topbar.
- Placeholder pages.
- Responsive structure.
- ThisUncle branding.
- Role-aware navigation and route guards.
- Empty states and placeholder navigation.

### What Will Not Be Built Yet

- No CRUD features.
- No media uploads.
- No analytics data.
- No public API.

### Files/Folders Likely Involved

```txt
package.json
vite.config.ts
tailwind.config.ts
postcss.config.js
index.html
src/main.tsx
src/app/App.tsx
src/app/router.tsx
src/styles/index.css
src/components/layout/AppLayout.tsx
src/components/layout/Sidebar.tsx
src/components/layout/Topbar.tsx
src/routes/*.tsx
```

### Dependencies

- Phase 3 auth and role data.
- Node/npm available locally.
- React, Vite, Tailwind.
- Routing library, likely `react-router-dom`.
- Icon library, likely `lucide-react`.

### Testing Checklist

- App installs cleanly.
- App runs locally.
- App builds successfully.
- Routes navigate correctly.
- Role-aware routing sends admin and client users to the correct landing pages.
- Sidebar/topbar work on desktop.
- Mobile navigation works.
- No backend CRUD calls are made.

### Acceptance Criteria

- `npm run dev` serves the dashboard shell.
- `npm run build` succeeds.
- All placeholder pages are reachable.
- Layout is responsive.
- Visual direction matches ThisUncle brand.
- Route guards respect user role and assignment state.

### Stopping Point Before Next Phase

Stop when the static frontend shell is usable and reviewed. Do not add management features yet.

---

## Phase 5: Admin Client/Site Management

### Goal

Allow ThisUncle admins to manage clients and their websites.

### What Will Be Built

- Admin clients list.
- Create/edit client.
- Sites/projects list.
- Create/edit site/project.
- Assign clients/users to one or more sites.
- Site status fields.
- Basic site metadata:
  - name
  - slug
  - domain
  - description
  - integration type
  - status
- Client-facing sites list.

### What Will Not Be Built Yet

- No media upload.
- No gallery item editing.
- No analytics integration.
- No website integration script.

### Files/Folders Likely Involved

```txt
src/features/clients/
src/features/sites/
src/routes/ClientsPage.tsx
src/routes/SitesPage.tsx
src/routes/SiteDetailPage.tsx
src/components/forms/
src/lib/queries/
```

### Dependencies

- Auth and role checks.
- Supabase schema.
- RLS policies.

### Testing Checklist

- Admin can create client.
- Admin can edit client.
- Admin can create site.
- Admin can assign a client/user to a site.
- Client sees assigned site.
- Client does not see unassigned site.
- Validation blocks incomplete records.

### Acceptance Criteria

- Admin can manage client/site records.
- Client site access reflects assignments.
- Navigation and site detail pages are permission-aware.

### Stopping Point Before Next Phase

Stop when client/site ownership is working. Do not start media upload until tenant boundaries are confirmed.

---

## Phase 6: Cloudinary Media Library

### Goal

Allow image/video management.

### What Will Be Built

- Secure Cloudinary upload flow.
- Netlify Function or equivalent signed upload endpoint.
- Media metadata saved in Supabase.
- Media library UI.
- Image/video preview.
- Edit title, alt text, caption.
- Delete/archive media.
- Filter by site/project/type/status.
- Upload progress and error states.

### What Will Not Be Built Yet

- No gallery section management.
- No public website rendering.
- No bulk transformations beyond basic Cloudinary usage.

### Files/Folders Likely Involved

```txt
netlify/functions/cloudinary-signature.ts
src/features/media/
src/routes/MediaLibraryPage.tsx
src/components/media/MediaUploader.tsx
src/components/media/MediaGrid.tsx
src/components/media/MediaDetailPanel.tsx
src/lib/cloudinary.ts
```

### Dependencies

- Cloudinary account.
- Cloudinary upload preset/folder strategy.
- Supabase `media_assets` table.
- Netlify Functions for secret-backed signing.

### Testing Checklist

- Upload image.
- Upload video.
- Metadata saved to Supabase.
- Preview renders.
- Edit metadata.
- Archive/delete media.
- Client cannot see another client's media.
- Signed upload requests are rejected when the site/client context does not match the authenticated user.
- Tampered folder, site, or signature parameters are rejected.
- Expired or unsigned upload attempts are rejected.
- Invalid file types are rejected.
- Oversized files are handled cleanly.

### Acceptance Criteria

- Media can be uploaded securely.
- Upload signing is validated server-side against the authenticated user and assigned site.
- Cloudinary folder/tenant scoping is enforced.
- Media records are tied to the correct site.
- Client access is isolated.
- Cloudinary secrets are not exposed in browser code.

### Stopping Point Before Next Phase

Stop when media upload and library management are stable. Do not build galleries until media records are reliable.

---

## Phase 7: Gallery and Portfolio Manager

### Goal

Allow clients to manage website gallery/portfolio sections.

### What Will Be Built

- Create/manage gallery sections.
- Assign media to sections.
- Reorder items.
- Publish/unpublish sections and items.
- Replace media.
- Captions and alt text.
- Section metadata:
  - title
  - slug
  - description
  - layout type
  - sort order
  - status
- Portfolio/project content where needed:
  - title
  - category
  - client/location/year/status
  - summary
  - full description
  - cover media
  - gallery media

### What Will Not Be Built Yet

- No public website API unless required for internal preview.
- No analytics.
- No full text CMS.

### Files/Folders Likely Involved

```txt
src/features/galleries/
src/features/portfolio/
src/routes/GalleriesPage.tsx
src/routes/GalleryDetailPage.tsx
src/components/galleries/GalleryBuilder.tsx
src/components/galleries/ReorderableMediaList.tsx
```

### Dependencies

- Media library.
- Supabase gallery tables.
- Drag/reorder library if needed.

### Testing Checklist

- Create gallery section.
- Add media to section.
- Reorder media.
- Publish/unpublish item.
- Replace media.
- Edit alt/caption.
- Client cannot edit another client's gallery.

### Acceptance Criteria

- Clients can manage assigned site galleries.
- Published/unpublished state is respected in queries.
- Gallery content is ready for website consumption.

### Stopping Point Before Next Phase

Stop when gallery/portfolio data is manageable inside the dashboard. Do not integrate websites until published data contracts are stable.

---

## Phase 8: Public Website Integration Layer

### Goal

Allow client websites to fetch published content dynamically.

### What Will Be Built

- Public API or safe read endpoint.
- Published-only content responses.
- `cms.js` integration pattern.
- Static fallback strategy.
- Example integration for one pilot site.
- No full website rewrite.

### Preferred Pattern

Each website keeps its static HTML as fallback. A small integration script fetches published content and replaces targeted containers only when the API succeeds.

Example containers:

- `#gallery-container`
- `#portfolio-container`
- `#testimonials-container`
- `#media-section-{slug}`

### What Will Not Be Built Yet

- No global rewrite of all websites.
- No editing of every content section.
- No custom analytics tracking.

### Files/Folders Likely Involved

```txt
src/lib/public-content.ts
netlify/functions/public-content.ts
public/cms.js
docs/website-integration.md
```

Pilot website files may be touched only in the selected pilot site, after explicit approval.

### Dependencies

- Published gallery/portfolio data.
- Public-safe data contract.
- CORS/domain strategy.
- Pilot website selection.

### Testing Checklist

- Website loads static fallback if API fails.
- Website loads dynamic content if API succeeds.
- Only published content appears.
- Client update appears without rebuild.
- API does not expose private draft/media records.
- Response schema includes an explicit version and the documented required fields.
- Works on mobile and desktop.

### Acceptance Criteria

- One pilot site successfully consumes dashboard content.
- Static fallback remains intact.
- No full website rewrite is required.
- Public responses use a versioned schema contract that is documented and stable for V1 consumers.

### Stopping Point Before Next Phase

Stop after one pilot integration proves the pattern. Do not roll out to all sites until pilot stability is confirmed.

---

## Phase 9: Analytics Integration

### Goal

Show website traffic data inside the client dashboard.

### Recommended Provider

Umami.

### What Will Be Built

- Store `analytics_provider`.
- Store `analytics_site_id`.
- Store analytics API configuration server-side.
- Fetch analytics per site.
- Show:
  - total visitors
  - page views
  - unique visitors
  - top pages
  - referrers/sources
  - devices/browsers where practical
  - recent visitor activity where available
  - date range filtering
- Admin can view all site analytics.
- Client can view only assigned site analytics.

### What Will Not Be Built Yet

- No fully custom analytics system.
- No raw event warehouse unless required later.
- No complex attribution modeling.

### Files/Folders Likely Involved

```txt
netlify/functions/analytics-summary.ts
src/features/analytics/
src/routes/AnalyticsPage.tsx
src/components/analytics/
src/lib/analytics.ts
```

### Dependencies

- Umami account or self-hosted Umami instance.
- Umami site IDs for each website.
- Tracker scripts installed on websites.
- Supabase `analytics_mappings` table.

### Testing Checklist

- Admin sees analytics for all sites.
- Client sees analytics only for assigned sites.
- Client cannot change a site ID or other request parameter to query another site's analytics.
- Analytics endpoint rejects requests before calling the provider when site assignment is invalid.
- Date filter changes results.
- Empty/new sites show useful empty state.
- API errors show recoverable UI.
- Analytics API keys are not exposed to browser.

### Acceptance Criteria

- Dashboard displays usable traffic summaries per site.
- Access control matches site assignments.
- Analytics requests are validated server-side before any provider query is made.
- Analytics fetches are cached or rate-limit aware.

### Stopping Point Before Next Phase

Stop after analytics summaries work for at least one pilot site. Do not build custom tracking unless provider limitations are proven.

---

## Phase 10: Deployment and Production Setup

### Goal

Deploy the dashboard safely.

### What Will Be Built

- Netlify deployment setup.
- Production environment variables.
- Supabase production project configuration.
- Cloudinary production config.
- Umami production config.
- Domain/subdomain setup.
- Deployment checklist.
- Basic monitoring/log review process.

### What Will Not Be Built Yet

- No new CMS features.
- No extra client integrations beyond approved pilot.

### Files/Folders Likely Involved

```txt
netlify.toml
docs/deployment.md
docs/environment.md
```

### Dependencies

- Netlify site.
- Supabase production project.
- Cloudinary production account/config.
- Umami site/API config.
- DNS access.

### Testing Checklist

- Production build succeeds.
- Preview and staging deployments pass smoke checks before production promotion.
- Preview/staging env vars are present and wired correctly.
- Netlify env vars are present.
- Login works in production.
- Supabase RLS works in production.
- Cloudinary upload works in production.
- Analytics fetch works in production.
- Pilot website integration works against production.
- Pilot website integration also works against staging/preview deployments.

### Acceptance Criteria

- Dashboard is reachable on production URL.
- Admin and client logins work.
- Core features survive refresh and deployment.
- No secrets are exposed in frontend bundle.
- Staging/preview validation is part of the release process.

### Stopping Point Before Next Phase

Stop after production setup is stable. Do not broaden rollout until QA hardening is complete.

---

## Phase 11: Hardening and QA

### Goal

Make version 1 stable.

### What Will Be Built

- Error handling improvements.
- Loading states.
- Form validation.
- Empty states.
- Access control tests.
- RLS testing checklist.
- Upload size/type limits.
- Audit logs for important actions.
- Documentation.
- Backup/export notes.
- Basic performance review.

### What Will Not Be Built Yet

- No major new CMS feature families.
- No multi-language support.
- No scheduled publishing unless already essential.

### Files/Folders Likely Involved

```txt
src/components/ui/
src/lib/errors.ts
src/lib/validation.ts
docs/qa-checklist.md
docs/backup-export.md
```

### Dependencies

- Production-like data.
- At least one admin test account.
- At least one client test account.
- At least one pilot site.

### Testing Checklist

- Security regression checklist is repeatable in staging/preview and passes before release.
- Admin cannot accidentally expose private draft content.
- Client cannot access another client's records.
- Upload limits are enforced.
- Invalid forms cannot submit.
- Network failures are handled.
- Public API only returns published content.
- Browser/mobile layout checks pass.
- Audit logs capture important actions.

### Acceptance Criteria

- Version 1 is stable enough for controlled client use.
- Known risks are documented.
- Recovery/backup notes exist.
- Access control is verified end to end.
- Security regression testing is repeatable and documented.

### Stopping Point Before Next Phase

Stop after version 1 is stable. Future CMS features should be planned separately and added incrementally.

---

## Phase 12: Future CMS Features

### Goal

Plan features after media management works.

### What May Be Built Later

- Text content editing.
- Services editing.
- Testimonials.
- Blog/news posts.
- Team members.
- SEO fields.
- Approvals.
- Scheduled publishing.
- Multi-language support.
- Client activity reports.
- Website health checks.
- Content version history.
- Rollback support.
- Bulk import/export.

### What Should Not Be Built Prematurely

- Full universal page builder.
- Complex workflow engine.
- Custom analytics warehouse.
- Full design editor.
- Website hosting/deployment automation for every client.

### Files/Folders Likely Involved

```txt
src/features/content-blocks/
src/features/testimonials/
src/features/news/
src/features/team/
src/features/seo/
supabase/migrations/
docs/cms-roadmap.md
```

### Dependencies

- Stable media and gallery system.
- Stable public website integration layer.
- Real client feedback from version 1 usage.

### Testing Checklist

- New content types follow existing permissions.
- Public API exposes only published content.
- Existing websites are not broken.
- Client workflows remain simple.

### Acceptance Criteria

- Future features are added only when they solve observed client needs.
- Core media/gallery workflow remains fast and reliable.
- Platform remains reusable across clients.

### Stopping Point

Each future feature should have its own scoped implementation plan before code changes begin.

---

## Recommended First Implementation Sequence

1. Approve this roadmap.
2. Complete Phase 1 planning documents.
3. Build Phase 2 Supabase database foundation.
4. Add Phase 3 authentication and access control.
5. Build Phase 4 frontend shell and role-based routing.
6. Add Phase 5 client/site management.
7. Add Phase 6 media library.
8. Add Phase 7 gallery/portfolio manager.
9. Prove Phase 8 with one pilot website.
10. Add Phase 9 analytics.
11. Complete Phase 10 deployment and production setup.
12. Complete Phase 11 hardening and QA.
13. Plan Phase 12 future CMS features separately.

## Current Repository State

This folder is currently documentation-only. No frontend, backend, database, or integration code should exist until the relevant implementation phase begins.
