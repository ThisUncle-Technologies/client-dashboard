-- Grant API access to authenticated users for all dashboard tables.
-- Required because "Automatically expose new tables" was disabled at project creation.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles           to authenticated;
grant select, insert, update, delete on public.clients            to authenticated;
grant select, insert, update, delete on public.sites              to authenticated;
grant select, insert, update, delete on public.site_assignments   to authenticated;
grant select, insert, update, delete on public.media_assets       to authenticated;
grant select, insert, update, delete on public.gallery_sections   to authenticated;
grant select, insert, update, delete on public.gallery_items      to authenticated;
grant select, insert, update, delete on public.analytics_mappings to authenticated;
grant select, insert, update, delete on public.audit_logs         to authenticated;

-- anon role gets no access — RLS will enforce all restrictions anyway
