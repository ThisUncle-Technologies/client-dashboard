-- ============================================================
-- Migration 001: Initial Schema
-- Client Dashboard by ThisUncle Technologies
-- ============================================================

-- ============================================================
-- HELPER: updated_at trigger
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- PROFILES
-- Extends auth.users with role and display info.
-- Auto-created when a user signs up via Supabase Auth.
-- ============================================================

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'client' check (role in ('admin', 'client')),
  full_name   text,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-create a profile when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- CLIENTS
-- Client organisations managed by ThisUncle.
-- ============================================================

create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  contact_email   text,
  contact_phone   text,
  notes           text,
  status          text not null default 'active' check (status in ('active', 'inactive')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger clients_updated_at
  before update on public.clients
  for each row execute function public.handle_updated_at();


-- ============================================================
-- SITES
-- Websites owned by a client and managed through the dashboard.
-- ============================================================

create table public.sites (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  name              text not null,
  slug              text not null unique,
  domain            text,
  description       text,
  integration_type  text not null default 'static' check (integration_type in ('static', 'dynamic')),
  status            text not null default 'active' check (status in ('active', 'inactive', 'maintenance')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger sites_updated_at
  before update on public.sites
  for each row execute function public.handle_updated_at();


-- ============================================================
-- SITE ASSIGNMENTS
-- Links a profile (user) to one or more sites.
-- ============================================================

create table public.site_assignments (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  site_id     uuid not null references public.sites(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (profile_id, site_id)
);


-- ============================================================
-- MEDIA ASSETS
-- Cloudinary media metadata stored per site.
-- ============================================================

create table public.media_assets (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references public.sites(id) on delete cascade,
  cloudinary_id   text not null,
  url             text not null,
  type            text not null check (type in ('image', 'video')),
  title           text,
  alt_text        text,
  caption         text,
  status          text not null default 'active' check (status in ('active', 'archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger media_assets_updated_at
  before update on public.media_assets
  for each row execute function public.handle_updated_at();


-- ============================================================
-- GALLERY SECTIONS
-- Groupings of media within a site (e.g. "Residential Projects").
-- ============================================================

create table public.gallery_sections (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid not null references public.sites(id) on delete cascade,
  title        text not null,
  slug         text not null,
  description  text,
  layout_type  text not null default 'grid',
  sort_order   int not null default 0,
  status       text not null default 'draft' check (status in ('published', 'draft')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (site_id, slug)
);

create trigger gallery_sections_updated_at
  before update on public.gallery_sections
  for each row execute function public.handle_updated_at();


-- ============================================================
-- GALLERY ITEMS
-- Individual media items within a gallery section.
-- ============================================================

create table public.gallery_items (
  id               uuid primary key default gen_random_uuid(),
  section_id       uuid not null references public.gallery_sections(id) on delete cascade,
  media_asset_id   uuid references public.media_assets(id) on delete set null,
  sort_order       int not null default 0,
  status           text not null default 'draft' check (status in ('published', 'draft')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger gallery_items_updated_at
  before update on public.gallery_items
  for each row execute function public.handle_updated_at();


-- ============================================================
-- ANALYTICS MAPPINGS
-- Maps each site to its analytics provider and site ID.
-- ============================================================

create table public.analytics_mappings (
  id                uuid primary key default gen_random_uuid(),
  site_id           uuid not null unique references public.sites(id) on delete cascade,
  provider          text not null default 'umami',
  provider_site_id  text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger analytics_mappings_updated_at
  before update on public.analytics_mappings
  for each row execute function public.handle_updated_at();


-- ============================================================
-- AUDIT LOGS
-- Tracks important admin and client actions.
-- ============================================================

create table public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references public.profiles(id) on delete set null,
  action       text not null,
  entity_type  text,
  entity_id    uuid,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.clients           enable row level security;
alter table public.sites             enable row level security;
alter table public.site_assignments  enable row level security;
alter table public.media_assets      enable row level security;
alter table public.gallery_sections  enable row level security;
alter table public.gallery_items     enable row level security;
alter table public.analytics_mappings enable row level security;
alter table public.audit_logs        enable row level security;


-- Helper: check if the current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: check if the current user is assigned to a site
create or replace function public.is_assigned_to_site(p_site_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.site_assignments
    where profile_id = auth.uid() and site_id = p_site_id
  );
$$;


-- profiles: users can read their own; admin can read all
create policy "profiles: own read"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles: own update"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

create policy "profiles: admin insert"
  on public.profiles for insert
  with check (public.is_admin());

-- clients: admin full access; clients cannot access this table directly
create policy "clients: admin all"
  on public.clients for all
  using (public.is_admin());

-- sites: admin full access; clients can read assigned sites
create policy "sites: admin all"
  on public.sites for all
  using (public.is_admin());

create policy "sites: client read assigned"
  on public.sites for select
  using (public.is_assigned_to_site(id));

-- site_assignments: admin full access; clients can read their own assignments
create policy "site_assignments: admin all"
  on public.site_assignments for all
  using (public.is_admin());

create policy "site_assignments: client read own"
  on public.site_assignments for select
  using (profile_id = auth.uid());

-- media_assets: admin full access; clients can manage media for assigned sites
create policy "media_assets: admin all"
  on public.media_assets for all
  using (public.is_admin());

create policy "media_assets: client read assigned"
  on public.media_assets for select
  using (public.is_assigned_to_site(site_id));

create policy "media_assets: client insert assigned"
  on public.media_assets for insert
  with check (public.is_assigned_to_site(site_id));

create policy "media_assets: client update assigned"
  on public.media_assets for update
  using (public.is_assigned_to_site(site_id));

-- gallery_sections: admin full access; clients can manage sections for assigned sites
create policy "gallery_sections: admin all"
  on public.gallery_sections for all
  using (public.is_admin());

create policy "gallery_sections: client read assigned"
  on public.gallery_sections for select
  using (public.is_assigned_to_site(site_id));

create policy "gallery_sections: client insert assigned"
  on public.gallery_sections for insert
  with check (public.is_assigned_to_site(site_id));

create policy "gallery_sections: client update assigned"
  on public.gallery_sections for update
  using (public.is_assigned_to_site(site_id));

-- gallery_items: scoped through section → site
create policy "gallery_items: admin all"
  on public.gallery_items for all
  using (public.is_admin());

create policy "gallery_items: client read assigned"
  on public.gallery_items for select
  using (
    exists (
      select 1 from public.gallery_sections gs
      where gs.id = section_id
      and public.is_assigned_to_site(gs.site_id)
    )
  );

create policy "gallery_items: client insert assigned"
  on public.gallery_items for insert
  with check (
    exists (
      select 1 from public.gallery_sections gs
      where gs.id = section_id
      and public.is_assigned_to_site(gs.site_id)
    )
  );

create policy "gallery_items: client update assigned"
  on public.gallery_items for update
  using (
    exists (
      select 1 from public.gallery_sections gs
      where gs.id = section_id
      and public.is_assigned_to_site(gs.site_id)
    )
  );

-- analytics_mappings: admin only
create policy "analytics_mappings: admin all"
  on public.analytics_mappings for all
  using (public.is_admin());

create policy "analytics_mappings: client read assigned"
  on public.analytics_mappings for select
  using (public.is_assigned_to_site(site_id));

-- audit_logs: admin can read all; users can read their own
create policy "audit_logs: admin all"
  on public.audit_logs for all
  using (public.is_admin());

create policy "audit_logs: client read own"
  on public.audit_logs for select
  using (profile_id = auth.uid());
