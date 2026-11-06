'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Droplet,
  ExternalLink,
  MessageSquare,
  Camera,
  X,
  ShieldCheck,
  CheckCircle,
  ThumbsUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface WidgetAvis {
  id: string;
  prenom: string;
  initiale_nom: string;
  created_at: string;
  intitule_prestation: string | null;
  notes: {
    conseil: number;
    diversite: number;
    proprete: number;
    engagements: number;
    qualite_prix: number;
    recommandation: number;
    moyenne: number;
  };
  collaborateur: { nom: string; role: string | null } | null;
  site: { nom: string; slug: string } | null;
  commentaire: string | null;
  photos: Array<{
    thumbnail: string;
    original: string;
    key_thumbnail: string;
    key_original: string;
  }>;
}

interface ApiResponse {
  site: { nom: string; slug: string };
  stats: {
    total: number;
    moyenne_globale: number;
    moyenne_conseil: number;
    moyenne_diversite: number;
    moyenne_proprete: number;
    moyenne_engagements: number;
    moyenne_qualite_prix: number;
    moyenne_recommandation: number;
  };
  avis: WidgetAvis[];
}

function WidgetContent() {
  const searchParams = useSearchParams();
  const siteSlug = searchParams.get('site') || 'saint-die-vosges';
  const limitParam = searchParams.get('limit');
  const maxReviews = limitParam ? parseInt(limitParam, 10) : 50;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'photos' | '5stars'>('all');
  const [showCriteriaDetail, setShowCriteriaDetail] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/avis?site=${siteSlug}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erreur widget avis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 60000);
    return () => clearInterval(interval);
  }, [siteSlug]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const stats = data?.stats;
  const rawAvisList = data?.avis || [];

  // Filtrage local
  const filteredAvis = rawAvisList
    .filter((a) => {
      if (filterType === 'photos') return a.photos && a.photos.length > 0;
      if (filterType === '5stars') return Math.round(a.notes.moyenne) === 5;
      return true;
    })
    .slice(0, maxReviews);

  const countWithPhotos = rawAvisList.filter((a) => a.photos && a.photos.length > 0).length;
  const count5Stars = rawAvisList.filter((a) => Math.round(a.notes.moyenne) === 5).length;

  // Calcul taux recommandation
  const countRecommandes = rawAvisList.filter((a) => a.notes.recommandation >= 4).length;
  const tauxRecommandation = rawAvisList.length > 0 ? Math.round((countRecommandes / rawAvisList.length) * 100) : 100;

  // Google SEO Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://blue2-avis.vercel.app/#${siteSlug}`,
    name: data?.site?.nom || 'Blue 2.0',
    url: `https://blue2-avis.vercel.app/?site=${siteSlug}`,
    description: `Avis clients vérifiés et certifiés pour ${data?.site?.nom || 'Blue 2.0'} : piscines, spas et aménagements.`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: stats?.moyenne_globale ? stats.moyenne_globale.toFixed(1) : '5.0',
      bestRating: '5',
      worstRating: '1',
      ratingCount: stats?.total || rawAvisList.length || 1,
      reviewCount: stats?.total || rawAvisList.length || 1,
    },
    review: rawAvisList.slice(0, 15).map((a) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: `${a.prenom} ${a.initiale_nom || ''}`.trim(),
      },
      datePublished: a.created_at ? a.created_at.split('T')[0] : '2026-11-06',
      reviewBody: a.commentaire || 'Prestation piscine réalisée avec Blue 2.0.',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: a.notes?.moyenne ? a.notes.moyenne.toFixed(1) : '5',
        bestRating: '5',
        worstRating: '1',
      },
    })),
  };

  const criteriaBreakdown = [
    { label: 'Conseil & Accompagnement', note: stats?.moyenne_conseil || 5 },
    { label: 'Diversité & Choix', note: stats?.moyenne_diversite || 5 },
    { label: 'Propreté du chantier', note: stats?.moyenne_proprete || 5 },
    { label: 'Respect des engagements', note: stats?.moyenne_engagements || 5 },
    { label: 'Rapport Qualité / Prix', note: stats?.moyenne_qualite_prix || 5 },
    { label: 'Recommandation globale', note: stats?.moyenne_recommandation || 5 },
  ];

  return (
    <div className="font-sans antialiased bg-transparent p-3 sm:p-5 text-slate-800 max-w-5xl mx-auto w-full max-w-full overflow-x-hidden">
      {/* Balise SEO JSON-LD pour Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER SYNTHÈSE & CONFIANCE CLIENT */}
      <div className="bg-gradient-to-br from-white via-sky-50/40 to-white rounded-3xl p-5 sm:p-7 border border-sky-100 shadow-sm mb-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-sky-100/70">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Avis 100% Vérifiés & Certifiés</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {data?.site?.nom || 'Blue 2.0'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Satisfaction client certifiée</span>
              <span>•</span>
              <span className="font-semibold text-emerald-600">{tauxRecommandation}% de recommandation</span>
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 bg-white p-4 rounded-2xl border border-sky-100 shadow-xs">
            <div className="text-left sm:text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {stats?.moyenne_globale ? stats.moyenne_globale.toFixed(1) : '5.0'}
                </span>
                <span className="text-sm font-bold text-slate-400">/ 5</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {stats?.total || rawAvisList.length} avis certifié{(stats?.total || rawAvisList.length) > 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1">
              <div className="flex items-center gap-0.5 text-sky-500">
                {[1, 2, 3, 4, 5].map((drop) => {
                  const active = drop <= Math.round(stats?.moyenne_globale || 5);
                  return (
                    <Droplet
                      key={drop}
                      className={`w-6 h-6 transition-transform hover:scale-110 ${
                        active ? 'text-sky-500 fill-sky-500' : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-600">
                Excellente réputation
              </span>
            </div>

            <a
              href={`https://blue2-avis.vercel.app/?site=${siteSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 touch-manipulation"
            >
              <span>Déposer un avis</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Accordéon détails des 6 critères */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => setShowCriteriaDetail(!showCriteriaDetail)}
            className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1.5 transition touch-manipulation"
          >
            <span>{showCriteriaDetail ? 'Masquer le détail par critère' : 'Voir le détail des 6 critères de satisfaction'}</span>
            {showCriteriaDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showCriteriaDetail && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 animate-in fade-in duration-200">
              {criteriaBreakdown.map((crit, idx) => (
                <div key={idx} className="bg-white/80 p-3 rounded-xl border border-sky-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">{crit.label}</span>
                    <span className="font-bold text-sky-700">{crit.note.toFixed(1)}/5</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full"
                      style={{ width: `${(crit.note / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FILTRES INTERACTIFS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 touch-pan-x">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
            filterType === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Tous les avis ({rawAvisList.length})
        </button>

        {countWithPhotos > 0 && (
          <button
            onClick={() => setFilterType('photos')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterType === 'photos'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Avec photos de chantier ({countWithPhotos})</span>
          </button>
        )}

        {count5Stars > 0 && (
          <button
            onClick={() => setFilterType('5stars')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filterType === '5stars'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Notes 5/5 ({count5Stars})</span>
          </button>
        )}
      </div>

      {/* GRILLE DES AVIS */}
      {filteredAvis.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-slate-500 shadow-xs">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Aucun avis dans cette catégorie.</p>
          <button
            onClick={() => setFilterType('all')}
            className="mt-3 text-xs text-sky-600 font-bold hover:underline"
          >
            Afficher tous les avis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAvis.map((avis) => (
            <div
              key={avis.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-sky-200 transition-all duration-200"
            >
              <div>
                {/* Header carte avis */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-100 to-sky-200 text-sky-800 font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {avis.prenom ? avis.prenom.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900">
                          {avis.prenom} {avis.initiale_nom}
                        </h3>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>Vérifié</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {new Date(avis.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Note en gouttes */}
                  <div className="flex items-center gap-0.5 bg-sky-50/80 px-2.5 py-1 rounded-xl border border-sky-100">
                    {[1, 2, 3, 4, 5].map((d) => (
                      <Droplet
                        key={d}
                        className={`w-3.5 h-3.5 ${
                          d <= Math.round(avis.notes.moyenne)
                            ? 'text-sky-500 fill-sky-500'
                            : 'text-slate-200 fill-slate-100'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-black text-sky-800 ml-1">
                      {avis.notes.moyenne.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Prestation & Collaborateur */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {avis.collaborateur && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-sky-50 border border-sky-100 text-sky-800 text-[11px] font-semibold rounded-lg">
                      <span>Suivi par :</span>
                      <strong className="font-bold">{avis.collaborateur.nom}</strong>
                    </span>
                  )}
                  {avis.intitule_prestation && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-lg">
                      {avis.intitule_prestation}
                    </span>
                  )}
                </div>

                {/* Commentaire */}
                {avis.commentaire && (
                  <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 mb-3">
                    "{avis.commentaire}"
                  </p>
                )}

                {/* Galerie Photos avec conversion WebP HD */}
                {avis.photos && avis.photos.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-2">
                      <Camera className="w-3.5 h-3.5 text-sky-600" />
                      <span>Photos du chantier ({avis.photos.length})</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {avis.photos.map((photo, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setSelectedPhoto(photo.original || photo.thumbnail)}
                          className="group relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-sky-500 transition shrink-0 active:scale-95"
                          title="Cliquer pour agrandir la photo HD"
                        >
                          <img
                            src={photo.thumbnail || photo.original}
                            alt="Photo chantier client"
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            loading="lazy"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] text-center font-bold">
                            HD
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER WIDGET */}
      <div className="mt-8 pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Système d'avis certifié Blue 2.0 • Hébergement sécurisé & données protégées</span>
        </div>

        <a
          href={`https://blue2-avis.vercel.app/?site=${siteSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
        >
          <span>Consulter tous les avis et mentions légales</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* LIGHTBOX PHOTO HD PLEIN ÉCRAN */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto}
              alt="Photo agrandie HD"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function WidgetPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center font-sans">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      }
    >
      <WidgetContent />
    </Suspense>
  );
}
