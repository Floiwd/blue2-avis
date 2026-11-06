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
  LogOut,
  AlertTriangle,
  Download,
  Edit3,
  RotateCcw,
  X,
  Droplet,
  ArrowRight,
} from 'lucide-react';
import { Site, Collaborateur, Avis, CRITERIA } from '@/lib/types';
import { resolvePhotoUrls } from '@/lib/photo-utils';

export default function AdminPage() {
  // Navigation
  const [tab, setTab] = useState<'avis' | 'sites' | 'collabs' | 'send' | 'widget'>('avis');

  // Données
  const [avisList, setAvisList] = useState<Avis[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Widget preview
  const [widgetSiteSlug, setWidgetSiteSlug] = useState('annecy-siege');

  // Keepalive test
  const [cronReport, setCronReport] = useState<any>(null);
  const [pingingCron, setPingingCron] = useState(false);

  useEffect(() => {
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

  // Filtrage des avis selon le filtre statut sélectionné
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

  // Filtrage des collaborateurs
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
    <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-20">
      {/* Top Navbar Admin */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base">Admin • Blue 2.0</span>
              <span className="hidden sm:inline-block ml-2 text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Postgres Neon & R2 opérationnels
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <span>Voir le formulaire public</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto border-t border-slate-800 scrollbar-none">
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
            <span>Collaborateurs & Statistiques</span>
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
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">Filtrer par agence :</span>
                </div>
                <select
                  value={filterSite}
                  onChange={(e) => setFilterSite(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
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
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
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

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Rechercher client, texte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800"
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
                    const diffDays = Math.floor(
                      (Date.now() - new Date(avis.deleted_at).getTime()) / (1000 * 60 * 60 * 24)
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
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
                        {isDeleted ? (
                          <button
                            onClick={() => handleRestoreAvis(avis.id)}
                            className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restaurer l'avis immédiatement</span>
                          </button>
                        ) : (
                          <>
                            {avis.statut === 'approuve' ? (
                              <button
                                onClick={() => handleUpdateAvisStatut(avis.id, 'masque')}
                                className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition font-medium border border-amber-200"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>Masquer du public</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateAvisStatut(avis.id, 'approuve')}
                                className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition font-medium border border-emerald-200"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approuver & Publier</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleSoftDeleteAvis(avis.id)}
                              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 p-1.5 rounded-lg hover:bg-rose-50 transition"
                              title="Déplacer dans la corbeille (restaurable pendant 7 jours)"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-[11px] hidden sm:inline">Corbeille</span>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    Ajouter le collaborateur
                  </button>
                </div>
              </form>
            </div>

            {/* Filtre agence collaborateur */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Filtrer par agence :</span>
                <select
                  value={collabFilterSite}
                  onChange={(e) => setCollabFilterSite(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  <option value="all">Toutes les agences ({sites.length})</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  placeholder="Rechercher collaborateur..."
                  value={collabSearchTerm}
                  onChange={(e) => setCollabSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800"
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
                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-3">
                      <button
                        onClick={() => {
                          setFilterCollab(collab.id);
                          setTab('avis');
                        }}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-sky-50 transition"
                      >
                        <span>Voir ses avis ({stats.total_avis})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEditCollab(collab)}
                          className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modifier</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCollab(collab)}
                          className="text-xs text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition"
                          title="Supprimer ce collaborateur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal d'édition d'un collaborateur */}
            {editingCollab && (
              <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-sky-600" />
                      <span>Modifier le collaborateur</span>
                    </h3>
                    <button
                      onClick={() => setEditingCollab(null)}
                      className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Agence de rattachement
                      </label>
                      <select
                        value={editCollabSiteId}
                        onChange={(e) => setEditCollabSiteId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800"
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
                        className="w-4 h-4 text-sky-600 rounded border-slate-300"
                      />
                      <label htmlFor="collabActifCheck" className="text-xs font-semibold text-slate-700">
                        Collaborateur actif (affiché dans le formulaire client)
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingCollab(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCollab}
                        className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-xs transition disabled:opacity-50"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition"
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
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-slate-900">{site.nom}</h5>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-lg">
                            {site.slug}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {countCollabs} collaborateur(s) • {countAvis} avis déposé(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSite(site)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition ${
                            site.actif
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {site.actif ? 'Actif' : 'Inactif'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={sendTel}
                      onChange={(e) => setSendTel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
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
