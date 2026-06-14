# Analytics Plan

## Purpose

Define the V1 analytics integration using Umami.

## Integration Model

- Umami is the recommended V1 provider.
- Analytics data is fetched server-side only.
- The browser must never receive the Umami API key.
- Each site stores a provider mapping and provider site ID.

## Access Rules

- Admin can view analytics for all sites.
- Client can view analytics only for assigned sites.
- The server must validate assignment before contacting Umami.
- Requests with tampered site IDs must fail early.

## Metrics in Scope

- Total visitors
- Page views
- Unique visitors
- Top pages
- Referrers or sources
- Device and browser breakdowns when available
- Date range filtering

## Testing and Acceptance Criteria

- Admin sees all assigned analytics.
- Client sees only their assigned site analytics.
- Invalid site IDs are blocked server-side.
- Analytics keys remain server-side.
- Empty sites still show a useful dashboard state.

## Unresolved Decisions

- Whether the first analytics deployment uses Umami Cloud or a self-hosted instance.
