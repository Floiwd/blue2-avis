'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Droplet, ExternalLink, MessageSquare, Camera, X } from 'lucide-react';

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
    // Rafraîchissement automatique toutes les 60 secondes pour mettre à jour les nouveaux avis en direct
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
  const avisList = (data?.avis || []).slice(0, maxReviews);

  return (
    <div className="font-sans antialiased bg-transparent p-3 sm:p-4 text-slate-800 max-w-5xl mx-auto">
      {/* En-tête statistiques de l'agence */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-extrabold text-sky-700">
              Avis Clients Vérifiés
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-900 mt-0.5">
            {data?.site?.nom || 'Blue 2.0'}
          </h2>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <span className="text-2xl font-black text-slate-900">
                {stats?.moyenne_globale ? stats.moyenne_globale.toFixed(1) : '5.0'}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 5</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {stats?.total || avisList.length} avis déposé{(stats?.total || avisList.length) > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-0.5 text-sky-500">
            {[1, 2, 3, 4, 5].map((drop) => {
              const active = drop <= Math.round(stats?.moyenne_globale || 5);
              return (
                <Droplet
                  key={drop}
                  className={`w-5 h-5 ${
                    active ? 'text-sky-500 fill-sky-500' : 'text-slate-300 fill-slate-200'
                  }`}
                />
              );
            })}
          </div>

          <a
            href={`https://blue2-avis.vercel.app/?site=${siteSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition"
          >
            <span>Déposer un avis</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Grille des avis */}
      {avisList.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold">Aucun avis publié pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {avisList.map((avis) => (
            <div
              key={avis.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                {/* Header avis */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {avis.prenom} {avis.initiale_nom}
                    </h3>
                    <div className="text-[11px] text-slate-400">
                      {new Date(avis.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
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
                    <span className="text-xs font-bold text-sky-700 ml-1">
                      {avis.notes.moyenne.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Badge collaborateur */}
                {avis.collaborateur && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-100 rounded-lg text-[11px] font-semibold text-sky-800 mb-3">
                    <span>Accompagné par :</span>
                    <strong className="font-bold">{avis.collaborateur.nom}</strong>
                  </div>
                )}

                {/* Commentaire */}
                {avis.commentaire && (
                  <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/60 p-3 rounded-xl border border-slate-100 mb-3">
                    "{avis.commentaire}"
                  </p>
                )}

                {/* Photos */}
                {avis.photos && avis.photos.length > 0 && (
                  <div className="pt-2">
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
                          className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-sky-500 transition shrink-0"
                        >
                          <img
                            src={photo.thumbnail || photo.original}
                            alt="Photo client"
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
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

      {/* Bouton mobile pour déposer un avis */}
      <div className="mt-6 text-center md:hidden">
        <a
          href={`https://blue2-avis.vercel.app/?site=${siteSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-xs transition"
        >
          <span>Vous aussi, donnez votre avis</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Lightbox photo */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto}
              alt="Photo agrandie"
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
