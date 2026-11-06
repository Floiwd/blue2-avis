'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Building,
  Users,
  MessageSquare,
  Send,
  Code2,
  Database,
  CheckCircle,
  EyeOff,
  Eye,
  Trash2,
  Plus,
  RefreshCw,
  Copy,
  ExternalLink,
  Search,
  Filter,
  LogOut,
  ChevronRight,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { Site, Collaborateur, Avis, CRITERIA } from '@/lib/types';

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab: 'avis' | 'sites' | 'collabs' | 'send' | 'widget'
  const [tab, setTab] = useState<'avis' | 'sites' | 'collabs' | 'send' | 'widget'>('avis');

  // Data
  const [avisList, setAvisList] = useState<Avis[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [collaborateurs, setCollaborateurs] = useState<Collaborateur[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters for avis
  const [filterSite, setFilterSite] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals / Form States for Add Site / Collab
  const [newSiteNom, setNewSiteNom] = useState('');
  const [newSiteSlug, setNewSiteSlug] = useState('');
  const [newCollabNom, setNewCollabNom] = useState('');
  const [newCollabRole, setNewCollabRole] = useState('Conseiller Expert Piscines & Spas');
  const [newCollabSiteId, setNewCollabSiteId] = useState('');

  // "Envoyer un questionnaire" (Inspiré des captures utilisateur)
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

  // Widget preview site selection
  const [widgetSiteSlug, setWidgetSiteSlug] = useState('lyon-centre');

  // Keepalive trigger status
  const [cronReport, setCronReport] = useState<any>(null);
  const [pingingCron, setPingingCron] = useState(false);

  // Check auth initial
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

      if (resAvis.status === 401 || resSites.status === 401) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
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
      console.error(err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        fetchData();
      } else {
        const d = await res.json();
        setLoginError(d.error || 'Mot de passe incorrect');
      }
    } catch (err) {
      setLoginError('Erreur de connexion');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setPassword('');
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
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleSoftDeleteAvis = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir archiver cet avis ? (Zéro perte : il reste récupérable)')) return;
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
      }
    } catch (err) {
      alert('Erreur lors de l\'archivage');
    }
  };

  // Actions Sites
  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteNom || !newSiteSlug) return;
    try {
      const res = await fetch('/api/admin/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newSiteNom, slug: newSiteSlug }),
      });
      if (res.ok) {
        const data = await res.json();
        setSites((prev) => [...prev, data.site]);
        setNewSiteNom('');
        setNewSiteSlug('');
        alert('Agence ajoutée avec succès !');
      }
    } catch (err) {
      alert('Erreur lors de l\'ajout');
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
    } catch (err) {
      alert('Erreur');
    }
  };

  // Actions Collaborateurs
  const handleAddCollaborateur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollabNom || !newCollabSiteId) return;
    try {
      const res = await fetch('/api/admin/collaborateurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: newCollabNom,
          role: newCollabRole,
          site_id: newCollabSiteId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCollaborateurs((prev) => [...prev, data.collaborateur]);
        setNewCollabNom('');
        alert('Collaborateur ajouté avec succès !');
      }
    } catch (err) {
      alert('Erreur');
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
    } catch (err) {
      alert('Erreur');
    }
  };

  // Génération du lien de questionnaire
  const handleGenerateLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const siteObj = sites.find((s) => s.id === sendSiteId);
    const collabObj = collaborateurs.find((c) => c.id === sendCollabId);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams();

    if (siteObj) params.set('site', siteObj.slug);
    if (collabObj) params.set('collab', collabObj.id);
    if (sendPrestation) params.set('prestation', sendPrestation);
    if (sendNom) params.set('nom', sendNom);
    if (sendPrenom) params.set('prenom', sendPrenom);
    if (sendEmail) params.set('email', sendEmail);

    const link = `${baseUrl}/?${params.toString()}`;
    setGeneratedLink(link);
  };

  const copyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Trigger Keepalive & backup
  const handleTriggerKeepalive = async () => {
    setPingingCron(true);
    try {
      const res = await fetch('/api/cron/backup-and-keepalive');
      const data = await res.json();
      setCronReport(data);
    } catch (err) {
      alert('Erreur lors du ping');
    } finally {
      setPingingCron(false);
    }
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

  // -------------------------------------------------------------
  // ECRAN DE LOGIN ADMIN
  // -------------------------------------------------------------
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center mx-auto mb-5 text-sky-400">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-center mb-1">Administration Blue 2.0</h1>
          <p className="text-xs text-slate-400 text-center mb-6">
            Espace sécurisé de gestion et modération des avis
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mot de passe administrateur
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-400 font-bold rounded-2xl text-sm transition shadow-lg shadow-sky-500/25 disabled:opacity-60"
            >
              {isLoggingIn ? 'Connexion en cours...' : 'Accéder au panneau d\'administration'}
            </button>

            <div className="pt-2 text-center">
              <a href="/" className="text-xs text-slate-500 hover:text-sky-400 transition">
                ← Retour au formulaire public
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Filtrage des avis
  const filteredAvis = avisList.filter((a) => {
    if (filterSite !== 'all' && a.site_id !== filterSite) return false;
    if (filterStatut !== 'all' && a.statut !== filterStatut) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchNom = a.nom.toLowerCase().includes(term) || a.prenom.toLowerCase().includes(term);
      const matchComment = a.commentaire?.toLowerCase().includes(term) || false;
      const matchPrestation = a.intitule_prestation?.toLowerCase().includes(term) || false;
      if (!matchNom && !matchComment && !matchPrestation) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-20">
      {/* Top Navbar Admin */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base">Admin • Blue 2.0</span>
              <span className="hidden sm:inline-block ml-2 text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">
                PWA Avis Multi-sites
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
            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
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
            <span>Avis reçus ({avisList.length})</span>
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
            onClick={() => setTab('collabs')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              tab === 'collabs'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Collaborateurs ({collaborateurs.length})</span>
          </button>

          <button
            onClick={() => setTab('send')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              tab === 'send'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 font-bold">Envoyer un questionnaire</span>
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
        {/* ONGLET 1 : AVIS & MODERATION */}
        {/* ========================================================= */}
        {tab === 'avis' && (
          <div className="space-y-4">
            {/* Filtres & Recherche */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500">Filtrer :</span>
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
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  <option value="all">Tous statuts</option>
                  <option value="approuve">Approuvés uniquement</option>
                  <option value="masque">Masqués</option>
                  <option value="en_attente">En attente</option>
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
                <p className="font-semibold text-sm">Aucun avis correspondant</p>
                <p className="text-xs mt-1">Modifiez vos filtres ou effectuez un test via le formulaire public.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAvis.map((avis) => {
                  const siteName = sites.find((s) => s.id === avis.site_id)?.nom || (avis.sites as any)?.nom;
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

                  return (
                    <div
                      key={avis.id}
                      className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between transition ${
                        avis.deleted_at
                          ? 'opacity-50 border-rose-200 bg-rose-50/20'
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
                              {avis.statut === 'approuve' ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Approuvé
                                </span>
                              ) : avis.statut === 'masque' ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Masqué
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  En attente
                                </span>
                              )}
                              {avis.deleted_at && (
                                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Archivé
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-sky-700 font-medium mt-0.5">
                              {siteName} • Accompagné par {collabName || 'un collaborateur'}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-extrabold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-100">
                              💧 {average}/5
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(avis.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>

                        {/* Prestation & Coordonnées */}
                        {avis.intitule_prestation && (
                          <div className="mt-2.5 px-3 py-1.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                            <strong>Prestation :</strong> {avis.intitule_prestation}
                          </div>
                        )}

                        {/* 6 Notes détaillées */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 my-3 text-[11px] bg-sky-50/40 p-2.5 rounded-2xl border border-sky-100">
                          <div>
                            <span className="text-slate-500">Conseil :</span>{' '}
                            <strong className="text-sky-800">{avis.note_conseil}/5</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Diversité :</span>{' '}
                            <strong className="text-sky-800">{avis.note_diversite}/5</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Propreté :</span>{' '}
                            <strong className="text-sky-800">{avis.note_proprete}/5</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Engagements :</span>{' '}
                            <strong className="text-sky-800">{avis.note_engagements}/5</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Qualité/Budget :</span>{' '}
                            <strong className="text-sky-800">{avis.note_qualite_prix}/5</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Recomm. :</span>{' '}
                            <strong className="text-sky-800">{avis.note_recommandation}/5</strong>
                          </div>
                        </div>

                        {/* Commentaire */}
                        {avis.commentaire && (
                          <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-3">
                            "{avis.commentaire}"
                          </p>
                        )}

                        {/* Photos */}
                        {avis.photos && avis.photos.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                            {avis.photos.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0"
                              >
                                <img
                                  src={url}
                                  alt="Photo avis"
                                  className="w-full h-full object-cover hover:scale-105 transition"
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Client details */}
                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                          {avis.email && <span>✉️ {avis.email}</span>}
                          {avis.telephone && <span>📞 {avis.telephone}</span>}
                          {avis.societe && <span>🏢 {avis.societe}</span>}
                        </div>
                      </div>

                      {/* Actions modération */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
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

                        {!avis.deleted_at && (
                          <button
                            onClick={() => handleSoftDeleteAvis(avis.id)}
                            className="text-xs text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                            title="Archiver l'avis (zéro perte)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        {/* ONGLET 2 : GESTION DES AGENCES */}
        {/* ========================================================= */}
        {tab === 'sites' && (
          <div className="space-y-6">
            {/* Formulaire ajout agence */}
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

            {/* Tableau des agences */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">Agences existantes</h4>
                <span className="text-xs text-slate-400">{sites.length} agence(s)</span>
              </div>
              <div className="divide-y divide-slate-100">
                {sites.map((site) => {
                  const countAvis = avisList.filter((a) => a.site_id === site.id).length;
                  const countCollabs = collaborateurs.filter((c) => c.site_id === site.id).length;
                  return (
                    <div
                      key={site.id}
                      className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/70 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-slate-900">{site.nom}</h5>
                          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            slug: {site.slug}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {countCollabs} collaborateur(s) • {countAvis} avis recueilli(s)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSite(site)}
                          className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition ${
                            site.actif
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {site.actif ? 'Actif' : 'Désactivé'}
                        </button>
                        <a
                          href={`/api/avis?site=${site.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-sky-600 hover:text-sky-700 px-2 py-1.5 hover:bg-sky-50 rounded-lg"
                          title="Tester le flux JSON"
                        >
                          API JSON
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 3 : GESTION DES COLLABORATEURS */}
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
                    placeholder="Marc Vasseur"
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
                    placeholder="Conseiller Piscines"
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

            {/* Liste collaborateurs par agence */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
              {sites.map((site) => {
                const collabs = collaborateurs.filter((c) => c.site_id === site.id);
                return (
                  <div key={site.id} className="p-5">
                    <h4 className="font-bold text-sm text-sky-800 mb-2 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>{site.nom}</span>
                      <span className="text-xs font-normal text-slate-400">({collabs.length} collabs)</span>
                    </h4>

                    {collabs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Aucun collaborateur enregistré.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {collabs.map((collab) => (
                          <div
                            key={collab.id}
                            className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-800">{collab.nom}</p>
                              <p className="text-[11px] text-slate-500">{collab.role || 'Conseiller'}</p>
                            </div>
                            <button
                              onClick={() => handleToggleCollab(collab)}
                              className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition ${
                                collab.actif
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-200 text-slate-600 border-slate-300'
                              }`}
                            >
                              {collab.actif ? 'Actif' : 'Inactif'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 4 : ENVOYER UN QUESTIONNAIRE (Inspiré des captures) */}
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

              {/* Bloc d'aide exactement inspiré de la capture */}
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

              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Utilisez ce formulaire pour préparer un lien de questionnaire de satisfaction pour vos clients.
                Assurez-vous de les avoir informés préalablement et, si nécessaire, d'obtenir leur consentement avant l'envoi.
              </p>

              <form onSubmit={handleGenerateLink} className="space-y-4">
                {/* Agence & Collaborateur */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Agence Blue 2.0
                    </label>
                    <select
                      value={sendSiteId}
                      onChange={(e) => {
                        setSendSiteId(e.target.value);
                        setSendCollabId('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-slate-800"
                    >
                      {sites.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Collaborateur
                    </label>
                    <select
                      value={sendCollabId}
                      onChange={(e) => setSendCollabId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-slate-800"
                    >
                      <option value="">Choisir un collaborateur...</option>
                      {collaborateurs
                        .filter((c) => c.site_id === sendSiteId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nom}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Nom & Prénom */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. : Martin"
                      value={sendNom}
                      onChange={(e) => setSendNom(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. : Alice"
                      value={sendPrenom}
                      onChange={(e) => setSendPrenom(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* E-mail, Téléphone, Société */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      placeholder="client@domaine.fr"
                      value={sendEmail}
                      onChange={(e) => setSendEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      placeholder="06 00 00 00 00"
                      value={sendTel}
                      onChange={(e) => setSendTel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Société
                    </label>
                    <input
                      type="text"
                      placeholder="Optionnel"
                      value={sendSociete}
                      onChange={(e) => setSendSociete(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-slate-800"
                    />
                  </div>
                </div>

                {/* Intitulé de la prestation (0/80) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Intitulé de la prestation *
                    </label>
                    <span className="text-[11px] text-slate-400">{sendPrestation.length}/80</span>
                  </div>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder="Ex. : Installation piscine coque polyester 7x3.5m et volet immergé"
                    value={sendPrestation}
                    onChange={(e) => setSendPrestation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs text-slate-800"
                  />
                </div>

                {/* Boutons d'action (comme dans la capture) */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition active:scale-[0.99]"
                  >
                    Générer & Préparer le questionnaire
                  </button>

                  {generatedLink && (
                    <a
                      href={generatedLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full block py-3.5 px-4 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-center font-semibold text-sm rounded-2xl shadow-xs transition"
                    >
                      Accéder au questionnaire (sur cette tablette / téléphone)
                    </a>
                  )}
                </div>
              </form>

              {/* Résultat du lien pré-rempli */}
              {generatedLink && (
                <div className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-in fade-in duration-300">
                  <p className="text-xs font-bold text-slate-700">Lien direct à transmettre au client :</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-600"
                    />
                    <button
                      onClick={copyLink}
                      className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 shrink-0 flex items-center gap-1.5"
                    >
                      {copySuccess ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copySuccess ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 5 : WIDGET INTEGRATION & SAUVEGARDE ZÉRO PERTE */}
        {/* ========================================================= */}
        {tab === 'widget' && (
          <div className="space-y-6">
            {/* Snippet d'intégration pour les sites web */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Snippet d'intégration pour chaque site web Blue 2.0
                  </h3>
                  <p className="text-xs text-slate-500">
                    Insérez ce code HTML/JS sur n'importe quel site (WordPress, Webflow, HTML) pour afficher automatiquement les avis et moyennes certifiées.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Agence :</span>
                  <select
                    value={widgetSiteSlug}
                    onChange={(e) => setWidgetSiteSlug(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.slug}>
                        {s.nom} ({s.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
{`<!-- Blue 2.0 Avis Widget (Multi-sites) -->
<div id="blue2-avis-widget" data-site="${widgetSiteSlug}"></div>
<script>
(function() {
  const container = document.getElementById('blue2-avis-widget');
  const site = container.getAttribute('data-site');
  const apiUrl = '${typeof window !== 'undefined' ? window.location.origin : 'https://votre-domaine.vercel.app'}/api/avis?site=' + site;

  fetch(apiUrl)
    .then(r => r.json())
    .then(data => {
      const { stats, avis, site: siteInfo } = data;
      if (!stats || stats.total === 0) {
        container.innerHTML = '<p style="font-size:13px;color:#64748b;">Aucun avis pour le moment.</p>';
        return;
      }
      container.innerHTML = \`
        <div style="font-family:system-ui,-apple-system,sans-serif;background:#fff;border-radius:20px;padding:24px;border:1px solid #e0f2fe;box-shadow:0 4px 15px rgba(2,132,199,0.06);max-width:480px;">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f1f5f9;padding-bottom:12px;margin-bottom:14px;">
            <div>
              <h4 style="margin:0;font-size:16px;color:#0f172a;font-weight:700;">\${siteInfo.nom}</h4>
              <p style="margin:2px 0 0;font-size:12px;color:#0284c7;font-weight:600;">\${stats.total} avis certifiés</p>
            </div>
            <div style="font-size:22px;font-weight:800;color:#0284c7;background:#f0f9ff;padding:4px 12px;border-radius:14px;border:1px solid #bae6fd;">
              💧 \${stats.moyenne_globale}/5
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:#475569;margin-bottom:16px;background:#f8fafc;padding:10px;border-radius:12px;">
            <div>Conseil: <strong>\${stats.moyenne_conseil}/5</strong></div>
            <div>Diversité: <strong>\${stats.moyenne_diversite}/5</strong></div>
            <div>Propreté: <strong>\${stats.moyenne_proprete}/5</strong></div>
            <div>Engagements: <strong>\${stats.moyenne_engagements}/5</strong></div>
            <div>Qualité/Budget: <strong>\${stats.moyenne_qualite_prix}/5</strong></div>
            <div>Recommandation: <strong>\${stats.moyenne_recommandation}/5</strong></div>
          </div>
          <div style="max-height:220px;overflow-y:auto;padding-right:4px;">
            \${avis.slice(0, 3).map(a => \`
              <div style="border-top:1px solid #f8fafc;padding:8px 0;">
                <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:#1e293b;">
                  <span>\${a.prenom} \${a.initiale_nom}</span>
                  <span style="color:#0284c7;">💧 \${a.notes.moyenne}/5</span>
                </div>
                \${a.commentaire ? \`<p style="margin:4px 0 0;font-size:11px;color:#64748b;font-style:italic;">"\${a.commentaire}"</p>\` : ''}
              </div>
            \`).join('')}
          </div>
        </div>
      \`;
    })
    .catch(err => console.error('Erreur widget Blue 2.0:', err));
})();
<\/script>`}
                </pre>
                <button
                  onClick={() => {
                    const text = document.querySelector('pre')?.textContent || '';
                    navigator.clipboard.writeText(text);
                    alert('Snippet copié dans le presse-papier !');
                  }}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le snippet</span>
                </button>
              </div>
            </div>

            {/* Sauvegarde Zéro Perte & Keep-alive */}
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
                    Maintien actif automatique du plan Supabase Postgres gratuit et export quotidien.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-1">
                    Export manuel instantané
                  </h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Téléchargez un fichier JSON complet de tous les avis, agences et collaborateurs.
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
                    Test Keep-Alive & Cron Supabase
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
                <div className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto">
                  <p className="font-bold mb-1">Résultat du Cron :</p>
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
