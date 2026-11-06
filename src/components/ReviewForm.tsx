'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  User,
  MessageSquare,
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  Info,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { Site, Collaborateur, CRITERIA } from '@/lib/types';
import { WaterDropRating } from './WaterDropRating';
import { compressImage } from '@/lib/image-compress';

interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  sizeKb: number;
}

export function ReviewForm() {
  const [sites, setSites] = useState<(Site & { collaborateurs: Collaborateur[] })[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);

  // Form State
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedCollaborateurId, setSelectedCollaborateurId] = useState<string>('');
  const [intitulePrestation, setIntitulePrestation] = useState<string>('');

  // Identité client
  const [nom, setNom] = useState<string>('');
  const [prenom, setPrenom] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [telephone, setTelephone] = useState<string>('');
  const [societe, setSociete] = useState<string>('');

  // 6 Notes (1..5)
  const [notes, setNotes] = useState<Record<string, number>>({
    note_conseil: 0,
    note_diversite: 0,
    note_proprete: 0,
    note_engagements: 0,
    note_qualite_prix: 0,
    note_recommandation: 0,
  });

  // Commentaire libre
  const [commentaire, setCommentaire] = useState<string>('');

  // Photos
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [compressing, setCompressing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Anti-spam Honeypot
  const [hpWebsite, setHpWebsite] = useState<string>('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Chargement des agences & pré-remplissage via URL
  useEffect(() => {
    async function fetchSites() {
      try {
        const res = await fetch('/api/sites');
        const data = await res.json();
        const siteList = data.sites || [];
        setSites(siteList);

        // Pre-fill via search params si disponibles
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const siteParam = params.get('site');
          const collabParam = params.get('collab');
          const prestationParam = params.get('prestation');
          const nomParam = params.get('nom');
          const prenomParam = params.get('prenom');
          const emailParam = params.get('email');

          if (siteParam) {
            const foundSite = siteList.find(
              (s: Site) => s.slug === siteParam || s.id === siteParam
            );
            if (foundSite) {
              setSelectedSiteId(foundSite.id);
              if (collabParam) {
                const foundCollab = foundSite.collaborateurs.find(
                  (c: Collaborateur) => c.id === collabParam || c.nom.toLowerCase().includes(collabParam.toLowerCase())
                );
                if (foundCollab) {
                  setSelectedCollaborateurId(foundCollab.id);
                }
              }
            }
          }

          if (prestationParam) setIntitulePrestation(prestationParam);
          if (nomParam) setNom(nomParam);
          if (prenomParam) setPrenom(prenomParam);
          if (emailParam) setEmail(emailParam);
        }
      } catch (err) {
        console.error('Failed to load sites:', err);
      } finally {
        setLoadingSites(false);
      }
    }
    fetchSites();
  }, []);

  const currentSite = sites.find((s) => s.id === selectedSiteId);
  const currentCollaborateurs = currentSite?.collaborateurs || [];

  // Mise à jour d'une note
  const handleNoteChange = (key: string, val: number) => {
    setNotes((prev) => ({ ...prev, [key]: val }));
    setErrorMessage(null);
  };

  // Gestion des photos avec compression côté client
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressing(true);
    setErrorMessage(null);

    const newPhotoItems: PhotoItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await compressImage(file, 1600, 0.82);
        newPhotoItems.push({
          id: `${Date.now()}-${i}-${Math.random()}`,
          file: result.file,
          previewUrl: result.previewUrl,
          sizeKb: Math.round(result.compressedSize / 1024),
        });
      } catch (err) {
        console.warn('Compression error on file:', file.name, err);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotoItems]);
    setCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Validation et soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validation agence et collaborateur
    if (!selectedSiteId) {
      setErrorMessage('Veuillez sélectionner votre agence Blue 2.0.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!selectedCollaborateurId) {
      setErrorMessage('Veuillez choisir le collaborateur qui vous a accompagné.');
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    // 2. Validation coordonnées client (Étape 2)
    if (!nom.trim() || !prenom.trim()) {
      setErrorMessage('Veuillez renseigner votre nom et votre prénom.');
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }

    // 3. Validation des 6 notes
    for (const crit of CRITERIA) {
      if (!notes[crit.key] || notes[crit.key] < 1) {
        setErrorMessage(`Veuillez attribuer une note (gouttes d'eau) pour : "${crit.label}".`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Étape 1 : Upload des photos vers le Storage (si présentes)
      let uploadedPhotoUrls: string[] = [];
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((p) => formData.append('files', p.file));

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedPhotoUrls = uploadData.urls || [];
        } else {
          console.warn('Photos upload failed, continuing with review submission');
        }
      }

      // Étape 2 : Soumission de l'avis
      const payload = {
        site_id: selectedSiteId,
        collaborateur_id: selectedCollaborateurId,
        intitule_prestation: intitulePrestation,
        ...notes,
        commentaire,
        photos: uploadedPhotoUrls,
        nom,
        prenom,
        email,
        telephone,
        societe,
        website_url_hp: hpWebsite, // honeypot
      };

      const res = await fetch('/api/avis/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la validation de votre avis.');
      }

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // ÉCRAN DE REMERCIEMENT (Succès)
  // -------------------------------------------------------------
  if (isSuccess) {
    const collabName = currentCollaborateurs.find((c) => c.id === selectedCollaborateurId)?.nom;
    const siteName = currentSite?.nom;

    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50 py-10 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-sky-100 p-6 sm:p-8 text-center animate-in zoom-in-95 duration-400">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/25 mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Merci pour votre confiance !
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Votre avis a bien été enregistré. Votre retour d'expérience est précieux pour{' '}
            <strong className="text-sky-700">{collabName || 'notre équipe'}</strong> et l'agence{' '}
            <strong className="text-sky-700">{siteName || 'Blue 2.0'}</strong>.
          </p>

          <div className="bg-sky-50/70 rounded-2xl p-4 mb-6 border border-sky-100 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Avis certifié et vérifié par notre service qualité.</span>
            </div>
            {photos.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Camera className="w-4 h-4 text-sky-600 shrink-0" />
                <span>{photos.length} photo(s) ajoutée(s) à votre dossier.</span>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setIsSuccess(false);
              setNotes({
                note_conseil: 0,
                note_diversite: 0,
                note_proprete: 0,
                note_engagements: 0,
                note_qualite_prix: 0,
                note_recommandation: 0,
              });
              setCommentaire('');
              setPhotos([]);
              setIntitulePrestation('');
            }}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold text-sm transition shadow-md"
          >
            Déposer un autre avis
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FORMULAIRE PRINCIPAL (Directement affiché sur "/")
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* En-tête Mobile-First Blue 2.0 */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-xs px-4 py-3 sm:py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-600 flex items-center justify-center shadow-md shadow-sky-500/20">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Formulaire avis Blue 2.0
              </h1>
              <p className="text-xs text-sky-600 font-medium">Votre satisfaction au cœur de l'eau</p>
            </div>
          </div>
          <a
            href="/admin"
            className="text-xs font-semibold text-slate-400 hover:text-sky-600 px-2.5 py-1.5 rounded-lg transition"
            title="Espace administration"
          >
            Admin
          </a>
        </div>
      </header>

      {/* Corps du Formulaire */}
      <main className="max-w-xl mx-auto px-4 pt-5">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alerte Erreur */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Attention</p>
                <p className="mt-0.5 text-xs text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ÉTAPE 1 : Choix de l'agence Blue 2.0 & du collaborateur */}
          {/* ============================================================== */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-sky-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h2 className="text-base font-bold text-slate-800">
                Agence et interlocuteur
              </h2>
            </div>

            {/* Choix Agence */}
            <div>
              <label htmlFor="agence-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Agence Blue 2.0 <span className="text-sky-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="agence-select"
                  value={selectedSiteId}
                  onChange={(e) => {
                    setSelectedSiteId(e.target.value);
                    setSelectedCollaborateurId('');
                  }}
                  disabled={loadingSites}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pr-10 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                >
                  <option value="">Sélectionnez votre agence Blue 2.0...</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.nom}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Choix Collaborateur (apparaît au clic sur l'agence) */}
            {selectedSiteId && (
              <div className="animate-in fade-in duration-300">
                <label htmlFor="collaborateur-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Collaborateur qui a suivi votre projet <span className="text-sky-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="collaborateur-select"
                    value={selectedCollaborateurId}
                    onChange={(e) => setSelectedCollaborateurId(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 pr-10 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                  >
                    <option value="">Choisir un collaborateur...</option>
                    {currentCollaborateurs.map((collab) => (
                      <option key={collab.id} value={collab.id}>
                        {collab.nom} {collab.role ? `(${collab.role})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Intitulé de la prestation (inspiré des captures) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="prestation-input" className="text-xs font-semibold text-slate-700">
                  Intitulé de la prestation <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <span className="text-[11px] text-slate-400">{intitulePrestation.length}/80</span>
              </div>
              <input
                id="prestation-input"
                type="text"
                maxLength={80}
                placeholder="Ex. : Rénovation liner & pose pompe à chaleur"
                value={intitulePrestation}
                onChange={(e) => setIntitulePrestation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Résumez brièvement votre installation ou intervention, sans émoji.
              </p>
            </div>
          </section>

          {/* ============================================================== */}
          {/* ÉTAPE 2 : Vos coordonnées (Nom, Prénom, E-mail, Tél, Société) */}
          {/* ============================================================== */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-sky-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Vos coordonnées
                </h2>
                <p className="text-xs text-slate-500">Pour certifier l'authenticité de votre avis</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="prenom-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Prénom <span className="text-sky-500">*</span>
                </label>
                <input
                  id="prenom-input"
                  type="text"
                  required
                  placeholder="Jean"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>

              <div>
                <label htmlFor="nom-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nom <span className="text-sky-500">*</span>
                </label>
                <input
                  id="nom-input"
                  type="text"
                  required
                  placeholder="Dupont"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor="email-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  E-mail <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <input
                  id="email-input"
                  type="email"
                  placeholder="jean.dupont@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>

              <div>
                <label htmlFor="telephone-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Téléphone <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <input
                  id="telephone-input"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="societe-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Société <span className="text-slate-400 font-normal">(si professionnel)</span>
              </label>
              <input
                id="societe-input"
                type="text"
                placeholder="Ex. : SAS Dupont Paysages"
                value={societe}
                onChange={(e) => setSociete(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>

            {/* Anti-spam Honeypot caché aux humains */}
            <div className="opacity-0 absolute pointer-events-none -z-50 h-0 overflow-hidden">
              <label htmlFor="hp_check">Ne pas remplir</label>
              <input
                id="hp_check"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={hpWebsite}
                onChange={(e) => setHpWebsite(e.target.value)}
              />
            </div>
          </section>

          {/* ============================================================== */}
          {/* ÉTAPE 3 : Notation 1 à 5 sur 6 critères avec GOUTTES D'EAU */}
          {/* ============================================================== */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Votre évaluation (en gouttes d'eau)
                </h2>
                <p className="text-xs text-slate-500">
                  Touchez les gouttes de 1 (faible) à 5 (excellent)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {CRITERIA.map((criterion) => (
                <WaterDropRating
                  key={criterion.key}
                  id={criterion.key}
                  label={criterion.label}
                  description={criterion.description}
                  value={notes[criterion.key] || 0}
                  onChange={(val) => handleNoteChange(criterion.key, val)}
                  required
                />
              ))}
            </div>
          </section>

          {/* ============================================================== */}
          {/* ÉTAPE 4 : Commentaire libre */}
          {/* ============================================================== */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-sky-100 shadow-sm space-y-2">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>Votre avis détaillé</span>
              </h2>
            </div>

            <label htmlFor="commentaire-input" className="block text-xs text-slate-500 pt-1">
              Partagez votre retour d'expérience : accueil, réactivité, déroulement des travaux, conseils reçus...
            </label>
            <textarea
              id="commentaire-input"
              rows={4}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Racontez-nous comment s'est déroulé votre projet avec Blue 2.0..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none"
            />
          </section>

          {/* ============================================================== */}
          {/* ÉTAPE 5 : Ajout de photos (compression client avant envoi) */}
          {/* ============================================================== */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-sky-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                  5
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-sky-600" />
                    <span>Photos du projet</span>
                  </h2>
                  <p className="text-xs text-slate-500">Piscine, bassin, équipements réalisés</p>
                </div>
              </div>
              <span className="text-xs bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full font-semibold">
                {photos.length} photo(s)
              </span>
            </div>

            {/* Input file caché */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {/* Bouton d'ajout */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/40 hover:bg-sky-50 rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
            >
              {compressing ? (
                <div className="flex items-center gap-2 text-sky-700 text-sm font-semibold">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Optimisation & compression des photos...</span>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-sky-600">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">
                    Prendre une photo ou importer depuis la galerie
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Compression automatique côté client pour économiser vos données
                  </p>
                </>
              )}
            </div>

            {/* Aperçu des photos sélectionnées */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {photos.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs"
                  >
                    <img
                      src={item.previewUrl}
                      alt="Aperçu photo chantier"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removePhoto(item.id)}
                        className="p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition"
                        title="Supprimer la photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md font-mono">
                      {item.sizeKb} Ko
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ============================================================== */}
          {/* ÉTAPE 6 : Bouton Envoyer */}
          {/* ============================================================== */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || compressing}
              className="w-full py-4 px-6 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white rounded-2xl font-bold text-base shadow-lg shadow-sky-600/30 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                  <span>Envoyer mon avis Blue 2.0</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vos données sont sécurisées et traitées selon la charte qualité Blue 2.0.</span>
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
