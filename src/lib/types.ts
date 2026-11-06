export interface Site {
  id: string;
  slug: string;
  nom: string;
  actif: boolean;
  deleted_at?: string | null;
  created_at: string;
}

export interface Collaborateur {
  id: string;
  site_id: string;
  nom: string;
  role?: string;
  actif: boolean;
  deleted_at?: string | null;
  created_at: string;
}

export interface PhotoKeyEntry {
  original: string;
  thumbnail: string;
}

export interface Avis {
  id: string;
  site_id: string;
  collaborateur_id: string;
  intitule_prestation?: string | null;
  note_conseil: number;
  note_diversite: number;
  note_proprete: number;
  note_engagements: number;
  note_qualite_prix: number;
  note_recommandation: number;
  commentaire: string | null;
  photos: (string | PhotoKeyEntry)[]; // Clés Cloudflare R2
  nom: string;
  prenom: string;
  email: string | null;
  telephone?: string | null;
  societe?: string | null;
  statut: 'en_attente' | 'approuve' | 'masque';
  deleted_at?: string | null;
  created_at: string;
  // Relations optionnelles
  sites?: Site;
  collaborateurs?: Collaborateur;
}

export interface CriterionDefinition {
  key: keyof Pick<
    Avis,
    | 'note_conseil'
    | 'note_diversite'
    | 'note_proprete'
    | 'note_engagements'
    | 'note_qualite_prix'
    | 'note_recommandation'
  >;
  label: string;
  description: string;
}

export const CRITERIA: CriterionDefinition[] = [
  {
    key: 'note_conseil',
    label: 'Conseil et compréhension du devis',
    description: 'Écoute, clarté des explications et pertinence des conseils techniques',
  },
  {
    key: 'note_diversite',
    label: 'Diversité des produits proposés',
    description: 'Choix des équipements, matériaux, options et personnalisation',
  },
  {
    key: 'note_proprete',
    label: 'Propreté, finition du chantier',
    description: 'Soin apporté aux travaux, finitions et respect des lieux',
  },
  {
    key: 'note_engagements',
    label: 'Tenue des engagements',
    description: 'Respect des délais, devis convenu et ponctualité',
  },
  {
    key: 'note_qualite_prix',
    label: 'Rapport qualité/budget',
    description: 'Justesse du prix au regard des prestations fournies',
  },
  {
    key: 'note_recommandation',
    label: 'Recommandation',
    description: 'Recommanderiez-vous Blue 2.0 à vos proches et amis ?',
  },
];
