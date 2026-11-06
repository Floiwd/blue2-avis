import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Site, Collaborateur, Avis } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Fallback seed data in case Supabase is not yet configured
export const FALLBACK_SITES: Site[] = [
  { id: '11111111-1111-1111-1111-111111111111', slug: 'lyon-centre', nom: 'Blue 2.0 - Lyon (Siège)', actif: true, created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222222', slug: 'bordeaux-aquitaine', nom: 'Blue 2.0 - Bordeaux & Aquitaine', actif: true, created_at: new Date().toISOString() },
  { id: '33333333-3333-3333-3333-333333333333', slug: 'nantes-grand-ouest', nom: 'Blue 2.0 - Nantes & Grand Ouest', actif: true, created_at: new Date().toISOString() },
  { id: '44444444-4444-4444-4444-444444444444', slug: 'marseille-provence', nom: 'Blue 2.0 - Marseille Provence', actif: true, created_at: new Date().toISOString() },
  { id: '55555555-5555-5555-5555-555555555555', slug: 'paris-idf', nom: 'Blue 2.0 - Paris Île-de-France', actif: true, created_at: new Date().toISOString() },
];

export const FALLBACK_COLLABORATEURS: Collaborateur[] = [
  { id: 'a1111111-1111-1111-1111-111111111111', site_id: '11111111-1111-1111-1111-111111111111', nom: 'Alexandre Martin', role: 'Conseiller Expert Piscines & Spas', actif: true, created_at: new Date().toISOString() },
  { id: 'a1111111-1111-1111-1111-111111111112', site_id: '11111111-1111-1111-1111-111111111111', nom: 'Camille Roux', role: 'Conductrice de Travaux', actif: true, created_at: new Date().toISOString() },
  { id: 'a1111111-1111-1111-1111-111111111113', site_id: '11111111-1111-1111-1111-111111111111', nom: 'Thomas Girard', role: 'Technicien Pose & Finitions', actif: true, created_at: new Date().toISOString() },
  { id: 'b2222222-2222-2222-2222-222222222221', site_id: '22222222-2222-2222-2222-222222222222', nom: 'Sophie Bernard', role: 'Responsable d\'agence & Conseil', actif: true, created_at: new Date().toISOString() },
  { id: 'b2222222-2222-2222-2222-222222222222', site_id: '22222222-2222-2222-2222-222222222222', nom: 'Julien Dubois', role: 'Technicien Piscinier', actif: true, created_at: new Date().toISOString() },
  { id: 'c3333333-3333-3333-3333-333333333331', site_id: '33333333-3333-3333-3333-333333333333', nom: 'Maxime Leroy', role: 'Chargé de clientèle Grand Ouest', actif: true, created_at: new Date().toISOString() },
  { id: 'c3333333-3333-3333-3333-333333333332', site_id: '33333333-3333-3333-3333-333333333333', nom: 'Élodie Moreau', role: 'Conseillère technique & Design', actif: true, created_at: new Date().toISOString() },
  { id: 'd4444444-4444-4444-4444-444444444441', site_id: '44444444-4444-4444-4444-444444444444', nom: 'Lucas Blanc', role: 'Responsable Technique Méditerranée', actif: true, created_at: new Date().toISOString() },
  { id: 'e5555555-5555-5555-5555-555555555551', site_id: '55555555-5555-5555-5555-555555555555', nom: 'Nicolas Bonnet', role: 'Directeur de projets Île-de-France', actif: true, created_at: new Date().toISOString() },
];

export const FALLBACK_AVIS: Avis[] = [
  {
    id: 'f1111111-1111-1111-1111-111111111111',
    site_id: '11111111-1111-1111-1111-111111111111',
    collaborateur_id: 'a1111111-1111-1111-1111-111111111111',
    note_conseil: 5,
    note_diversite: 5,
    note_proprete: 5,
    note_engagements: 5,
    note_qualite_prix: 4,
    note_recommandation: 5,
    commentaire: 'Projet de piscine réalisé dans les temps avec Alexandre. Conseils parfaits du devis jusqu\'à la mise en eau. Le chantier a toujours été impeccable le soir !',
    photos: [],
    nom: 'Dubois',
    prenom: 'Pierre',
    email: 'p.dubois@example.com',
    statut: 'approuve',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'f2222222-2222-2222-2222-222222222222',
    site_id: '22222222-2222-2222-2222-222222222222',
    collaborateur_id: 'b2222222-2222-2222-2222-222222222221',
    note_conseil: 5,
    note_diversite: 4,
    note_proprete: 5,
    note_engagements: 5,
    note_qualite_prix: 5,
    note_recommandation: 5,
    commentaire: 'Une équipe très professionnelle et réactive. Sophie a su adapter l\'équipement à notre budget sans rogner sur la qualité. Recommandé les yeux fermés !',
    photos: [],
    nom: 'Lambert',
    prenom: 'Nathalie',
    email: 'n.lambert@example.com',
    statut: 'approuve',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey));
}

let publicClient: SupabaseClient | null = null;
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!publicClient) {
    publicClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return publicClient;
}

let adminClient: SupabaseClient | null = null;
export function getSupabaseAdminClient(): SupabaseClient | null {
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!supabaseUrl || !key) return null;
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, key, {
      auth: { persistSession: false },
    });
  }
  return adminClient;
}
