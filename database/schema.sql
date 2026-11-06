-- ==============================================================================
-- Schema Neon PostgreSQL : Formulaire avis Blue 2.0
-- Zero perte de donnees : suppression logique (deleted_at), cles etrangeres ON DELETE RESTRICT
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table des agences / concessions Blue 2.0
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(120) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);
CREATE INDEX IF NOT EXISTS idx_sites_actif ON sites(actif) WHERE deleted_at IS NULL;

-- 2. Table des collaborateurs par agence
CREATE TABLE IF NOT EXISTS collaborateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    nom VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_collabs_site ON collaborateurs(site_id) WHERE deleted_at IS NULL;

-- 3. Table des avis clients
CREATE TABLE IF NOT EXISTS avis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    collaborateur_id UUID NOT NULL REFERENCES collaborateurs(id) ON DELETE RESTRICT,
    intitule_prestation VARCHAR(120),
    note_conseil SMALLINT NOT NULL CHECK (note_conseil BETWEEN 1 AND 5),
    note_diversite SMALLINT NOT NULL CHECK (note_diversite BETWEEN 1 AND 5),
    note_proprete SMALLINT NOT NULL CHECK (note_proprete BETWEEN 1 AND 5),
    note_engagements SMALLINT NOT NULL CHECK (note_engagements BETWEEN 1 AND 5),
    note_qualite_prix SMALLINT NOT NULL CHECK (note_qualite_prix BETWEEN 1 AND 5),
    note_recommandation SMALLINT NOT NULL CHECK (note_recommandation BETWEEN 1 AND 5),
    commentaire TEXT,
    photos JSONB NOT NULL DEFAULT '[]'::jsonb,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telephone VARCHAR(50),
    societe VARCHAR(255),
    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuve', 'masque')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_avis_site_statut ON avis(site_id, statut, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_avis_statut ON avis(statut, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_avis_collaborateur ON avis(collaborateur_id) WHERE deleted_at IS NULL;
