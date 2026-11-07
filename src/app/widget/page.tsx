'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Droplet,
  ExternalLink,
  MessageSquare,
  Camera,
  X,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Award,
  Maximize2,
  Clock,
  HeartHandshake,
  Compass,
  Layers,
  Sparkle,
  Scale,
  SlidersHorizontal,
  PenLine,
  ArrowUpRight,
  ArrowLeft,
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
  const frameId = searchParams.get('frameId');
  const limitParam = searchParams.get('limit');
  const maxReviews = limitParam ? parseInt(limitParam, 10) : 50;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'photos' | '5stars' | 'piscine' | 'spa' | 'renov'>('all');
  const [showCriteriaDetail, setShowCriteriaDetail] = useState(false);
  const [expandedAvisId, setExpandedAvisId] = useState<string | null>(null);

  // Carrousel interactif fluide - Hooks TOUJOURS au top level (Règles de React)
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const fetchReviews = async (silent = false) => {
    if (!silent && !data) {
      setLoading(true);
    }
    try {
      const res = await fetch(`/api/avis?site=${encodeURIComponent(siteSlug)}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
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
    // 1. Chargement initial immédiat
    fetchReviews();

    // 2. Polling régulier silencieux toutes les 15 secondes pour actualisation en direct
    const interval = setInterval(() => {
      fetchReviews(true);
    }, 15000);

    // 3. Actualisation immédiate au focus de la fenêtre ou onglet
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchReviews(true);
      }
    };
    const handleFocus = () => fetchReviews(true);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    window.addEventListener('focus', handleFocus);

    // 4. Écoute postMessage depuis le site parent (WordPress, Wix, Webflow, etc.)
    const handlePostMessage = (event: MessageEvent) => {
      if (
        event.data &&
        (event.data.type === 'blue2-refresh' ||
          event.data.type === 'reload-reviews' ||
          event.data.type === 'blue2-reload')
      ) {
        fetchReviews(true);
      }
    };
    window.addEventListener('message', handlePostMessage);

    // 5. BroadcastChannel multi-onglets instantané
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('blue2_avis_channel');
        channel.onmessage = (event) => {
          if (
            event.data?.type === 'AVIS_UPDATED' ||
            event.data?.type === 'NEW_AVIS_SUBMITTED'
          ) {
            fetchReviews(true);
          }
        };
      }
    } catch {
      // Ignorer si non supporté ou contexte restreint (ex. iframe Safari)
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('message', handlePostMessage);
      if (channel) channel.close();
    };
  }, [siteSlug]);

  // Transmission automatique de la hauteur réelle au site hôte (Zéro ascenseur sur WordPress / Wix)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const notifyParentHeight = () => {
      const scrollH = document.documentElement.scrollHeight || document.body.scrollHeight;
      window.parent.postMessage(
        {
          type: 'blue2-widget-resize',
          frameId: frameId || undefined,
          height: scrollH + 20,
        },
        '*'
      );
    };

    notifyParentHeight();
    const t1 = setTimeout(notifyParentHeight, 250);
    const t2 = setTimeout(notifyParentHeight, 800);
    window.addEventListener('resize', notifyParentHeight);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', notifyParentHeight);
    };
  }, [data, filterType, showCriteriaDetail, expandedAvisId, frameId]);

  const stats = data?.stats;
  const rawAvisList = data?.avis || [];

  // Détection intelligente des spécialités piscines / spas / rénovation
  const isPiscineAvis = (a: WidgetAvis) => {
    const text = `${a.intitule_prestation || ''} ${a.commentaire || ''}`.toLowerCase();
    return /piscine|construct|bassin|coque|béton|miroir|couloir|terrassement|nage/i.test(text);
  };
  const isSpaAvis = (a: WidgetAvis) => {
    const text = `${a.intitule_prestation || ''} ${a.commentaire || ''}`.toLowerCase();
    return /spa|balnéo|jacuzzi|détente|bain/i.test(text);
  };
  const isRenovAvis = (a: WidgetAvis) => {
    const text = `${a.intitule_prestation || ''} ${a.commentaire || ''}`.toLowerCase();
    return /rénov|liner|membrane|volet|pompe|étanch|filtration|abri|sécurité|bâche|traitement/i.test(text);
  };

  const countWithPhotos = rawAvisList.filter((a) => a.photos && a.photos.length > 0).length;
  const count5Stars = rawAvisList.filter((a) => Math.round(a.notes?.moyenne ?? 5) === 5).length;
  const countPiscine = rawAvisList.filter(isPiscineAvis).length;
  const countSpa = rawAvisList.filter(isSpaAvis).length;
  const countRenov = rawAvisList.filter(isRenovAvis).length;

  // Filtrage local
  const filteredAvis = rawAvisList
    .filter((a) => {
      if (filterType === 'photos') return a.photos && a.photos.length > 0;
      if (filterType === '5stars') return Math.round(a.notes?.moyenne ?? 5) === 5;
      if (filterType === 'piscine') return isPiscineAvis(a);
      if (filterType === 'spa') return isSpaAvis(a);
      if (filterType === 'renov') return isRenovAvis(a);
      return true;
    })
    .slice(0, maxReviews);

  const updateCarouselState = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollPrev(scrollLeft > 15);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 15);

    let cardWidth = clientWidth * 0.86;
    if (clientWidth >= 1024) {
      cardWidth = clientWidth / 3;
    } else if (clientWidth >= 640) {
      cardWidth = clientWidth / 2;
    }
    const idx = Math.round(scrollLeft / Math.max(1, cardWidth));
    setActiveSlideIndex(Math.max(0, Math.min(idx, Math.max(0, filteredAvis.length - 1))));
  };

  useEffect(() => {
    updateCarouselState();
    const el = carouselRef.current;
    if (el) {
      el.addEventListener('scroll', updateCarouselState, { passive: true });
      window.addEventListener('resize', updateCarouselState);
      return () => {
        el.removeEventListener('scroll', updateCarouselState);
        window.removeEventListener('resize', updateCarouselState);
      };
    }
  }, [filteredAvis.length]);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
    setActiveSlideIndex(0);
    setCanScrollPrev(false);
    setCanScrollNext(filteredAvis.length > 2);
  }, [filterType, filteredAvis.length]);

  const handleScrollPrev = () => {
    if (carouselRef.current) {
      const clientWidth = carouselRef.current.clientWidth;
      const step =
        clientWidth >= 1024
          ? clientWidth * 0.66
          : clientWidth >= 640
          ? clientWidth * 0.85
          : clientWidth * 0.86;
      carouselRef.current.scrollBy({ left: -step, behavior: 'smooth' });
    }
  };

  const handleScrollNext = () => {
    if (carouselRef.current) {
      const clientWidth = carouselRef.current.clientWidth;
      const step =
        clientWidth >= 1024
          ? clientWidth * 0.66
          : clientWidth >= 640
          ? clientWidth * 0.85
          : clientWidth * 0.86;
      carouselRef.current.scrollBy({ left: step, behavior: 'smooth' });
    }
  };

  const scrollToIndex = (idx: number) => {
    if (carouselRef.current) {
      const clientWidth = carouselRef.current.clientWidth;
      const cardWidth =
        clientWidth >= 1024
          ? clientWidth / 3
          : clientWidth >= 640
          ? clientWidth / 2
          : clientWidth * 0.86;
      carouselRef.current.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
    }
  };

  // Calcul taux recommandation
  const countRecommandes = rawAvisList.filter((a) => (a.notes?.recommandation ?? 5) >= 4).length;
  const tauxRecommandation = rawAvisList.length > 0 ? Math.round((countRecommandes / rawAvisList.length) * 100) : 100;

  // Si en cours de chargement initial et sans données en mémoire
  if (loading && !data) {
    return (
      <div className="p-12 flex flex-col items-center justify-center font-sans space-y-3">
        <div className="w-10 h-10 rounded-full border-3 border-sky-200 border-t-sky-600 animate-spin"></div>
        <p className="text-xs text-slate-400 font-semibold tracking-wide">Chargement des avis certifiés...</p>
      </div>
    );
  }

  // Google SEO Structured Data (JSON-LD optimisé Rich Snippets)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
    '@id': `https://blue2-avis.vercel.app/#${siteSlug}`,
    name: data?.site?.nom || 'Blue 2.0',
    url: `https://blue2-avis.vercel.app/?site=${siteSlug}`,
    inLanguage: 'fr-FR',
    description: `Avis clients vérifiés et certifiés pour ${data?.site?.nom || 'Blue 2.0'} : construction de piscines, spas, rénovation et équipements.`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: stats?.moyenne_globale ? stats.moyenne_globale.toFixed(1) : '5.0',
      bestRating: '5',
      worstRating: '1',
      ratingCount: stats?.total || rawAvisList.length || 1,
      reviewCount: stats?.total || rawAvisList.length || 1,
    },
    review: rawAvisList.slice(0, 20).map((a) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: `${a.prenom} ${a.initiale_nom || ''}`.trim(),
      },
      datePublished: a.created_at ? a.created_at.split('T')[0] : '2026-11-06',
      reviewBody: a.commentaire || (a.intitule_prestation ? `Prestation réalisée : ${a.intitule_prestation}` : 'Prestation piscine réalisée avec Blue 2.0.'),
      reviewRating: {
        '@type': 'Rating',
        ratingValue: a.notes?.moyenne ? a.notes.moyenne.toFixed(1) : '5',
        bestRating: '5',
        worstRating: '1',
      },
    })),
  };

  const criteriaBreakdown = [
    { label: 'Conseil & Écoute client', note: stats?.moyenne_conseil || 5, icon: Compass },
    { label: 'Diversité & Choix des équipements', note: stats?.moyenne_diversite || 5, icon: Layers },
    { label: 'Propreté & Tenue du chantier', note: stats?.moyenne_proprete || 5, icon: Sparkle },
    { label: 'Respect des engagements & Délais', note: stats?.moyenne_engagements || 5, icon: Clock },
    { label: 'Rapport Qualité / Prix & Finitions', note: stats?.moyenne_qualite_prix || 5, icon: Scale },
    { label: 'Recommandation globale', note: stats?.moyenne_recommandation || 5, icon: HeartHandshake },
  ];

  return (
    <div className="font-sans antialiased bg-transparent p-1.5 sm:p-3 text-slate-800 max-w-6xl mx-auto w-full max-w-full overflow-x-hidden selection:bg-sky-500 selection:text-white">
      {/* Balise SEO JSON-LD pour Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Barre d'accès rapide & retour au formulaire */}
      <div className="flex items-center justify-between mb-3 px-1">
        <a
          href={`https://blue2-avis.vercel.app/?site=${encodeURIComponent(siteSlug)}`}
          target="_top"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-bold text-sky-700 hover:text-sky-900 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 px-3.5 py-2 rounded-xl transition shadow-2xs group"
          title="Retourner au formulaire de dépôt d'avis"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Retourner au formulaire</span>
        </a>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Avis certifiés Blue 2.0
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 1. EN-TÊTE PRESTIGE & EXCELLENCE PISCINES (RESPONSIVE TOUS ÉCRANS)        */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-white via-slate-50/80 to-sky-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(14,165,233,0.08)] mb-5 sm:mb-6 relative overflow-hidden">
        {/* Ligne d'accent lumineuse dorée/cyan au sommet */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 via-teal-400 to-amber-400" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 pb-5 sm:pb-6 border-b border-slate-200/70">
          {/* Bloc Titre, Label AFNOR & Badges de Confiance */}
          <div className="space-y-2.5 sm:space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 text-white text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border border-slate-800 shadow-xs">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Avis Clients Certifiés • Norme AFNOR NF Z74-501</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] text-sky-600 block">
                Savoir-faire Pisciniste & Aménagements Aquatiques
              </span>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {data?.site?.nom || 'Blue 2.0'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 font-bold px-2.5 sm:px-3 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{tauxRecommandation}% de recommandations clients</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-900 font-bold px-2.5 sm:px-3 py-1 rounded-xl border border-sky-200 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Contrôle & Authenticité Garantis</span>
              </span>
            </div>
          </div>

          {/* Bloc Actions : Plaque Note Globale + Bouton Facile Questionnaire */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Plaque Note Globale & Avis de Prestige - Cliquable pour afficher les 6 critères */}
            <button
              type="button"
              onClick={() => setShowCriteriaDetail(!showCriteriaDetail)}
              className="flex items-center justify-between sm:justify-start gap-4 sm:gap-5 bg-white/95 hover:bg-white hover:border-sky-300 hover:shadow-md transition-all duration-200 px-4 py-3 sm:px-5 sm:py-3.5 lg:px-6 lg:py-4 rounded-2xl border border-slate-200/90 shadow-sm cursor-pointer text-left group"
              title={showCriteriaDetail ? 'Masquer le détail des critères' : 'Cliquer pour détailler la note avec les 6 critères'}
            >
              <div className="text-left sm:text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                    {stats?.moyenne_globale ? stats.moyenne_globale.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-400">/ 5</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">
                  Sur <strong className="font-bold text-slate-800">{stats?.total || rawAvisList.length} avis certifié{(stats?.total || rawAvisList.length) > 1 ? 's' : ''}</strong>
                </p>
              </div>

              <div className="h-9 sm:h-10 w-px bg-slate-200" />

              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {[1, 2, 3, 4, 5].map((drop) => {
                    const active = drop <= Math.round(stats?.moyenne_globale || 5);
                    return (
                      <Droplet
                        key={drop}
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 drop-shadow-xs ${
                          active ? 'text-sky-500 fill-sky-500' : 'text-slate-200 fill-slate-200'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] sm:text-[10px] uppercase font-extrabold tracking-widest text-sky-600">
                    Excellence
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-full border border-sky-200/70 group-hover:bg-sky-100 transition">
                    <span>{showCriteriaDetail ? '▲ Masquer' : '▼ 6 critères'}</span>
                  </span>
                </div>
              </div>
            </button>

            {/* Bouton facile d'accès afin de retourner sur le formulaire */}
            <a
              href={`https://blue2-avis.vercel.app/?site=${encodeURIComponent(siteSlug)}`}
              target="_top"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 via-sky-500 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl shadow-md shadow-sky-600/20 hover:shadow-lg hover:shadow-sky-600/30 active:scale-95 transition-all duration-200 touch-manipulation group"
              title="Retourner au formulaire pour donner votre avis"
            >
              <ArrowLeft className="w-4 h-4 text-sky-200 group-hover:-translate-x-0.5 transition-transform shrink-0" />
              <span>Retourner au formulaire</span>
            </a>
          </div>
        </div>

        {/* Baromètre de satisfaction détaillé (6 critères) avec fond clair aéré */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowCriteriaDetail(!showCriteriaDetail)}
              className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1.5 transition touch-manipulation group"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600 group-hover:rotate-12 transition-transform" />
              <span>{showCriteriaDetail ? 'Masquer le baromètre détaillé' : 'Détailler la note globale (les 6 critères de satisfaction certifiés)'}</span>
              {showCriteriaDetail ? <ChevronUp className="w-3.5 h-3.5 text-sky-600" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-600" />}
            </button>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Évaluations certifiées AFNOR NF Z74-501</span>
          </div>

          {showCriteriaDetail && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 animate-in fade-in duration-200">
              {criteriaBreakdown.map((crit, idx) => {
                const IconComponent = crit.icon;
                return (
                  <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <IconComponent className="w-3.5 h-3.5 text-sky-600" />
                        <span>{crit.label}</span>
                      </span>
                      <strong className="font-extrabold text-sky-700 text-xs">{crit.note.toFixed(1)}/5</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 via-sky-500 to-teal-500 rounded-full"
                        style={{ width: `${(crit.note / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CATÉGORIES D'AVIS OPTIMISÉES & INTÉRACTIVES (SANS BLOCAGE DE SCROLL)  */}
      {/* ========================================================================= */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tous */}
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 touch-manipulation ${
              filterType === 'all'
                ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md shadow-sky-600/20 border border-sky-400/40'
                : 'bg-white text-slate-700 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 shadow-2xs'
            }`}
          >
            <span>Tous les avis</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                filterType === 'all' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {rawAvisList.length}
            </span>
          </button>

          {/* Avec photos */}
          {countWithPhotos > 0 && (
            <button
              onClick={() => setFilterType('photos')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 touch-manipulation ${
                filterType === 'photos'
                  ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md shadow-sky-600/20 border border-sky-400/40'
                  : 'bg-white text-slate-700 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 shadow-2xs'
              }`}
            >
              <Camera className={`w-3.5 h-3.5 ${filterType === 'photos' ? 'text-white' : 'text-sky-600'}`} />
              <span>Avec photos de chantier</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  filterType === 'photos' ? 'bg-white/25 text-white' : 'bg-sky-100 text-sky-800'
                }`}
              >
                {countWithPhotos}
              </span>
            </button>
          )}

          {/* Notes 5/5 */}
          {count5Stars > 0 && (
            <button
              onClick={() => setFilterType('5stars')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 touch-manipulation ${
                filterType === '5stars'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 border border-amber-400/40'
                  : 'bg-white text-slate-700 hover:text-amber-700 hover:bg-amber-50 border border-slate-200 shadow-2xs'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${filterType === '5stars' ? 'text-white' : 'text-amber-500'}`} />
              <span>Excellence 5/5</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  filterType === '5stars' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {count5Stars}
              </span>
            </button>
          )}

          {/* Construction piscine */}
          {countPiscine > 0 && (
            <button
              onClick={() => setFilterType('piscine')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 touch-manipulation ${
                filterType === 'piscine'
                  ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md shadow-sky-600/20 border border-sky-400/40'
                  : 'bg-white text-slate-700 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 shadow-2xs'
              }`}
            >
              <span>🏊</span>
              <span>Construction piscine</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  filterType === 'piscine' ? 'bg-white/25 text-white' : 'bg-sky-100 text-sky-800'
                }`}
              >
                {countPiscine}
              </span>
            </button>
          )}

          {/* Spas & Détente */}
          {countSpa > 0 && (
            <button
              onClick={() => setFilterType('spa')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 touch-manipulation ${
                filterType === 'spa'
                  ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md shadow-sky-600/20 border border-sky-400/40'
                  : 'bg-white text-slate-700 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 shadow-2xs'
              }`}
            >
              <span>🫧</span>
              <span>Spas & Balnéo</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  filterType === 'spa' ? 'bg-white/25 text-white' : 'bg-teal-100 text-teal-800'
                }`}
              >
                {countSpa}
              </span>
            </button>
          )}

          {/* Rénovation & Équipements */}
          {countRenov > 0 && (
            <button
              onClick={() => setFilterType('renov')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 touch-manipulation ${
                filterType === 'renov'
                  ? 'bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-md shadow-sky-600/20 border border-sky-400/40'
                  : 'bg-white text-slate-700 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 shadow-2xs'
              }`}
            >
              <span>🛠️</span>
              <span>Rénovation & Équipements</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  filterType === 'renov' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {countRenov}
              </span>
            </button>
          )}

          {/* Bouton reset si filtre actif */}
          {filterType !== 'all' && (
            <button
              onClick={() => setFilterType('all')}
              className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1 touch-manipulation"
            >
              <X className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CARROUSEL D'AVIS HAUT DE GAMME                                         */}
      {/* ========================================================================= */}
      {filteredAvis.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-500 shadow-xs">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-800">Aucun avis trouvé dans cette catégorie.</p>
          <button
            onClick={() => setFilterType('all')}
            className="mt-3 text-xs text-sky-600 font-bold hover:underline"
          >
            Afficher l'ensemble des avis certifiés
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Barre d'en-tête du carrousel avec flèches de navigation */}
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                {filteredAvis.length} avis certifié{filteredAvis.length > 1 ? 's' : ''}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Faites glisser horizontalement
              </span>
            </div>

            {filteredAvis.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleScrollPrev}
                  disabled={!canScrollPrev}
                  aria-label="Avis précédent"
                  className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-300 text-slate-700 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs active:scale-95 touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleScrollNext}
                  disabled={!canScrollNext}
                  aria-label="Avis suivant"
                  className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-sky-50 hover:border-sky-300 text-slate-700 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs active:scale-95 touch-manipulation"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Rail défilant du Carrousel avec Touch Snap */}
          <div
            ref={carouselRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 pt-1 px-1 scrollbar-none touch-pan-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredAvis.map((avis) => {
              const isCriteriaExpanded = expandedAvisId === avis.id;

              return (
                <div
                  key={avis.id}
                  className="w-[86%] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-11px)] shrink-0 snap-start bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 border border-slate-200/90 shadow-[0_4px_24px_-4px_rgba(14,165,233,0.06)] hover:shadow-[0_12px_36px_-6px_rgba(14,165,233,0.12)] hover:border-sky-300 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group"
                >
                  {/* Filigrane décoratif guillemet en arrière-plan */}
                  <div className="absolute right-4 top-2 text-7xl font-serif text-sky-500/5 select-none pointer-events-none">
                    “
                  </div>

                  <div>
                    {/* Header carte avis */}
                    <div className="flex items-start justify-between gap-2.5 mb-3.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-sky-600 via-teal-500 to-sky-400 text-white font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20">
                          {avis.prenom ? avis.prenom.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                              {avis.prenom} {avis.initiale_nom}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                              <span>Vérifié</span>
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                            {new Date(avis.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Note en gouttes lagon - cliquable pour voir le détail des critères */}
                      <button
                        type="button"
                        onClick={() => setExpandedAvisId(isCriteriaExpanded ? null : avis.id)}
                        className="flex items-center gap-0.5 sm:gap-1 bg-sky-50/90 hover:bg-sky-100/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border border-sky-100 hover:border-sky-300 shadow-2xs transition group/badge cursor-pointer shrink-0"
                        title={isCriteriaExpanded ? 'Masquer le détail des notes' : 'Cliquer pour détailler la note (6 critères)'}
                      >
                        {[1, 2, 3, 4, 5].map((d) => (
                          <Droplet
                            key={d}
                            className={`w-3.5 h-3.5 transition-transform group-hover/badge:scale-110 ${
                              d <= Math.round(avis.notes?.moyenne ?? 5)
                                ? 'text-sky-500 fill-sky-500 drop-shadow-[0_1px_3px_rgba(14,165,233,0.3)]'
                                : 'text-slate-200 fill-slate-100'
                            }`}
                          />
                        ))}
                        <span className="text-xs font-black text-sky-900 ml-1">
                          {avis.notes?.moyenne ? avis.notes.moyenne.toFixed(1) : '5.0'}
                        </span>
                        <ChevronDown
                          className={`w-3 h-3 text-sky-600 transition-transform ml-0.5 ${
                            isCriteriaExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Prestation & Collaborateur */}
                    <div className="flex flex-wrap items-center gap-2 mb-3.5">
                      {avis.intitule_prestation && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50/80 border border-sky-200/60 text-sky-900 text-xs font-semibold rounded-xl">
                          <span>🏊</span>
                          <span>{avis.intitule_prestation}</span>
                        </span>
                      )}
                      {avis.collaborateur && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl">
                          <span>👤</span>
                          <span>Conseillé par <strong className="font-bold text-slate-900">{avis.collaborateur.nom}</strong></span>
                        </span>
                      )}
                    </div>

                    {/* Commentaire client */}
                    {avis.commentaire && (
                      <div className="relative mb-4">
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-gradient-to-b from-slate-50/90 to-sky-50/30 p-4 rounded-2xl border border-slate-100">
                          "{avis.commentaire}"
                        </p>
                      </div>
                    )}

                    {/* Accordéon micro-notes de ce client avec baromètres et icônes */}
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={() => setExpandedAvisId(isCriteriaExpanded ? null : avis.id)}
                        className="text-[11px] font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1.5 transition py-1 touch-manipulation group/btn"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-sky-600 group-hover/btn:rotate-12 transition-transform" />
                        <span>{isCriteriaExpanded ? 'Masquer le détail des critères' : 'Détailler la note (6 critères d\'évaluation)'}</span>
                        {isCriteriaExpanded ? <ChevronUp className="w-3.5 h-3.5 text-sky-600" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-600" />}
                      </button>

                      {isCriteriaExpanded && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2.5 animate-in fade-in duration-200">
                          {[
                            { label: 'Conseil', note: avis.notes?.conseil ?? 5, icon: Compass },
                            { label: 'Choix', note: avis.notes?.diversite ?? 5, icon: Layers },
                            { label: 'Propreté', note: avis.notes?.proprete ?? 5, icon: Sparkle },
                            { label: 'Délais', note: avis.notes?.engagements ?? 5, icon: Clock },
                            { label: 'Qualité/Prix', note: avis.notes?.qualite_prix ?? 5, icon: Scale },
                            { label: 'Recommandation', note: avis.notes?.recommandation ?? 5, icon: HeartHandshake },
                          ].map((crit, cIdx) => {
                            const CritIcon = crit.icon;
                            return (
                              <div
                                key={cIdx}
                                className="bg-gradient-to-br from-slate-50 to-sky-50/40 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between"
                              >
                                <div className="flex items-center justify-between text-[11px] mb-1.5">
                                  <span className="text-slate-600 font-semibold flex items-center gap-1 truncate">
                                    <CritIcon className="w-3 h-3 text-sky-600 shrink-0" />
                                    <span className="truncate">{crit.label}</span>
                                  </span>
                                  <strong className="text-sky-800 font-black shrink-0 ml-1">{crit.note}/5</strong>
                                </div>
                                <div className="w-full h-1 bg-slate-200/80 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-sky-400 to-teal-500 rounded-full"
                                    style={{ width: `${(crit.note / 5) * 100}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Galerie Photos avec conversion WebP HD */}
                    {avis.photos && avis.photos.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 mb-2.5">
                          <Camera className="w-3.5 h-3.5 text-sky-600" />
                          <span>Photos du chantier ({avis.photos.length})</span>
                        </span>
                        <div className="flex flex-wrap gap-2.5">
                          {avis.photos.map((photo, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => setSelectedPhoto(photo.original || photo.thumbnail)}
                              className="group relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-sky-500 transition-all duration-200 shrink-0 active:scale-95 shadow-xs"
                              title="Agrandir la photo de chantier en haute résolution"
                            >
                              <img
                                src={photo.thumbnail || photo.original}
                                alt="Photo chantier client"
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                loading="lazy"
                              />
                              {/* Overlay avec icône loupe */}
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                              </div>
                              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-mono font-bold px-1 py-0.5 rounded">
                                HD
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicateur de pagination à puces */}
          {filteredAvis.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              {filteredAvis.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => scrollToIndex(dotIdx)}
                  aria-label={`Aller à l'avis ${dotIdx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dotIdx === activeSlideIndex
                      ? 'w-6 bg-sky-600'
                      : 'w-2 bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FOOTER & INVITATION AU QUESTIONNAIRE                                   */}
      {/* ========================================================================= */}
      <div className="mt-8 bg-gradient-to-r from-sky-50/70 via-white to-sky-50/70 rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Vous avez un projet réalisé avec {data?.site?.nom || 'Blue 2.0'} ?
            </h4>
            <p className="text-[11px] text-slate-500">
              Votre avis certifié guide nos futurs clients et valorise le travail de nos équipes.
            </p>
          </div>
        </div>

        <a
          href={`https://blue2-avis.vercel.app/?site=${encodeURIComponent(siteSlug)}`}
          target="_top"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 shrink-0 w-full sm:w-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-sky-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Retourner au formulaire</span>
        </a>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Système d'avis certifié Blue 2.0 • Norme AFNOR NF Z74-501 • Données protégées</span>
      </div>

      {/* ========================================================================= */}
      {/* 5. LIGHTBOX PHOTO HD PLEIN ÉCRAN CINÉMATIQUE                             */}
      {/* ========================================================================= */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[92vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between pb-3 text-white/90 text-xs font-semibold">
              <span className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-xs">
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Photo de chantier HD (Format WebP optimisé)</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedPhoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Plein écran</span>
                </a>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition"
                  title="Fermer la vue"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <img
              src={selectedPhoto}
              alt="Photo de chantier agrandie HD"
              className="max-w-full max-h-[82vh] rounded-3xl object-contain shadow-2xl border border-white/10"
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
        <div className="p-12 flex flex-col items-center justify-center font-sans space-y-3">
          <div className="w-10 h-10 rounded-full border-3 border-sky-200 border-t-sky-600 animate-spin"></div>
          <p className="text-xs text-slate-400 font-semibold tracking-wide">Chargement du widget...</p>
        </div>
      }
    >
      <WidgetContent />
    </Suspense>
  );
}
