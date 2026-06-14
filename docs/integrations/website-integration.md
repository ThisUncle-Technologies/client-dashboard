# Website Integration

## Purpose

Define how client websites consume published dashboard content.

## Integration Model

- Each website stays independent.
- Static HTML remains the fallback.
- A small runtime script fetches published content only when available.
- The script replaces specific containers instead of rewriting the whole page.

## Public Contract

- Response payloads are versioned.
- Only published fields are returned.
- Drafts, private media, and internal metadata must never be exposed.
- The contract should be stable enough for the first pilot site.

## Recommended Pattern

- Use a public read endpoint or published view with minimal fields.
- Keep the runtime script small and site-specific.
- Prefer graceful failure over breaking existing page behavior.

## Testing and Acceptance Criteria

- Static content still renders when the runtime fetch fails.
- Published content loads when the fetch succeeds.
- No rebuild is required for content updates.
- The pilot site consumes the content contract without layout breakage.
- Public responses are schema-versioned and documented.

## Unresolved Decisions

- Whether the public endpoint is a Netlify Function, Supabase view, or hybrid for V1.
- Which specific pilot site will validate the first integration.
