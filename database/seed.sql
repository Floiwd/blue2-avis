-- ==============================================================================
-- Seed Neon PostgreSQL : Agences et Collaborateurs officiels Blue 2.0
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

-- 2. Collaborateurs
INSERT INTO collaborateurs (id, site_id, nom, role, actif) VALUES
    -- Annecy
    ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Florian Diana', 'Direction & Conseil Expert Piscines', true),
    ('a1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Camille Roux', 'Conductrice de Travaux', true),
    ('a1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Thomas Girard', 'Technicien Pose & Finitions', true),

    -- Léman
    ('b2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Laurent Meunier', 'Responsable Agence Léman', true),
    ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Julien Dubois', 'Technicien Piscinier', true),

    -- Lyon
    ('c3333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'Maxime Leroy', 'Chargé de Projets Lyon', true),
    ('c3333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'Élodie Moreau', 'Conseillère technique & Design', true),

    -- Clermont-Ferrand
    ('d4444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444444', 'Bastien Fournier', 'Responsable Technique Auvergne', true),

    -- Île-de-France
    ('e5555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555555', 'Nicolas Bonnet', 'Directeur de projets Île-de-France', true),

    -- Saint-Dié-des-Vosges
    ('f6666666-6666-6666-6666-666666666661', '66666666-6666-6666-6666-666666666666', 'Florian Durand', 'Chargé de Projets Vosges', true),

    -- Colmar
    ('g7777777-7777-7777-7777-777777777771', '77777777-7777-7777-7777-777777777777', 'Christian Weber', 'Responsable Reflets d''eau Colmar', true),

    -- Toulouse
    ('h8888888-8888-8888-8888-888888888881', '88888888-8888-8888-8888-888888888888', 'Matthieu Garcia', 'Conseiller Pisciniste Toulouse', true)
ON CONFLICT (id) DO UPDATE
SET nom = EXCLUDED.nom, role = EXCLUDED.role, actif = EXCLUDED.actif;

-- 3. Exemples d'avis initiaux approuvés
INSERT INTO avis (
    id, site_id, collaborateur_id, intitule_prestation,
    note_conseil, note_diversite, note_proprete, note_engagements, note_qualite_prix, note_recommandation,
    commentaire, photos, nom, prenom, email, statut, created_at
) VALUES
(
    'f1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Construction piscine miroir 9x4 avec volet immergé',
    5, 5, 5, 5, 5, 5,
    'Projet de piscine réalisé dans les temps avec Florian. Conseils parfaits du devis jusqu''à la mise en eau. Le chantier a toujours été impeccable le soir !',
    '[]'::jsonb,
    'Dubois', 'Pierre', 'p.dubois@example.com', 'approuve',
    NOW() - INTERVAL '2 days'
),
(
    'f2222222-2222-2222-2222-222222222222',
    '66666666-6666-6666-6666-666666666666',
    'f6666666-6666-6666-6666-666666666661',
    'Rénovation liner & pose pompe à chaleur Inverter',
    5, 4, 5, 5, 5, 5,
    'Une équipe très professionnelle et réactive. Florian a su adapter l''équipement à notre budget sans rogner sur la qualité. Recommandé les yeux fermés !',
    '[]'::jsonb,
    'Lambert', 'Nathalie', 'n.lambert@example.com', 'approuve',
    NOW() - INTERVAL '5 days'
)
ON CONFLICT (id) DO NOTHING;
