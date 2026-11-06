import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { Site, Collaborateur, Avis } from './types';

export const FALLBACK_SITES: Site[] = [
  { id: '11111111-1111-1111-1111-111111111111', slug: 'annecy-siege', nom: 'Blue 2.0 - Annecy (Siège - Seynod)', actif: true, created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222222', slug: 'leman-annemasse-thonon', nom: 'Blue 2.0 - Léman (Annemasse / Thonon / Juvigny)', actif: true, created_at: new Date().toISOString() },
  { id: '33333333-3333-3333-3333-333333333333', slug: 'lyon-rhone', nom: 'Blue 2.0 - Lyon (Rhône)', actif: true, created_at: new Date().toISOString() },
  { id: '44444444-4444-4444-4444-444444444444', slug: 'clermont-ferrand', nom: 'Blue 2.0 - Clermont-Ferrand (Beaumont)', actif: true, created_at: new Date().toISOString() },
  { id: '55555555-5555-5555-5555-555555555555', slug: 'ile-de-france', nom: 'Blue 2.0 - Île-de-France (Fontainebleau / Melun / Sainte-Geneviève)', actif: true, created_at: new Date().toISOString() },
  { id: '66666666-6666-6666-6666-666666666666', slug: 'saint-die-vosges', nom: 'Blue 2.0 - Saint-Dié-des-Vosges', actif: true, created_at: new Date().toISOString() },
  { id: '77777777-7777-7777-7777-777777777777', slug: 'colmar-reflets-deau', nom: 'Reflets d\'eau Colmar (by Blue 2.0)', actif: true, created_at: new Date().toISOString() },
  { id: '88888888-8888-8888-8888-888888888888', slug: 'toulouse-occitanie', nom: 'Blue 2.0 - Toulouse (Haute-Garonne)', actif: true, created_at: new Date().toISOString() },
];

export const FALLBACK_COLLABORATEURS: Collaborateur[] = [
  // Annecy
  { id: 'a1111111-1111-1111-1111-111111111111', site_id: '11111111-1111-1111-1111-111111111111', nom: 'Florian Diana', role: 'Direction & Conseil Expert Piscines', actif: true, created_at: new Date().toISOString() },
  { id: 'a1111111-1111-1111-1111-111111111112', site_id: '11111111-1111-1111-1111-111111111111', nom: 'Camille Roux', role: 'Conductrice de Travaux', actif: true, created_at: new Date().toISOString() },
  { id: 'a1111111-1111-1111-1111-111111111113', site_id: '11111111-1111-1111-1111-111111111111', nom: 'Thomas Girard', role: 'Technicien Pose & Finitions', actif: true, created_at: new Date().toISOString() },

  // Léman
  { id: 'b2222222-2222-2222-2222-222222222221', site_id: '22222222-2222-2222-2222-222222222222', nom: 'Laurent Meunier', role: 'Responsable Agence Léman', actif: true, created_at: new Date().toISOString() },
  { id: 'b2222222-2222-2222-2222-222222222222', site_id: '22222222-2222-2222-2222-222222222222', nom: 'Julien Dubois', role: 'Technicien Piscinier', actif: true, created_at: new Date().toISOString() },

  // Lyon
  { id: 'c3333333-3333-3333-3333-333333333331', site_id: '33333333-3333-3333-3333-333333333333', nom: 'Maxime Leroy', role: 'Chargé de Projets Lyon', actif: true, created_at: new Date().toISOString() },
  { id: 'c3333333-3333-3333-3333-333333333332', site_id: '33333333-3333-3333-3333-333333333333', nom: 'Élodie Moreau', role: 'Conseillère technique & Design', actif: true, created_at: new Date().toISOString() },

  // Clermont-Ferrand
  { id: 'd4444444-4444-4444-4444-444444444441', site_id: '44444444-4444-4444-4444-444444444444', nom: 'Bastien Fournier', role: 'Responsable Technique Auvergne', actif: true, created_at: new Date().toISOString() },

  // Île-de-France
  { id: 'e5555555-5555-5555-5555-555555555551', site_id: '55555555-5555-5555-5555-555555555555', nom: 'Nicolas Bonnet', role: 'Directeur de projets Île-de-France', actif: true, created_at: new Date().toISOString() },

  // Saint-Dié-des-Vosges
  { id: 'f6666666-6666-6666-6666-666666666661', site_id: '66666666-6666-6666-6666-666666666666', nom: 'Florian Durand', role: 'Chargé de Projets Vosges', actif: true, created_at: new Date().toISOString() },

  // Colmar
  { id: 'g7777777-7777-7777-7777-777777777771', site_id: '77777777-7777-7777-7777-777777777777', nom: 'Christian Weber', role: 'Responsable Reflets d\'eau Colmar', actif: true, created_at: new Date().toISOString() },

  // Toulouse
  { id: 'h8888888-8888-8888-8888-888888888881', site_id: '88888888-8888-8888-8888-888888888888', nom: 'Matthieu Garcia', role: 'Conseiller Pisciniste Toulouse', actif: true, created_at: new Date().toISOString() },
];

export const FALLBACK_AVIS: Avis[] = [
  {
    id: 'f1111111-1111-1111-1111-111111111111',
    site_id: '11111111-1111-1111-1111-111111111111',
    collaborateur_id: 'a1111111-1111-1111-1111-111111111111',
    intitule_prestation: 'Construction piscine miroir 9x4 avec volet immergé',
    note_conseil: 5,
    note_diversite: 5,
    note_proprete: 5,
    note_engagements: 5,
    note_qualite_prix: 5,
    note_recommandation: 5,
    commentaire: 'Projet de piscine réalisé dans les temps avec Florian. Conseils parfaits du devis jusqu\'à la mise en eau. Le chantier a toujours été impeccable le soir !',
    photos: [],
    nom: 'Dubois',
    prenom: 'Pierre',
    email: 'p.dubois@example.com',
    statut: 'approuve',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'f2222222-2222-2222-2222-222222222222',
    site_id: '66666666-6666-6666-6666-666666666666',
    collaborateur_id: 'f6666666-6666-6666-6666-666666666661',
    intitule_prestation: 'Rénovation liner & pose pompe à chaleur Inverter',
    note_conseil: 5,
    note_diversite: 4,
    note_proprete: 5,
    note_engagements: 5,
    note_qualite_prix: 5,
    note_recommandation: 5,
    commentaire: 'Une équipe très professionnelle et réactive. Florian a su adapter l\'équipement à notre budget sans rogner sur la qualité. Recommandé les yeux fermés !',
    photos: [],
    nom: 'Lambert',
    prenom: 'Nathalie',
    email: 'n.lambert@example.com',
    statut: 'approuve',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return Boolean(url && url.trim().length > 0);
}

let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> | null {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) return null;
  if (!cachedSql) {
    cachedSql = neon(databaseUrl);
  }
  return cachedSql;
}
