-- Allow the anon role to read published/active content for the public site-content API.

grant select on public.sites             to anon;
grant select on public.gallery_sections  to anon;
grant select on public.gallery_items     to anon;
grant select on public.media_assets      to anon;

-- sites: anon can read active sites (needed to resolve slug → id)
create policy "sites: anon read active"
  on public.sites for select
  to anon
  using (status = 'active');

-- gallery_sections: anon can read published sections
create policy "gallery_sections: anon read published"
  on public.gallery_sections for select
  to anon
  using (status = 'published');

-- gallery_items: anon can read published items
create policy "gallery_items: anon read published"
  on public.gallery_items for select
  to anon
  using (status = 'published');

-- media_assets: anon can read active assets
create policy "media_assets: anon read active"
  on public.media_assets for select
  to anon
  using (status = 'active');
