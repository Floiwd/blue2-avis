-- ==============================================================================
-- Seed Neon PostgreSQL : Agences et Collaborateurs Blue 2.0
-- ==============================================================================

-- 1. Sites / Concessions Blue 2.0
INSERT INTO sites (id, slug, nom, actif) VALUES
    ('11111111-1111-1111-1111-111111111111', 'annecy-siege', 'Blue 2.0 - Annecy (Siège - Seynod)', true),
    ('22222222-2222-2222-2222-222222222222', 'leman-annemasse-thonon', 'Blue 2.0 - Léman (Annemasse / Thonon / Juvigny)', true),
    ('33333333-3333-3333-3333-333333333333', 'lyon-rhone', 'Blue 2.0 - Lyon (Rhône)', true),
    ('44444444-4444-4444-4444-444444444444', 'clermont-ferrand', 'Blue 2.0 - Clermont-Ferrand (Beaumont)', true),
    ('55555555-5555-5555-5555-555555555555', 'ile-de-france', 'Blue 2.0 - Île-de-France (Fontainebleau / Melun / Sainte-Geneviève)', true),
    ('66666666-6666-6666-6666-666666666666', 'saint-die-vosges', 'Blue 2.0 - Saint-Dié-des-Vosges', true),
    ('77777777-7777-7777-7777-777777777777', 'colmar-reflets-deau', 'Reflets d''eau Colmar (by Blue 2.0)', true),
    ('88888888-8888-8888-8888-888888888888', 'toulouse-occitanie', 'Blue 2.0 - Toulouse (Haute-Garonne)', true)
ON CONFLICT (slug) DO UPDATE
SET nom = EXCLUDED.nom, actif = EXCLUDED.actif;

-- 2. Nettoyage et insertion des collaborateurs
DELETE FROM collaborateurs;

INSERT INTO collaborateurs (id, site_id, nom, role, actif) VALUES
    -- Saint-Dié-des-Vosges (Jérôme DURAND & Ewann Magloire-Lagreve)
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'Jérôme DURAND', 'Responsable d''agence & Conseil', true),
    (gen_random_uuid(), '66666666-6666-6666-6666-666666666666', 'Ewann Magloire-Lagreve', 'Technicien & Conducteur de travaux', true),

    -- Autres agences (Collaborateurs test)
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Test Annecy', 'Conseiller Test', true),
    (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'Test Léman', 'Conseiller Test', true),
    (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Test Lyon', 'Conseiller Test', true),
    (gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 'Test Clermont-Ferrand', 'Conseiller Test', true),
    (gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 'Test Île-de-France', 'Conseiller Test', true),
    (gen_random_uuid(), '77777777-7777-7777-7777-777777777777', 'Test Colmar', 'Conseiller Test', true),
    (gen_random_uuid(), '88888888-8888-8888-8888-888888888888', 'Test Toulouse', 'Conseiller Test', true);
