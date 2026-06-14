# Media Flow

## Purpose

Define the Cloudinary-backed media upload and management flow for V1.

## Flow Overview

1. Client or admin opens the media library.
2. Frontend requests a signed upload payload from a Netlify Function.
3. The function verifies the authenticated user and assigned site.
4. The function returns a short-lived signature and upload parameters.
5. The browser uploads directly to Cloudinary.
6. The frontend stores the resulting asset metadata in Supabase.

## Security Rules

- Upload signatures are generated server-side only.
- The requested site must match the authenticated user's assignment.
- Cloudinary folder names must be tenant-scoped.
- File type, file size, and upload count limits are enforced.
- Unsigned or expired requests must fail.

## Metadata Plan

- Store Cloudinary public ID, URL, asset type, size, and tenant ownership in Supabase.
- Track alt text, title, caption, and archive status separately from the raw Cloudinary asset.
- Keep media tied to one owning site and client.

## Testing and Acceptance Criteria

- Valid uploads succeed for assigned sites only.
- Invalid file types and oversized files are rejected.
- Tampered or mismatched tenant context fails before upload.
- Upload secrets never reach browser code.
- Media records are stored with the correct tenant ownership.

## Unresolved Decisions

- Whether the upload flow supports image and video in the same UI at V1 or stages them separately.
