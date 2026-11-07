'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Building,
  Users,
  MessageSquare,
  Send,
  Code2,
  Database,
  CheckCircle,
  EyeOff,
  Trash2,
  Plus,
  RefreshCw,
  Copy,
  ExternalLink,
  Search,
  Filter,
  AlertTriangle,
  Download,
  Edit3,
  RotateCcw,
  X,
  Droplet,
  ArrowRight,
  Trophy,
  Medal,
  Award,
  Crown,
  BarChart3,
  Calendar,
  Sparkles,
  TrendingUp,
  Camera,
  ThumbsUp,
  ArrowLeft,
} from 'lucide-react';
import { Site, Collaborateur, Avis, CRITERIA } from '@/lib/types';
import { resolvePhotoUrls } from '@/lib/photo-utils';

export default function AdminPage() {
  // Navigation
  const [tab, setTab] = useState<'dashboard' | 'avis' | 'collabs' | 'sites' | 'send' | 'widget'>('dashboard');

  // Données
  const [avisList, setAvisList] = useState<Avis[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtres Dashboard / Analytics
  const [durationFilter, setDurationFilter] = useState<'7d' | '30d' | 'month' | 'year' | 'all'>('30d');
  const [analyticsSiteFilter, setAnalyticsSiteFilter] = useState<string>('all');

  // Filtres Avis
  const [filterSite, setFilterSite] = useState<string>('all');
  const [filterCollab, setFilterCollab] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all'); // 'all' | 'approuve' | 'masque' | 'en_attente' | 'corbeille'
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filtres Collaborateurs
  const [collabFilterSite, setCollabFilterSite] = useState<string>('all');
  const [collabSearchTerm, setCollabSearchTerm] = useState<string>('');

  // Modal / Édition Collaborateur
  const [editingCollab, setEditingCollab] = useState<Collaborateur | null>(null);
  const [editCollabNom, setEditCollabNom] = useState('');
  const [editCollabRole, setEditCollabRole] = useState('');
  const [editCollabSiteId, setEditCollabSiteId] = useState('');
  const [editCollabActif, setEditCollabActif] = useState(true);
  const [isSavingCollab, setIsSavingCollab] = useState(false);

  // Modal / Édition Agence
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [editSiteNom, setEditSiteNom] = useState('');
  const [editSiteSlug, setEditSiteSlug] = useState('');
  const [editSiteActif, setEditSiteActif] = useState(true);
  const [isSavingSite, setIsSavingSite] = useState(false);

  // Ajout Nouveau Site / Collaborateur
  const [newSiteNom, setNewSiteNom] = useState('');
  const [newSiteSlug, setNewSiteSlug] = useState('');
  const [newCollabNom, setNewCollabNom] = useState('');
  const [newCollabRole, setNewCollabRole] = useState('Conseiller Expert Piscines & Spas');
  const [newCollabSiteId, setNewCollabSiteId] = useState('');

  // Envoyer un questionnaire
  const [sendSiteId, setSendSiteId] = useState('');
  const [sendCollabId, setSendCollabId] = useState('');
  const [sendNom, setSendNom] = useState('');
  const [sendPrenom, setSendPrenom] = useState('');
  const [sendEmail, setSendEmail] = useState('');
  const [sendTel, setSendTel] = useState('');
  const [sendSociete, setSendSociete] = useState('');
  const [sendPrestation, setSendPrestation] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Widget preview & tutoriel
  const [widgetSiteSlug, setWidgetSiteSlug] = useState('saint-die-vosges');
  const [tutorialTab, setTutorialTab] = useState<'wordpress' | 'react' | 'webflow' | 'wix' | 'html'>('wordpress');

  // Keepalive test
  const [cronReport, setCronReport] = useState<any>(null);
  const [pingingCron, setPingingCron] = useState(false);

  // Client time for safe prerendering in Next.js 16
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    setCurrentTime(Date.now());
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAvis, resSites, resCollabs] = await Promise.all([
        fetch('/api/admin/avis'),
        fetch('/api/admin/sites'),
        fetch('/api/admin/collaborateurs'),
      ]);

      const dataAvis = await resAvis.json();
      const dataSites = await resSites.json();
      const dataCollabs = await resCollabs.json();

      setAvisList(dataAvis.avis || []);
      setSites(dataSites.sites || []);
      setCollaborateurs(dataCollabs.collaborateurs || []);

      if (dataSites.sites?.length > 0) {
        if (!newCollabSiteId) setNewCollabSiteId(dataSites.sites[0].id);
        if (!sendSiteId) setSendSiteId(dataSites.sites[0].id);
        if (!widgetSiteSlug) setWidgetSiteSlug(dataSites.sites[0].slug);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const notifyWidgetUpdate = () => {
    try {
      const channel = new BroadcastChannel('blue2_avis_channel');
      channel.postMessage({ type: 'AVIS_UPDATED', timestamp: Date.now() });
      channel.close();
    } catch {}
  };

  // Actions Avis
  const handleUpdateAvisStatut = async (id: string, statut: 'approuve' | 'masque') => {
    try {
      const res = await fetch(`/api/admin/avis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      });
      if (res.ok) {
        setAvisList((prev) =>
          prev.map((a) => (a.id === id ? { ...a, statut } : a))
        );
        notifyWidgetUpdate();
      }
    } catch {
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleSoftDeleteAvis = async (id: string) => {
    if (!confirm('Déplacer cet avis dans la corbeille ? Il sera conservé pendant 7 jours et restera facilement récupérable d\'un simple clic.')) return;
    try {
      const res = await fetch(`/api/admin/avis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'soft_delete' }),
      });
      if (res.ok) {
        setAvisList((prev) =>
          prev.map((a) => (a.id === id ? { ...a, deleted_at: new Date().toISOString() } : a))
        );
        notifyWidgetUpdate();
        fetchData();
      }
    } catch {
      alert('Erreur lors du déplacement dans la corbeille');
    }
  };

  const handleRestoreAvis = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/avis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', statut: 'approuve' }),
      });
      if (res.ok) {
        setAvisList((prev) =>
          prev.map((a) => (a.id === id ? { ...a, deleted_at: null, statut: 'approuve' } : a))
        );
        notifyWidgetUpdate();
        alert('Avis restauré avec succès ! Il est de nouveau en ligne.');
        fetchData();
      }
    } catch {
      alert('Erreur lors de la restauration de l\'avis');
    }
  };

  // Actions Collaborateurs (Modification)
  const handleStartEditCollab = (c: Collaborateur) => {
    setEditingCollab(c);
    setEditCollabNom(c.nom);
    setEditCollabRole(c.role || '');
    setEditCollabSiteId(c.site_id);
    setEditCollabActif(c.actif);
  };

  const handleSaveEditCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollab || !editCollabNom.trim()) return;
    setIsSavingCollab(true);
    try {
      const res = await fetch('/api/admin/collaborateurs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCollab.id,
          nom: editCollabNom.trim(),
          role: editCollabRole.trim(),
          site_id: editCollabSiteId,
          actif: editCollabActif,
        }),
      });
      if (res.ok) {
        await fetchData();
        setEditingCollab(null);
      } else {
        alert('Erreur lors de l\'enregistrement des modifications');
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setIsSavingCollab(false);
    }
  };

  const handleToggleCollab = async (collab: Collaborateur) => {
    try {
      const res = await fetch('/api/admin/collaborateurs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: collab.id, actif: !collab.actif }),
      });
      if (res.ok) {
        setCollaborateurs((prev) =>
          prev.map((c) => (c.id === collab.id ? { ...c, actif: !c.actif } : c))
        );
      }
    } catch {
      alert('Erreur');
    }
  };

  const handleDeleteCollab = async (collab: Collaborateur) => {
    if (!confirm(`Supprimer le collaborateur ${collab.nom} ? (Suppression logique)`)) return;
    try {
      const res = await fetch('/api/admin/collaborateurs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: collab.id, action: 'soft_delete' }),
      });
      if (res.ok) {
        setCollaborateurs((prev) => prev.filter((c) => c.id !== collab.id));
      }
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  const handleAddCollaborateur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollabNom.trim() || !newCollabSiteId) return;
    try {
      const res = await fetch('/api/admin/collaborateurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: newCollabNom.trim(),
          role: newCollabRole.trim(),
          site_id: newCollabSiteId,
        }),
      });
      if (res.ok) {
        setNewCollabNom('');
        await fetchData();
        alert('Collaborateur ajouté avec succès !');
      }
    } catch {
      alert('Erreur lors de l\'ajout');
    }
  };

  // Actions Sites
  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteNom.trim() || !newSiteSlug.trim()) return;
    try {
      const res = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newSiteNom.trim(), slug: newSiteSlug.trim() }),
      });
      if (res.ok) {
        setNewSiteNom('');
        setNewSiteSlug('');
        await fetchData();
        alert('Agence ajoutée avec succès !');
      }
    } catch {
      alert('Erreur lors de l\'ajout de l\'agence');
    }
  };

  const handleToggleSite = async (site: Site) => {
    try {
      const res = await fetch('/api/admin/sites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: site.id, actif: !site.actif }),
      });
      if (res.ok) {
        setSites((prev) =>
          prev.map((s) => (s.id === site.id ? { ...s, actif: !s.actif } : s))
        );
      }
    } catch {
      alert('Erreur');
    }
  };

  const handleStartEditSite = (site: Site) => {
    setEditingSite(site);
    setEditSiteNom(site.nom);
    setEditSiteSlug(site.slug);
    setEditSiteActif(site.actif);
  };

  const handleSaveEditSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite || !editSiteNom.trim() || !editSiteSlug.trim()) return;
    setIsSavingSite(true);
    try {
      const res = await fetch('/api/admin/sites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSite.id,
          nom: editSiteNom.trim(),
          slug: editSiteSlug.trim().toLowerCase(),
          actif: editSiteActif,
        }),
      });
      if (res.ok) {
        await fetchData();
        setEditingSite(null);
      } else {
        alert("Erreur lors de l'enregistrement de l'agence");
      }
    } catch {
      alert('Erreur réseau');
    } finally {
      setIsSavingSite(false);
    }
  };

  const handleDeleteSite = async (site: Site) => {
    if (
      !confirm(
        `Supprimer l'agence "${site.nom}" ?\n\n(Ses collaborateurs et avis existants restent conservés en base de données)`
      )
    )
      return;
    try {
      const res = await fetch('/api/admin/sites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: site.id, action: 'soft_delete' }),
      });
      if (res.ok) {
        setSites((prev) => prev.filter((s) => s.id !== site.id));
      } else {
        alert("Erreur lors de la suppression de l'agence.");
      }
    } catch {
      alert('Erreur réseau lors de la suppression.');
    }
  };

  // Générateur de lien questionnaire
  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    const siteObj = sites.find((s) => s.id === sendSiteId);
    const params = new URLSearchParams();
    if (siteObj?.slug) params.set('site', siteObj.slug);
    if (sendCollabId) params.set('collab', sendCollabId);
    if (sendNom) params.set('nom', sendNom);
    if (sendPrenom) params.set('prenom', sendPrenom);
    if (sendEmail) params.set('email', sendEmail);
    if (sendTel) params.set('tel', sendTel);
    if (sendSociete) params.set('societe', sendSociete);
    if (sendPrestation) params.set('prestation', sendPrestation);

    const base = typeof window !== 'undefined' ? window.location.origin : 'https://blue2-avis.vercel.app';
    const link = `${base}/?${params.toString()}`;
    setGeneratedLink(link);
    setCopySuccess(false);
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Télécharger JSON de sauvegarde
  const handleDownloadBackup = () => {
    const data = {
      backup_date: new Date().toISOString(),
      sites,
      collaborateurs,
      avis: avisList,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-blue2-avis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Test keepalive
  const handleTriggerKeepalive = async () => {
    setPingingCron(true);
    try {
      const res = await fetch('/api/cron/backup-and-keepalive');
      const data = await res.json();
      setCronReport(data);
    } catch (err: any) {
      setCronReport({ error: err.message });
    } finally {
      setPingingCron(false);
    }
  };

  // Séparation Avis Actifs vs Corbeille
  const activeAvisList = avisList.filter((a) => !a.deleted_at);
  const corbeilleAvisList = avisList.filter((a) => Boolean(a.deleted_at));

  // =========================================================================
  // CALCULS ANALYTICS / DASHBOARD / PODIUM
  // =========================================================================
  const getDurationStartDate = () => {
    if (!currentTime) return new Date(0);
    const now = new Date(currentTime);
    if (durationFilter === '7d') return new Date(now.getTime() - 7 * 86400000);
    if (durationFilter === '30d') return new Date(now.getTime() - 30 * 86400000);
    if (durationFilter === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
    if (durationFilter === 'year') return new Date(now.getFullYear(), 0, 1);
    return new Date(0); // 'all'
  };

  const startDate = getDurationStartDate();

  // Avis valides sur la période (non supprimés, approuvés)
  const periodAvis = avisList.filter((a) => {
    if (a.deleted_at) return false;
    if (a.statut !== 'approuve') return false;
    const avisDate = new Date(a.created_at);
    return avisDate >= startDate;
  });

  // Avis filtrés par agence si sélectionnée
  const periodAvisFiltered =
    analyticsSiteFilter === 'all'
      ? periodAvis
      : periodAvis.filter((a) => a.site_id === analyticsSiteFilter);

  // KPIs globaux
  const totalReviewsPeriod = periodAvisFiltered.length;
  const avgScorePeriod =
    totalReviewsPeriod > 0
      ? Math.round(
          (periodAvisFiltered.reduce(
            (sum, a) =>
              sum +
              (a.note_conseil +
                a.note_diversite +
                a.note_proprete +
                a.note_engagements +
                a.note_qualite_prix +
                a.note_recommandation) /
                6,
            0
          ) /
            totalReviewsPeriod) *
            10
        ) / 10
      : 0;

  const totalRecommandes = periodAvisFiltered.filter(
    (a) => a.note_recommandation >= 4
  ).length;
  const tauxRecommandation =
    totalReviewsPeriod > 0
      ? Math.round((totalRecommandes / totalReviewsPeriod) * 100)
      : 0;

  const totalPhotosPeriod = periodAvisFiltered.reduce(
    (sum, a) => sum + (a.photos?.length || 0),
    0
  );

  // Classement des Collaborateurs sur la période
  const collabsRanked = collaborateurs
    .filter((c) => analyticsSiteFilter === 'all' || c.site_id === analyticsSiteFilter)
    .map((c) => {
      const cAvis = periodAvis.filter((a) => a.collaborateur_id === c.id);
      const count = cAvis.length;
      const avg = (fn: (a: Avis) => number) =>
        count > 0
          ? Math.round((cAvis.reduce((s, a) => s + fn(a), 0) / count) * 10) / 10
          : 0;

      const moyConseil = avg((a) => a.note_conseil);
      const moyDiversite = avg((a) => a.note_diversite);
      const moyProprete = avg((a) => a.note_proprete);
      const moyEngagements = avg((a) => a.note_engagements);
      const moyQualitePrix = avg((a) => a.note_qualite_prix);
      const moyRecommandation = avg((a) => a.note_recommandation);
      const moyGlobale =
        count > 0
          ? Math.round(
              ((moyConseil +
                moyDiversite +
                moyProprete +
                moyEngagements +
                moyQualitePrix +
                moyRecommandation) /
                6) *
                10
            ) / 10
          : 0;

      const siteObj = sites.find((s) => s.id === c.site_id);

      return {
        ...c,
        siteNom: siteObj?.nom || 'Agence Blue 2.0',
        siteSlug: siteObj?.slug || '',
        periodAvisCount: count,
        periodAvgScore: moyGlobale,
        scores: {
          conseil: moyConseil,
          diversite: moyDiversite,
          proprete: moyProprete,
          engagements: moyEngagements,
          qualitePrix: moyQualitePrix,
          recommandation: moyRecommandation,
        },
      };
    })
    .sort((a, b) => {
      if (b.periodAvisCount === 0 && a.periodAvisCount === 0) return a.nom.localeCompare(b.nom);
      if (b.periodAvisCount === 0) return -1;
      if (a.periodAvisCount === 0) return 1;
      if (b.periodAvgScore !== a.periodAvgScore) return b.periodAvgScore - a.periodAvgScore;
      return b.periodAvisCount - a.periodAvisCount;
    });

  // Classement des Agences sur la période (quand 'all' sélectionné)
  const sitesRanked = sites
    .map((s) => {
      const sAvis = periodAvis.filter((a) => a.site_id === s.id);
      const count = sAvis.length;
      const avg = (fn: (a: Avis) => number) =>
        count > 0
          ? Math.round((sAvis.reduce((sum, a) => sum + fn(a), 0) / count) * 10) / 10
          : 0;

      const moyGlobale =
        count > 0
          ? Math.round(
              ((avg((a) => a.note_conseil) +
                avg((a) => a.note_diversite) +
                avg((a) => a.note_proprete) +
                avg((a) => a.note_engagements) +
                avg((a) => a.note_qualite_prix) +
                avg((a) => a.note_recommandation)) /
                6) *
                10
            ) / 10
          : 0;

      const totalRec = sAvis.filter((a) => a.note_recommandation >= 4).length;
      const tauxRec = count > 0 ? Math.round((totalRec / count) * 100) : 0;

      return {
        ...s,
        periodAvisCount: count,
        periodAvgScore: moyGlobale,
        tauxRecommandation: tauxRec,
      };
    })
    .sort((a, b) => {
      if (b.periodAvisCount === 0 && a.periodAvisCount === 0) return a.nom.localeCompare(b.nom);
      if (b.periodAvisCount === 0) return -1;
      if (a.periodAvisCount === 0) return 1;
      if (b.periodAvgScore !== a.periodAvgScore) return b.periodAvgScore - a.periodAvgScore;
      return b.periodAvisCount - a.periodAvisCount;
    });

  // Filtrage des avis pour l'onglet Avis
  const filteredAvis = avisList.filter((a) => {
    if (filterStatut === 'corbeille') {
      if (!a.deleted_at) return false;
    } else {
      if (a.deleted_at) return false;
      if (filterStatut !== 'all' && a.statut !== filterStatut) return false;
    }

    if (filterSite !== 'all' && a.site_id !== filterSite) return false;
    if (filterCollab !== 'all' && a.collaborateur_id !== filterCollab) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchNom = a.nom.toLowerCase().includes(term) || a.prenom.toLowerCase().includes(term);
      const matchComment = a.commentaire?.toLowerCase().includes(term) || false;
      const matchPrestation = a.intitule_prestation?.toLowerCase().includes(term) || false;
      if (!matchNom && !matchComment && !matchPrestation) return false;
    }
    return true;
  });

  // Filtrage des collaborateurs pour l'onglet Collaborateurs
  const filteredCollabs = collaborateurs.filter((c) => {
    if (collabFilterSite !== 'all' && c.site_id !== collabFilterSite) return false;
    if (collabSearchTerm) {
      const term = collabSearchTerm.toLowerCase();
      const matchNom = c.nom.toLowerCase().includes(term);
      const matchRole = c.role?.toLowerCase().includes(term) || false;
      if (!matchNom && !matchRole) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-20 overflow-x-hidden w-full max-w-full">
      {/* Top Navbar Admin */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md w-full max-w-full">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base">Admin • Blue 2.0</span>
              <span className="hidden sm:inline-block ml-2 text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Postgres Neon & R2 connectés
              </span>
            </div>
          </div>

          {/* Bouton Revenir au questionnaire */}
          <a
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white border border-slate-700 hover:border-slate-600 transition text-xs sm:text-sm font-bold shadow-xs active:scale-95 group"
            title="Revenir au formulaire d'avis Blue 2.0"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Revenir au questionnaire</span>
          </a>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto border-t border-slate-800 scrollbar-none">
          <button
            onClick={() => setTab('dashboard')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              tab === 'dashboard'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard & Podium</span>
          </button>

          <button
            onClick={() => setTab('avis')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              tab === 'avis'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Avis & Modération</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300">
              {activeAvisList.length}
            </span>
            {corbeilleAvisList.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {corbeilleAvisList.length} corbeille
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('collabs')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              tab === 'collabs'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Collaborateurs & Notes</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] rounded-full bg-slate-800 text-slate-300">
              {collaborateurs.length}
            </span>
          </button>

          <button
            onClick={() => setTab('sites')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              tab === 'sites'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Agences ({sites.length})</span>
          </button>

          <button
            onClick={() => setTab('send')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              tab === 'send'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Envoyer un questionnaire</span>
          </button>

          <button
            onClick={() => setTab('widget')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              tab === 'widget'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Intégration & Sauvegardes</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6">
        {/* ========================================================= */}
        {/* ONGLET 0 : DASHBOARD & PODIUM CLASSEMENT */}
        {/* ========================================================= */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Barre de sélection : Durée & Agences */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Sélecteur de période */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>Période analysée</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: '7d', label: '7 derniers jours' },
                    { id: '30d', label: '30 derniers jours' },
                    { id: 'month', label: 'Ce mois-ci' },
                    { id: 'year', label: 'Cette année' },
                    { id: 'all', label: 'Tout l\'historique' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setDurationFilter(p.id as any)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                        durationFilter === p.id
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélecteur d'agences */}
              <div className="space-y-1.5 w-full md:w-auto md:min-w-[260px]">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-sky-600" />
                  <span>Périmètre géographique</span>
                </label>
                <select
                  value={analyticsSiteFilter}
                  onChange={(e) => setAnalyticsSiteFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="all">🏆 Toutes les agences (Réseau Blue 2.0 national)</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      📍 {s.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4 Cartes KPIs clés */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-sky-600 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Avis certifiés
                  </span>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900">
                  {totalReviewsPeriod}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sur la période sélectionnée
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-sky-600 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Satisfaction globale
                  </span>
                  <Droplet className="w-4 h-4 fill-sky-500 text-sky-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-sky-600 flex items-baseline gap-1">
                  <span>{avgScorePeriod > 0 ? avgScorePeriod : '-'}</span>
                  <span className="text-xs font-normal text-slate-400">/5</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Moyenne sur les 6 critères
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-emerald-600 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Recommandation
                  </span>
                  <ThumbsUp className="w-4 h-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                  {totalReviewsPeriod > 0 ? `${tauxRecommandation}%` : '-'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Clients prêts à recommander (≥ 4/5)
                </p>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-indigo-600 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Photos chantiers
                  </span>
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-600">
                  {totalPhotosPeriod}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Photos HD sur Cloudflare R2
                </p>
              </div>
            </div>

            {/* PODIUM DES COLLABORATEURS */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>
                      Podium des Collaborateurs{' '}
                      {analyticsSiteFilter !== 'all'
                        ? `• ${sites.find((s) => s.id === analyticsSiteFilter)?.nom}`
                        : '• Réseau National'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Classement établi selon la note moyenne en gouttes d'eau et le nombre d'avis certifiés
                  </p>
                </div>

                <button
                  onClick={() => setTab('collabs')}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <span>Gérer tous les collaborateurs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Les 3 Marches du Podium */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 items-end">
                {/* 🥈 2ème Place (Argent) */}
                <div className="order-2 md:order-1 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 rounded-3xl p-5 border border-slate-300 shadow-sm text-center relative flex flex-col justify-between min-h-[220px]">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-slate-200 text-slate-700 text-xs font-black rounded-full border border-slate-300 flex items-center gap-1 shadow-xs">
                    <Medal className="w-3.5 h-3.5" />
                    <span>2ème place</span>
                  </div>

                  {collabsRanked[1] ? (
                    <div className="pt-2">
                      <div className="w-14 h-14 mx-auto rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-base shadow-inner mb-3">
                        {collabsRanked[1].nom
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{collabsRanked[1].nom}</h4>
                      <p className="text-xs text-slate-500">{collabsRanked[1].role || 'Conseiller'}</p>
                      <p className="text-[11px] text-sky-700 font-medium mt-0.5">
                        {collabsRanked[1].siteNom}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-around">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Note</span>
                          <span className="text-base font-extrabold text-sky-600 flex items-center justify-center gap-0.5">
                            <Droplet className="w-3.5 h-3.5 fill-sky-500 text-sky-500" />
                            {collabsRanked[1].periodAvgScore > 0 ? collabsRanked[1].periodAvgScore : '-'}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Avis</span>
                          <span className="text-base font-extrabold text-slate-800">
                            {collabsRanked[1].periodAvisCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-xs text-slate-400 italic">Position disponible</div>
                  )}
                </div>

                {/* 🥇 1ère Place (Or - Au centre et plus haute) */}
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 via-white to-amber-50/40 rounded-3xl p-6 border-2 border-amber-300 shadow-md text-center relative flex flex-col justify-between min-h-[250px] ring-4 ring-amber-100/50">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-xs font-black rounded-full border border-amber-300 flex items-center gap-1.5 shadow-sm">
                    <Crown className="w-3.5 h-3.5 fill-amber-950" />
                    <span>1ère place • Leader</span>
                  </div>

                  {collabsRanked[0] ? (
                    <div className="pt-2">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-amber-300 to-amber-400 text-amber-950 flex items-center justify-center font-black text-lg shadow-md shadow-amber-500/20 mb-3 border-2 border-white">
                        {collabsRanked[0].nom
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base">
                        {collabsRanked[0].nom}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {collabsRanked[0].role || 'Conseiller'}
                      </p>
                      <p className="text-xs text-sky-800 font-bold mt-0.5">
                        📍 {collabsRanked[0].siteNom}
                      </p>

                      <div className="mt-4 pt-3 border-t border-amber-200/80 flex items-center justify-around bg-white/70 rounded-2xl p-2 shadow-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Note moyenne</span>
                          <span className="text-lg font-black text-sky-600 flex items-center justify-center gap-0.5">
                            <Droplet className="w-4 h-4 fill-sky-500 text-sky-500" />
                            {collabsRanked[0].periodAvgScore > 0 ? collabsRanked[0].periodAvgScore : '-'}
                            <span className="text-xs text-slate-400 font-normal">/5</span>
                          </span>
                        </div>
                        <div className="h-7 w-px bg-amber-200" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Avis reçus</span>
                          <span className="text-lg font-black text-slate-900">
                            {collabsRanked[0].periodAvisCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 text-xs text-slate-400 italic">Position disponible</div>
                  )}
                </div>

                {/* 🥉 3ème Place (Bronze) */}
                <div className="order-3 bg-gradient-to-b from-orange-50/60 via-white to-orange-50/30 rounded-3xl p-5 border border-orange-200 shadow-sm text-center relative flex flex-col justify-between min-h-[220px]">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-orange-100 text-orange-900 text-xs font-black rounded-full border border-orange-200 flex items-center gap-1 shadow-xs">
                    <Award className="w-3.5 h-3.5" />
                    <span>3ème place</span>
                  </div>

                  {collabsRanked[2] ? (
                    <div className="pt-2">
                      <div className="w-14 h-14 mx-auto rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-black text-base shadow-inner mb-3">
                        {collabsRanked[2].nom
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{collabsRanked[2].nom}</h4>
                      <p className="text-xs text-slate-500">{collabsRanked[2].role || 'Conseiller'}</p>
                      <p className="text-[11px] text-sky-700 font-medium mt-0.5">
                        {collabsRanked[2].siteNom}
                      </p>

                      <div className="mt-4 pt-3 border-t border-orange-200/60 flex items-center justify-around">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Note</span>
                          <span className="text-base font-extrabold text-sky-600 flex items-center justify-center gap-0.5">
                            <Droplet className="w-3.5 h-3.5 fill-sky-500 text-sky-500" />
                            {collabsRanked[2].periodAvgScore > 0 ? collabsRanked[2].periodAvgScore : '-'}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-orange-200" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Avis</span>
                          <span className="text-base font-extrabold text-slate-800">
                            {collabsRanked[2].periodAvisCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-xs text-slate-400 italic">Position disponible</div>
                  )}
                </div>
              </div>
            </div>

            {/* PODIUM DES AGENCES (Quand le périmètre National est sélectionné) */}
            {analyticsSiteFilter === 'all' && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Building className="w-4 h-4 text-sky-600" />
                  <span>Classement des Agences du Réseau Blue 2.0</span>
                </h3>

                <div className="divide-y divide-slate-100">
                  {sitesRanked.map((s, idx) => (
                    <div
                      key={s.id}
                      className="py-3 sm:py-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-2xl transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-700'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-900'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{s.nom}</h4>
                          <span className="text-xs text-slate-500">
                            {s.periodAvisCount} avis déposé(s) • Taux de recommandation :{' '}
                            <strong>{s.tauxRecommandation}%</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-base font-black text-sky-600 flex items-center justify-end gap-0.5">
                            <Droplet className="w-4 h-4 fill-sky-500 text-sky-500" />
                            {s.periodAvgScore > 0 ? s.periodAvgScore : '-'}
                            <span className="text-xs text-slate-400 font-normal">/5</span>
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setAnalyticsSiteFilter(s.id);
                          }}
                          className="text-xs text-sky-600 font-bold hover:underline hidden sm:inline"
                        >
                          Filtrer cette agence
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tableau complet du classement des collaborateurs */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Tableau de classement complet des collaborateurs
                  </h4>
                  <p className="text-xs text-slate-500">
                    {collabsRanked.length} collaborateur(s) au total
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Rang</th>
                      <th className="py-3 px-4">Collaborateur</th>
                      <th className="py-3 px-4">Agence</th>
                      <th className="py-3 px-4 text-center">Avis</th>
                      <th className="py-3 px-4 text-center">Note Globale</th>
                      <th className="py-3 px-4 text-center">Conseil</th>
                      <th className="py-3 px-4 text-center">Propreté</th>
                      <th className="py-3 px-4 text-center">Engagements</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {collabsRanked.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-black">
                          {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {c.nom}
                          <span className="block text-[11px] font-normal text-slate-400">
                            {c.role || 'Conseiller'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{c.siteNom}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {c.periodAvisCount}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-black text-sky-600 inline-flex items-center gap-0.5">
                            <Droplet className="w-3 h-3 fill-sky-500 text-sky-500" />
                            {c.periodAvgScore > 0 ? c.periodAvgScore : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 font-medium">
                          {c.scores.conseil || '-'}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 font-medium">
                          {c.scores.proprete || '-'}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 font-medium">
                          {c.scores.engagements || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setFilterCollab(c.id);
                              setTab('avis');
                            }}
                            className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition"
                          >
                            Voir avis
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 1 : AVIS & MODERATION (AVEC CORBEILLE 7 JOURS) */}
        {/* ========================================================= */}
        {tab === 'avis' && (
          <div className="space-y-4">
            {/* Barre de filtres rapides Statuts */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFilterStatut('all')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    filterStatut === 'all'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tous les avis actifs ({activeAvisList.length})
                </button>
                <button
                  onClick={() => setFilterStatut('approuve')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    filterStatut === 'approuve'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Approuvés ({activeAvisList.filter((a) => a.statut === 'approuve').length})
                </button>
                <button
                  onClick={() => setFilterStatut('en_attente')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    filterStatut === 'en_attente'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  En attente ({activeAvisList.filter((a) => a.statut === 'en_attente').length})
                </button>
                <button
                  onClick={() => setFilterStatut('masque')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                    filterStatut === 'masque'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Masqués ({activeAvisList.filter((a) => a.statut === 'masque').length})
                </button>
                <button
                  onClick={() => setFilterStatut('corbeille')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
                    filterStatut === 'corbeille'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Corbeille ({corbeilleAvisList.length})</span>
                </button>
              </div>

              {/* Filtre collaborateur actif si sélectionné */}
              {filterCollab !== 'all' && (
                <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-800 px-3 py-1 rounded-xl text-xs">
                  <span>Filtré par collaborateur</span>
                  <button
                    onClick={() => setFilterCollab('all')}
                    className="font-bold hover:text-sky-950 ml-1"
                  >
                    × Tout afficher
                  </button>
                </div>
              )}
            </div>

            {/* Bannière explicative pour la Corbeille */}
            {filterStatut === 'corbeille' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 text-xs">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-rose-950 mb-0.5">
                    Corbeille de rétention (7 jours)
                  </p>
                  <p className="text-rose-700 leading-relaxed">
                    Les avis supprimés sont conservés ici pendant 1 semaine avant purge définitive. Vous pouvez les restaurer d'un simple clic sur le bouton vert <strong>« Restaurer l'avis »</strong> à tout moment.
                  </p>
                </div>
              </div>
            )}

            {/* Filtres secondaires : Agence & Recherche */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filtrer par agence :</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
                  <select
                    value={filterSite}
                    onChange={(e) => setFilterSite(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
                  >
                    <option value="all">Toutes les agences</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nom}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterCollab}
                    onChange={(e) => setFilterCollab(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
                  >
                    <option value="all">Tous les collaborateurs</option>
                    {collaborateurs
                      .filter((c) => filterSite === 'all' || c.site_id === filterSite)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nom}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="relative w-full md:w-auto md:min-w-[240px]">
                <input
                  type="text"
                  placeholder="Rechercher client, texte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-base sm:text-xs text-slate-800"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Liste des avis */}
            {filteredAvis.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-sm">
                  {filterStatut === 'corbeille' ? 'La corbeille est vide.' : 'Aucun avis correspondant'}
                </p>
                <p className="text-xs mt-1">
                  {filterStatut === 'corbeille'
                    ? 'Aucun avis n\'a été supprimé récemment.'
                    : 'Modifiez vos filtres ou effectuez un test via le formulaire public.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAvis.map((avis) => {
                  const siteName =
                    sites.find((s) => s.id === avis.site_id)?.nom || (avis.sites as any)?.nom;
                  const collabName =
                    collaborateurs.find((c) => c.id === avis.collaborateur_id)?.nom ||
                    (avis.collaborateurs as any)?.nom;

                  const average =
                    Math.round(
                      ((avis.note_conseil +
                        avis.note_diversite +
                        avis.note_proprete +
                        avis.note_engagements +
                        avis.note_qualite_prix +
                        avis.note_recommandation) /
                        6) *
                        10
                    ) / 10;

                  // Calcul jours restants dans la corbeille
                  const isDeleted = Boolean(avis.deleted_at);
                  let daysRemaining = 7;
                  if (avis.deleted_at) {
                    const nowMs = currentTime || new Date(avis.deleted_at).getTime();
                    const diffDays = Math.floor(
                      (nowMs - new Date(avis.deleted_at).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    daysRemaining = Math.max(1, 7 - diffDays);
                  }

                  return (
                    <div
                      key={avis.id}
                      className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between transition ${
                        isDeleted
                          ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200'
                          : avis.statut === 'masque'
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-slate-200'
                      }`}
                    >
                      <div>
                        {/* En-tête Avis */}
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm">
                                {avis.prenom} {avis.nom}
                              </h3>
                              {isDeleted ? (
                                <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                                  Dans la corbeille (expire dans {daysRemaining}j)
                                </span>
                              ) : avis.statut === 'approuve' ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                  Approuvé
                                </span>
                              ) : avis.statut === 'masque' ? (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                  Masqué
                                </span>
                              ) : (
                                <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full border border-sky-200">
                                  En attente
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {siteName} • Collaborateur :{' '}
                              <strong className="text-slate-700">{collabName || 'Non assigné'}</strong>
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="text-base font-extrabold text-sky-600 flex items-center gap-0.5 justify-end">
                              <Droplet className="w-4 h-4 fill-sky-500 text-sky-500" />
                              <span>{average}</span>
                              <span className="text-xs text-slate-400 font-normal">/5</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(avis.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>

                        {/* Intitulé prestation */}
                        {avis.intitule_prestation && (
                          <div className="my-2.5 inline-block text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-100 px-3 py-1 rounded-xl">
                            🛠️ {avis.intitule_prestation}
                          </div>
                        )}

                        {/* 6 critères en gouttes */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 my-3 text-[11px] bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                          <div>Conseil : <strong>{avis.note_conseil}/5</strong></div>
                          <div>Diversité : <strong>{avis.note_diversite}/5</strong></div>
                          <div>Propreté : <strong>{avis.note_proprete}/5</strong></div>
                          <div>Engagements : <strong>{avis.note_engagements}/5</strong></div>
                          <div>Qualité/Prix : <strong>{avis.note_qualite_prix}/5</strong></div>
                          <div>Recommandation : <strong>{avis.note_recommandation}/5</strong></div>
                        </div>

                        {/* Commentaire */}
                        {avis.commentaire && (
                          <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-3">
                            "{avis.commentaire}"
                          </p>
                        )}

                        {/* Photos Cloudflare R2 */}
                        {avis.photos && avis.photos.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                            {avis.photos.map((item, idx) => {
                              const { thumbnail, original } = resolvePhotoUrls(item);
                              return (
                                <a
                                  key={idx}
                                  href={original}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group/photo relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-xs"
                                  title="Cliquer pour voir l'original HD (Cloudflare R2)"
                                >
                                  <img
                                    src={thumbnail || original}
                                    alt="Photo avis"
                                    className="w-full h-full object-cover group-hover/photo:scale-105 transition"
                                  />
                                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center font-bold">
                                    HD
                                  </span>
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Coordonnées client */}
                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                          {avis.email && <span>✉️ {avis.email}</span>}
                          {avis.telephone && <span>📞 {avis.telephone}</span>}
                          {avis.societe && <span>🏢 {avis.societe}</span>}
                        </div>
                      </div>

                      {/* Actions modération */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2.5 mt-3">
                        {isDeleted ? (
                          <button
                            onClick={() => handleRestoreAvis(avis.id)}
                            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition touch-manipulation"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restaurer l'avis immédiatement</span>
                          </button>
                        ) : (
                          <>
                            {avis.statut === 'approuve' ? (
                              <button
                                onClick={() => handleUpdateAvisStatut(avis.id, 'masque')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-2.5 sm:py-2 rounded-xl transition font-bold border border-amber-200 touch-manipulation"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Masquer du public</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateAvisStatut(avis.id, 'approuve')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2.5 sm:py-2 rounded-xl transition font-bold border border-emerald-200 shadow-xs touch-manipulation"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approuver & Publier</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleSoftDeleteAvis(avis.id)}
                              className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 px-3.5 py-2.5 sm:py-2 rounded-xl transition font-bold border border-rose-200 touch-manipulation shrink-0"
                              title="Déplacer dans la corbeille (restaurable pendant 7 jours)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Corbeille</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 2 : GESTION DES COLLABORATEURS & STATISTIQUES */}
        {/* ========================================================= */}
        {tab === 'collabs' && (
          <div className="space-y-6">
            {/* Formulaire ajout collaborateur */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                <span>Ajouter un nouveau collaborateur</span>
              </h3>
              <form onSubmit={handleAddCollaborateur} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Agence de rattachement
                  </label>
                  <select
                    value={newCollabSiteId}
                    onChange={(e) => setNewCollabSiteId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-800"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nom & Prénom
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex. : Jérôme DURAND"
                    value={newCollabNom}
                    onChange={(e) => setNewCollabNom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Rôle / Métier
                  </label>
                  <input
                    type="text"
                    placeholder="Ex. : Responsable d'agence & Conseil"
                    value={newCollabRole}
                    onChange={(e) => setNewCollabRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition touch-manipulation"
                  >
                    Ajouter le collaborateur
                  </button>
                </div>
              </form>
            </div>

            {/* Filtre agence collaborateur */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filtrer par agence :</span>
                <select
                  value={collabFilterSite}
                  onChange={(e) => setCollabFilterSite(e.target.value)}
                  className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-700"
                >
                  <option value="all">Toutes les agences ({sites.length})</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full sm:w-auto sm:min-w-[220px]">
                <input
                  type="text"
                  placeholder="Rechercher collaborateur..."
                  value={collabSearchTerm}
                  onChange={(e) => setCollabSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 sm:py-1.5 text-base sm:text-xs text-slate-800"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Cartes détaillées des collaborateurs avec statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCollabs.map((collab) => {
                const siteName =
                  sites.find((s) => s.id === collab.site_id)?.nom || (collab.sites as any)?.nom;
                const stats = collab.stats || {
                  total_avis: 0,
                  total_approuve: 0,
                  moyenne_globale: 0,
                  moyenne_conseil: 0,
                  moyenne_diversite: 0,
                  moyenne_proprete: 0,
                  moyenne_engagements: 0,
                  moyenne_qualite_prix: 0,
                  moyenne_recommandation: 0,
                };

                return (
                  <div
                    key={collab.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-sky-200 transition"
                  >
                    <div>
                      {/* En-tête collaborateur */}
                      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 font-extrabold flex items-center justify-center text-sm shadow-xs">
                            {collab.nom
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm">{collab.nom}</h4>
                              <button
                                onClick={() => handleToggleCollab(collab)}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition ${
                                  collab.actif
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                              >
                                {collab.actif ? 'Actif' : 'Inactif'}
                              </button>
                            </div>
                            <p className="text-xs text-slate-500">{collab.role || 'Conseiller'}</p>
                            <p className="text-[11px] text-sky-700 font-medium mt-0.5">
                              📍 {siteName}
                            </p>
                          </div>
                        </div>

                        {/* Note moyenne globale */}
                        <div className="text-right">
                          <div className="text-lg font-black text-sky-600 flex items-center justify-end gap-1">
                            <Droplet className="w-4 h-4 fill-sky-500 text-sky-500" />
                            <span>{stats.moyenne_globale > 0 ? stats.moyenne_globale : '-'}</span>
                            <span className="text-xs text-slate-400 font-normal">/5</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {stats.total_avis} avis ({stats.total_approuve} certifiés)
                          </span>
                        </div>
                      </div>

                      {/* Grille des 6 moyennes par critère */}
                      <div className="mt-3.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Moyennes par critère (gouttes d'eau)
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                            <span className="text-slate-500 text-[11px]">Conseil</span>
                            <strong className="text-sky-700 font-bold">{stats.moyenne_conseil || '-'}</strong>
                          </div>
                          <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                            <span className="text-slate-500 text-[11px]">Diversité</span>
                            <strong className="text-sky-700 font-bold">{stats.moyenne_diversite || '-'}</strong>
                          </div>
                          <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                            <span className="text-slate-500 text-[11px]">Propreté</span>
                            <strong className="text-sky-700 font-bold">{stats.moyenne_proprete || '-'}</strong>
                          </div>
                          <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                            <span className="text-slate-500 text-[11px]">Engagements</span>
                            <strong className="text-sky-700 font-bold">{stats.moyenne_engagements || '-'}</strong>
                          </div>
                          <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                            <span className="text-slate-500 text-[11px]">Qualité/Prix</span>
                            <strong className="text-sky-700 font-bold">{stats.moyenne_qualite_prix || '-'}</strong>
                          </div>
                          <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                            <span className="text-slate-500 text-[11px]">Recommandation</span>
                            <strong className="text-sky-700 font-bold">{stats.moyenne_recommandation || '-'}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Boutons d'action pour le collaborateur */}
                    <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-3">
                      <button
                        onClick={() => {
                          setFilterCollab(collab.id);
                          setTab('avis');
                        }}
                        className="w-full sm:w-auto text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center justify-center sm:justify-start gap-1 py-2 sm:py-1.5 px-3 rounded-xl hover:bg-sky-50 transition bg-sky-50/50 sm:bg-transparent touch-manipulation"
                      >
                        <span>Voir ses avis ({stats.total_avis})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleStartEditCollab(collab)}
                          className="flex-1 sm:flex-none justify-center text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 sm:py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition touch-manipulation"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modifier</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCollab(collab)}
                          className="flex-none text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 sm:py-1.5 rounded-xl flex items-center gap-1.5 transition border border-rose-200 touch-manipulation"
                          title="Supprimer ce collaborateur"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal d'édition d'un collaborateur */}
            {editingCollab && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
                <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-sky-600" />
                      <span>Modifier le collaborateur</span>
                    </h3>
                    <button
                      onClick={() => setEditingCollab(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 touch-manipulation"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditCollab} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nom et Prénom
                      </label>
                      <input
                        type="text"
                        required
                        value={editCollabNom}
                        onChange={(e) => setEditCollabNom(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Rôle / Métier
                      </label>
                      <input
                        type="text"
                        value={editCollabRole}
                        onChange={(e) => setEditCollabRole(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Agence de rattachement
                      </label>
                      <select
                        value={editCollabSiteId}
                        onChange={(e) => setEditCollabSiteId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-800"
                      >
                        {sites.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        id="collabActifCheck"
                        checked={editCollabActif}
                        onChange={(e) => setEditCollabActif(e.target.checked)}
                        className="w-5 h-5 text-sky-600 rounded border-slate-300 touch-manipulation"
                      />
                      <label htmlFor="collabActifCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Collaborateur actif (affiché dans le formulaire client)
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingCollab(null)}
                        className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition touch-manipulation"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCollab}
                        className="px-5 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs transition disabled:opacity-50 touch-manipulation"
                      >
                        {isSavingCollab ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 3 : GESTION DES AGENCES */}
        {/* ========================================================= */}
        {tab === 'sites' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-600" />
                <span>Ajouter une nouvelle agence Blue 2.0</span>
              </h3>
              <form onSubmit={handleAddSite} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nom de l'agence
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex. : Blue 2.0 - Toulouse"
                    value={newSiteNom}
                    onChange={(e) => {
                      setNewSiteNom(e.target.value);
                      if (!newSiteSlug) {
                        setNewSiteSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '')
                        );
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Slug unique (pour URL & API)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="toulouse"
                    value={newSiteSlug}
                    onChange={(e) => setNewSiteSlug(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800 font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition touch-manipulation"
                  >
                    Enregistrer l'agence
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">Agences existantes</h4>
                <span className="text-xs text-slate-400">{sites.length} agence(s)</span>
              </div>
              <div className="divide-y divide-slate-100">
                {sites.map((site) => {
                  const countAvis = avisList.filter((a) => a.site_id === site.id && !a.deleted_at).length;
                  const countCollabs = collaborateurs.filter((c) => c.site_id === site.id).length;
                  return (
                    <div
                      key={site.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/50 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-sm sm:text-base text-slate-900 break-words">{site.nom}</h5>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-lg shrink-0">
                            {site.slug}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {countCollabs} collaborateur(s) • {countAvis} avis déposé(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <button
                          onClick={() => handleToggleSite(site)}
                          className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition flex items-center gap-1.5 touch-manipulation ${
                            site.actif
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${site.actif ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{site.actif ? 'Actif' : 'Inactif'}</span>
                        </button>
                        <button
                          onClick={() => handleStartEditSite(site)}
                          className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-xl transition flex items-center gap-1.5 border border-slate-200 touch-manipulation"
                          title="Modifier l'agence"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSite(site)}
                          className="px-3.5 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition flex items-center gap-1.5 border border-rose-200 touch-manipulation"
                          title="Supprimer l'agence"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal d'édition d'une agence */}
            {editingSite && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Modifier l'agence</h4>
                        <p className="text-xs text-slate-400">{editingSite.nom}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingSite(null)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg touch-manipulation"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditSite} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nom de l'agence
                      </label>
                      <input
                        type="text"
                        required
                        value={editSiteNom}
                        onChange={(e) => setEditSiteNom(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Slug unique (identifiant URL)
                      </label>
                      <input
                        type="text"
                        required
                        value={editSiteSlug}
                        onChange={(e) => setEditSiteSlug(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800 font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        id="siteActifCheck"
                        checked={editSiteActif}
                        onChange={(e) => setEditSiteActif(e.target.checked)}
                        className="w-5 h-5 text-sky-600 rounded border-slate-300 touch-manipulation"
                      />
                      <label htmlFor="siteActifCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Agence active (visible dans les formulaires et widgets)
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingSite(null)}
                        className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition touch-manipulation"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingSite}
                        className="px-5 py-2.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs transition disabled:opacity-50 touch-manipulation"
                      >
                        {isSavingSite ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 4 : ENVOYER UN QUESTIONNAIRE */}
        {/* ========================================================= */}
        {tab === 'send' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-orange-200 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Envoyer un questionnaire
                </h3>
                <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded-full">
                  Prêt à l'envoi
                </span>
              </div>

              <div className="my-4 bg-sky-50 border border-sky-100 rounded-2xl p-4 text-xs text-slate-700 space-y-2">
                <p className="font-bold text-sky-900">
                  Comment rédiger un bon intitulé de prestation ?
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Ne divulguez aucune donnée personnelle : l'intitulé de la prestation est visible du grand public.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Résumez rapidement votre intervention, sans émoji. Inutile d'ajouter la ville : elle est récupérée automatiquement.
                </p>
              </div>

              <form onSubmit={handleGenerateLink} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Agence Blue 2.0 *
                    </label>
                    <select
                      value={sendSiteId}
                      onChange={(e) => {
                        setSendSiteId(e.target.value);
                        setSendCollabId('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-800"
                    >
                      {sites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Collaborateur intervenu
                    </label>
                    <select
                      value={sendCollabId}
                      onChange={(e) => setSendCollabId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-800"
                    >
                      <option value="">Sélectionner un collaborateur</option>
                      {collaborateurs
                        .filter((c) => c.site_id === sendSiteId && c.actif)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nom}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dubois"
                      value={sendNom}
                      onChange={(e) => setSendNom(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      placeholder="Pierre"
                      value={sendPrenom}
                      onChange={(e) => setSendPrenom(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail *</label>
                    <input
                      type="email"
                      required
                      placeholder="client@gmail.com"
                      value={sendEmail}
                      onChange={(e) => setSendEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={sendTel}
                      onChange={(e) => setSendTel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Société</label>
                  <input
                    type="text"
                    placeholder="Nom d'entreprise (optionnel)"
                    value={sendSociete}
                    onChange={(e) => setSendSociete(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Intitulé de la prestation *
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {sendPrestation.length}/80
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder="Ex. : Construction piscine miroir 9x4 avec volet immergé"
                    value={sendPrestation}
                    onChange={(e) => setSendPrestation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-800"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm rounded-2xl shadow-md transition"
                  >
                    Générer le questionnaire pré-rempli
                  </button>
                </div>
              </form>

              {generatedLink && (
                <div className="mt-6 pt-5 border-t border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-emerald-800">
                    Lien personnalisé généré pour ce client :
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-slate-800 flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copySuccess ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 5 : INTEGRATION & SAUVEGARDES */}
        {/* ========================================================= */}
        {tab === 'widget' && (
          <div className="space-y-6">
            {/* Intégration Widget sur site externe (ex: Protech Piscine) */}
            <div className="bg-white rounded-3xl p-6 border border-sky-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      Intégration du Widget Avis sur votre site web
                    </h3>
                    <p className="text-xs text-slate-500">
                      Connectez les avis en direct (ex: Protech Piscine) avec mise à jour 100% automatique.
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-1.5 pt-1 sm:pt-0">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
                    <Building className="w-3.5 h-3.5 text-sky-600" />
                    <span>Sélectionner l'agence :</span>
                  </label>
                  <select
                    value={widgetSiteSlug}
                    onChange={(e) => setWidgetSiteSlug(e.target.value)}
                    className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-sky-500 outline-hidden"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.slug}>
                        {s.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Option 1: Code Iframe rapide */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                    Intégration Iframe (Copier-Coller universel pour n'importe quel site)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `<iframe src="https://blue2-avis.vercel.app/widget?site=${widgetSiteSlug}" width="100%" height="480" style="border:none;border-radius:16px;overflow:hidden;" title="Avis Clients Blue 2.0"></iframe>`
                      );
                      alert('Code Iframe copié dans le presse-papier !');
                    }}
                    className="text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition touch-manipulation"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le code</span>
                  </button>
                </div>
                <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-sky-300 overflow-x-auto">
                  <code>{`<iframe src="https://blue2-avis.vercel.app/widget?site=${widgetSiteSlug}" width="100%" height="480" style="border:none;border-radius:16px;overflow:hidden;" title="Avis Clients Blue 2.0"></iframe>`}</code>
                </div>
              </div>

              {/* Option 2: Script JS automatique */}
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                    Balise HTML + Script dynamique
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `<div id="blue2-reviews" data-site="${widgetSiteSlug}"></div>\n<script src="https://blue2-avis.vercel.app/widget.js" async></script>`
                      );
                      alert('Script copié !');
                    }}
                    className="text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition touch-manipulation"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le script</span>
                  </button>
                </div>
                <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  <code>{`<div id="blue2-reviews" data-site="${widgetSiteSlug}"></div>\n<script src="https://blue2-avis.vercel.app/widget.js" async></script>`}</code>
                </div>
              </div>

              {/* Option 3: API JSON directe */}
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                    API JSON Directe (Pour React / Next.js / WordPress / PHP)
                  </span>
                  <a
                    href={`https://blue2-avis.vercel.app/api/avis?site=${widgetSiteSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition touch-manipulation"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ouvrir l'API JSON</span>
                  </a>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 font-mono text-xs text-slate-700 select-all break-all">
                  https://blue2-avis.vercel.app/api/avis?site={widgetSiteSlug}
                </div>
              </div>

              {/* Aperçu direct */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 mb-2">Aperçu en direct du widget :</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 p-2">
                  <iframe
                    src={`/widget?site=${widgetSiteSlug}`}
                    width="100%"
                    height="450"
                    className="rounded-xl bg-white shadow-xs"
                    title="Aperçu Widget"
                  />
                </div>
              </div>
            </div>

            {/* Tutoriel détaillé pas-à-pas par CMS & Plateforme */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Tutoriel d'intégration pas-à-pas selon votre site</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Suivez le guide correspondant à la technologie de votre site web pour une intégration en 2 minutes chrono.
                </p>
              </div>

              {/* Sélecteur de plateforme CMS */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 touch-pan-x">
                {[
                  { id: 'wordpress', label: 'WordPress (Elementor / Divi / Gutenberg)', icon: '🌐' },
                  { id: 'react', label: 'React / Next.js (Protech Piscine)', icon: '⚛️' },
                  { id: 'webflow', label: 'Webflow / Framer', icon: '🎨' },
                  { id: 'wix', label: 'Wix / Squarespace', icon: '✨' },
                  { id: 'html', label: 'HTML / PHP / Shopify', icon: '💻' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTutorialTab(item.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                      tutorialTab === item.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* CONTENU DU TUTO SELON L'ONGLET SÉLECTIONNÉ */}
              {tutorialTab === 'wordpress' && (
                <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                  <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-2xl">
                    <p className="font-bold text-sky-900 mb-1">
                      WordPress : Fonctionne avec tous les thèmes et constructeurs de page
                    </p>
                    <p className="text-slate-600">
                      Les avis sont chargés dynamiquement depuis le serveur Blue 2.0. Dès qu'un client dépose un avis sur Saint-Dié et qu'il est approuvé, il s'affiche automatiquement sans toucher à WordPress.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-900 mb-1">Méthode 1 : Avec Elementor</p>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600">
                        <li>Ouvrez votre page (ex: Accueil ou page Avis) dans Elementor.</li>
                        <li>Dans le panneau de gauche, cherchez le widget <strong>« HTML »</strong>.</li>
                        <li>Glissez-déposez le widget à l'endroit désiré sur votre page.</li>
                        <li>Collez le code Iframe copié plus haut (Option 1).</li>
                        <li>Cliquez sur <strong>Mettre à jour</strong>.</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-900 mb-1">Méthode 2 : Avec Gutenberg (Éditeur WordPress natif)</p>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600">
                        <li>Dans l'éditeur de page WordPress, cliquez sur le bouton <strong>+</strong> pour ajouter un bloc.</li>
                        <li>Recherchez et sélectionnez <strong>« HTML personnalisé »</strong>.</li>
                        <li>Collez le code Iframe ou le script JavaScript.</li>
                        <li>Enregistrez ou publiez la page.</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-900 mb-1">Méthode 3 : Avec Divi Builder</p>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600">
                        <li>Ajoutez une nouvelle rangée puis insérez un module <strong>« Code »</strong>.</li>
                        <li>Collez le code Iframe dans le champ de contenu du module.</li>
                        <li>Validez et sauvegardez la mise en page.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {tutorialTab === 'react' && (
                <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <p className="font-bold text-emerald-900 mb-1">
                      Idéal pour le site Protech Piscine (Next.js / React)
                    </p>
                    <p className="text-emerald-800">
                      Vous pouvez soit utiliser l'iframe responsive en 1 composant, soit consommer directement l'API JSON pour afficher les avis avec le style exact de Protech Piscine.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-slate-900 mb-1">Option A : Composant Iframe réutilisable (Le plus simple)</p>
                      <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
                        <pre>{`// components/ReviewsWidget.tsx
export function ReviewsWidget() {
  return (
    <div className="w-full max-w-5xl mx-auto my-12">
      <iframe
        src="https://blue2-avis.vercel.app/widget?site=${widgetSiteSlug}"
        width="100%"
        height="480"
        style={{ border: 'none', borderRadius: '20px', overflow: 'hidden' }}
        title="Avis Clients Protech Piscine"
        loading="lazy"
      />
    </div>
  );
}`}</pre>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 mb-1">Option B : Fetch direct de l'API JSON (Server Component Next.js App Router)</p>
                      <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
                        <pre>{`// app/avis/page.tsx
export default async function AvisPage() {
  const res = await fetch('https://blue2-avis.vercel.app/api/avis?site=${widgetSiteSlug}', {
    next: { revalidate: 60 } // Rafraîchissement automatique toutes les 60s
  });
  const data = await res.json();
  const { stats, avis } = data;

  return (
    <section className="py-12 px-4 max-w-5xl mx-auto">
      <h2>Note globale : {stats.moyenne_globale}/5 ({stats.total} avis)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {avis.map((a: any) => (
          <div key={a.id} className="p-6 bg-white rounded-2xl shadow-sm border">
            <p className="font-bold">{a.prenom} {a.initiale_nom} - Note : {a.notes.moyenne}/5</p>
            <p className="text-slate-600 italic">"{a.commentaire}"</p>
            {a.collaborateur && <p className="text-xs text-sky-600">Suivi par {a.collaborateur.nom}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tutorialTab === 'webflow' && (
                <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                    <p className="font-bold text-purple-900 mb-1">
                      Intégration Webflow & Framer via le composant Embed
                    </p>
                    <p className="text-purple-800">
                      Webflow prend nativement en charge les iframes sécurisées. Le widget s'adaptera automatiquement à la largeur du conteneur parent.
                    </p>
                  </div>

                  <ol className="list-decimal list-inside space-y-2 text-slate-600">
                    <li>Dans le Designer Webflow, ouvrez le panneau <strong>Add Elements</strong> (raccourci clavier <strong>A</strong>).</li>
                    <li>Faites défiler jusqu'à la section <strong>Advanced</strong> et glissez l'élément <strong>Embed</strong> sur votre page.</li>
                    <li>Dans la fenêtre qui s'ouvre, collez le code Iframe ou le code HTML + Script.</li>
                    <li>Cliquez sur <strong>Save & Close</strong>.</li>
                    <li>Publiez votre projet (bouton <strong>Publish</strong>). Les avis sont maintenant synchronisés en temps réel !</li>
                  </ol>
                </div>
              )}

              {tutorialTab === 'wix' && (
                <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                    <p className="font-bold text-amber-900 mb-1">
                      Wix & Squarespace : Bloc de code personnalisé
                    </p>
                    <p className="text-amber-800">
                      Aucune extension requise : les deux constructeurs proposent un bloc HTML intégré prêt à l'emploi.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-900 mb-1">Sur Wix :</p>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600">
                        <li>Cliquez sur le bouton <strong>+ (Ajouter des éléments)</strong> à gauche.</li>
                        <li>Allez dans <strong>Intégrer du code</strong> &gt; <strong>Intégrer du code HTML</strong>.</li>
                        <li>Cliquez sur <strong>Entrer le code</strong> au-dessus du cadre gris qui apparaît.</li>
                        <li>Collez le code Iframe et cliquez sur <strong>Appliquer</strong>.</li>
                        <li>Étirez le cadre avec les poignées pour lui donner une bonne largeur et hauteur (environ 700px).</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-900 mb-1">Sur Squarespace :</p>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600">
                        <li>Cliquez sur <strong>Modifier</strong> sur votre page.</li>
                        <li>Ajoutez un bloc et sélectionnez <strong>« Code »</strong> ou <strong>« Embed »</strong>.</li>
                        <li>Passez en mode <strong>HTML</strong> et collez le code Iframe.</li>
                        <li>Enregistrez vos modifications.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {tutorialTab === 'html' && (
                <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                  <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl">
                    <p className="font-bold text-slate-900 mb-1">
                      HTML Pur, PHP, Shopify (Liquid) ou Prestashop
                    </p>
                    <p className="text-slate-600">
                      Pour n'importe quel site statique ou dynamique, il suffit de coller le code dans votre gabarit de page.
                    </p>
                  </div>

                  <ol className="list-decimal list-inside space-y-2 text-slate-600">
                    <li>Ouvrez votre fichier de vue (ex: <code>index.html</code>, <code>temoignages.php</code>, ou <code>page.liquid</code> dans Shopify).</li>
                    <li>Collez la balise <code>&lt;iframe&gt;</code> ou le script <code>widget.js</code> à l'endroit désiré.</li>
                    <li>Sauvegardez le fichier. Le widget est 100% autonome, responsive mobile et s'auto-actualise automatiquement.</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Zéro perte de données & Vercel Cron
                  </h3>
                  <p className="text-xs text-slate-500">
                    Maintien actif automatique du plan Neon Postgres serverless et export quotidien avec clés Cloudflare R2.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-1">
                    Export manuel instantané
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Téléchargez un fichier JSON complet de tous les avis, agences, collaborateurs et clés R2.
                  </p>
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger la sauvegarde JSON</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-1">
                    Test Keep-Alive & Cron Neon
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Exécute la vérification automatique Vercel Cron (`/api/cron/backup-and-keepalive`).
                  </p>
                  <button
                    onClick={handleTriggerKeepalive}
                    disabled={pingingCron}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <RefreshCw className={`w-4 h-4 ${pingingCron ? 'animate-spin' : ''}`} />
                    <span>{pingingCron ? 'Ping en cours...' : 'Tester le ping Keep-Alive'}</span>
                  </button>
                </div>
              </div>

              {cronReport && (
                <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto">
                  <pre>{JSON.stringify(cronReport, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
