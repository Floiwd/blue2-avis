-- ==============================================================================
-- Données initiales (Seed) : Agences Blue 2.0 & Collaborateurs
-- ==============================================================================

-- 1. Insertion des agences Blue 2.0
insert into public.sites (id, slug, nom, actif) values
    ('11111111-1111-1111-1111-111111111111', 'lyon-centre', 'Blue 2.0 - Lyon (Siège)', true),
    ('22222222-2222-2222-2222-222222222222', 'bordeaux-aquitaine', 'Blue 2.0 - Bordeaux & Aquitaine', true),
    ('33333333-3333-3333-3333-333333333333', 'nantes-grand-ouest', 'Blue 2.0 - Nantes & Grand Ouest', true),
    ('44444444-4444-4444-4444-444444444444', 'marseille-provence', 'Blue 2.0 - Marseille Provence', true),
    ('55555555-5555-5555-5555-555555555555', 'paris-idf', 'Blue 2.0 - Paris Île-de-France', true)
on conflict (id) do nothing;

-- 2. Insertion des collaborateurs par agence
insert into public.collaborateurs (id, site_id, nom, role, actif) values
    -- Lyon
    ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Alexandre Martin', 'Conseiller Expert Piscines & Spas', true),
    ('a1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Camille Roux', 'Conductrice de Travaux', true),
    ('a1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Thomas Girard', 'Technicien Pose & Finitions', true),
    
    -- Bordeaux
    ('b2222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222', 'Sophie Bernard', 'Responsable d''agence & Conseil', true),
    ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Julien Dubois', 'Technicien Piscinier', true),
    
    -- Nantes
    ('c3333333-3333-3333-3333-333333333331', '33333333-3333-3333-3333-333333333333', 'Maxime Leroy', 'Chargé de clientèle Grand Ouest', true),
    ('c3333333-3333-3333-3333-333333333332', '33333333-3333-3333-3333-333333333333', 'Élodie Moreau', 'Conseillère technique & Design', true),

    -- Marseille
    ('d4444444-4444-4444-4444-444444444441', '44444444-4444-4444-4444-444444444444', 'Lucas Blanc', 'Responsable Technique Méditerranée', true),
    ('d4444444-4444-4444-4444-444444444442', '44444444-4444-4444-4444-444444444444', 'Sarah Faure', 'Conseillère commerciale', true),

    -- Paris
    ('e5555555-5555-5555-5555-555555555551', '55555555-5555-5555-5555-555555555555', 'Nicolas Bonnet', 'Directeur de projets Île-de-France', true),
    ('e5555555-5555-5555-5555-555555555552', '55555555-5555-5555-5555-555555555555', 'Claire Petit', 'Architecte paysagiste & conseil', true)
on conflict (id) do nothing;

-- 3. Exemples d'avis clients réalistes avec notes 5/5
insert into public.avis (
    id, site_id, collaborateur_id,
    note_conseil, note_diversite, note_proprete, note_engagements, note_qualite_prix, note_recommandation,
    commentaire, nom, prenom, email, statut
) values
    (
        'f1111111-1111-1111-1111-111111111111',
        '11111111-1111-1111-1111-111111111111',
        'a1111111-1111-1111-1111-111111111111',
        5, 5, 5, 5, 4, 5,
        'Projet de piscine réalisé dans les temps avec Alexandre. Conseils parfaits du devis jusqu''à la mise en eau. Le chantier a toujours été impeccable le soir !',
        'Dubois', 'Pierre', 'p.dubois@example.com', 'approuve'
    ),
    (
        'f2222222-2222-2222-2222-222222222222',
        '22222222-2222-2222-2222-222222222222',
        'b2222222-2222-2222-2222-222222222221',
        5, 4, 5, 5, 5, 5,
        'Une équipe très professionnelle et réactive. Sophie a su adapter l''équipement à notre budget sans rogner sur la qualité. Recommandé les yeux fermés !',
        'Lambert', 'Nathalie', 'nathalie.l@example.com', 'approuve'
    )
on conflict (id) do nothing;
