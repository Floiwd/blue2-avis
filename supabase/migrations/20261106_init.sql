-- ==============================================================================
-- Migration Blue 2.0 : Formulaire d'avis client, sites & collaborateurs
-- Zéro perte de données (clés ON DELETE RESTRICT, suppression logique deleted_at)
-- RLS activé : insertion publique d'avis, lecture contrôlée
-- ==============================================================================

-- 1. Extension pour UUID si nécessaire
create extension if not exists "uuid-ossp";

-- 2. Table des Agences / Sites Blue 2.0
create table if not exists public.sites (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    nom text not null,
    actif boolean not null default true,
    deleted_at timestamptz default null,
    created_at timestamptz not null default now()
);

create index if not exists idx_sites_slug on public.sites(slug) where deleted_at is null;
create index if not exists idx_sites_actif on public.sites(actif) where deleted_at is null;

-- 3. Table des Collaborateurs Blue 2.0
create table if not exists public.collaborateurs (
    id uuid primary key default gen_random_uuid(),
    site_id uuid not null references public.sites(id) on delete restrict,
    nom text not null,
    role text default 'Conseiller commercial / Chargé de projet',
    actif boolean not null default true,
    deleted_at timestamptz default null,
    created_at timestamptz not null default now()
);

create index if not exists idx_collaborateurs_site on public.collaborateurs(site_id) where deleted_at is null;

-- 4. Table des Avis Clients
create table if not exists public.avis (
    id uuid primary key default gen_random_uuid(),
    site_id uuid not null references public.sites(id) on delete restrict,
    collaborateur_id uuid not null references public.collaborateurs(id) on delete restrict,
    
    -- Intitulé de la prestation
    intitule_prestation text,

    -- 6 critères notés de 1 à 5 (gouttes d'eau)
    note_conseil int not null check (note_conseil between 1 and 5),
    note_diversite int not null check (note_diversite between 1 and 5),
    note_proprete int not null check (note_proprete between 1 and 5),
    note_engagements int not null check (note_engagements between 1 and 5),
    note_qualite_prix int not null check (note_qualite_prix between 1 and 5),
    note_recommandation int not null check (note_recommandation between 1 and 5),
    
    -- Contenu libre et médias
    commentaire text,
    photos text[] not null default '{}',
    
    -- Coordonnées client
    nom text not null,
    prenom text not null,
    email text,
    telephone text,
    societe text,
    
    -- Modération : 'approuve', 'en_attente', 'masque'
    statut text not null default 'approuve' check (statut in ('en_attente', 'approuve', 'masque')),
    
    -- Traçabilité & Suppression logique (Zéro perte)
    ip_hash text,
    user_agent text,
    deleted_at timestamptz default null,
    created_at timestamptz not null default now()
);

create index if not exists idx_avis_site_statut on public.avis(site_id, statut) where deleted_at is null;
create index if not exists idx_avis_collaborateur on public.avis(collaborateur_id) where deleted_at is null;
create index if not exists idx_avis_created_at on public.avis(created_at desc);

-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================
alter table public.sites enable row level security;
alter table public.collaborateurs enable row level security;
alter table public.avis enable row level security;

-- SITES : lecture publique des sites actifs
create policy "Lecture publique des sites actifs"
    on public.sites
    for select
    using (deleted_at is null and actif = true);

-- COLLABORATEURS : lecture publique des collaborateurs actifs
create policy "Lecture publique des collaborateurs actifs"
    on public.collaborateurs
    for select
    using (deleted_at is null and actif = true);

-- AVIS : insertion publique
create policy "Insertion publique des avis"
    on public.avis
    for insert
    with check (
        deleted_at is null and
        note_conseil between 1 and 5 and
        note_diversite between 1 and 5 and
        note_proprete between 1 and 5 and
        note_engagements between 1 and 5 and
        note_qualite_prix between 1 and 5 and
        note_recommandation between 1 and 5 and
        length(nom) > 0 and
        length(prenom) > 0
    );

-- BUCKET DE PHOTOS
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'avis-photos',
    'avis-photos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do update set
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "Lecture publique des photos d'avis"
    on storage.objects for select
    using (bucket_id = 'avis-photos');

create policy "Upload public des photos d'avis"
    on storage.objects for insert
    with check (bucket_id = 'avis-photos');
