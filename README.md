# 💧 Formulaire avis Blue 2.0 (PWA)

Application Web Progressive (PWA) mobile-first officielle pour le recueil, la certification et la diffusion multi-sites des avis clients du réseau **Blue 2.0**.

- **Stack** : Next.js (App Router) + TypeScript + Tailwind CSS
- **PWA** : Installable sur écran d'accueil (iOS / Android / Desktop), Service Worker offline, icônes en gouttes d'eau bleue (192, 512, maskable, apple-touch-icon).
- **Zéro perte de données** : Clés étrangères strictes `ON DELETE RESTRICT`, suppression logique (`deleted_at`), Vercel Cron quotidien (keep-alive pour éviter la mise en pause du plan gratuit Supabase + export JSON de sauvegarde).
- **Notation tactile** : 6 critères notés de 1 à 5 en gouttes d'eau stylisées (grandes zones tactiles).
- **Multi-sites** : API REST avec CORS activé (`GET /api/avis?site=<slug>`) et widget d'intégration dynamique prêt à l'emploi.
- **Admin protégé** : `/admin` sécurisé par mot de passe pour modérer les avis et gérer les agences et collaborateurs.

---

## 🚀 1. Étapes de configuration Supabase

1. Rendez-vous sur [supabase.com](https://supabase.com) et créez un nouveau projet gratuit.
2. Dans le menu de gauche, ouvrez **SQL Editor**.
3. Copiez et collez le contenu du fichier [supabase/migrations/20261106_init.sql](./supabase/migrations/20261106_init.sql), puis cliquez sur **Run**.
   - Cela crée les tables `sites`, `collaborateurs`, `avis`, configure les index, le RLS et le bucket Storage `avis-photos`.
4. Copiez et collez le contenu du fichier [supabase/seed.sql](./supabase/seed.sql) puis cliquez sur **Run** pour charger les premières agences et collaborateurs d'exemple.
5. Allez dans **Project Settings > API** pour copier :
   - L'URL du projet (`Project URL`)
   - La clé anonyme `anon` (`public`)
   - La clé secrète `service_role` (`secret`)

---

## ⚙️ 2. Renseigner les variables d'environnement sur Vercel

Dans le tableau de bord de votre projet Vercel (**Settings > Environment Variables**), ajoutez :

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase (ex: `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète service_role Supabase (pour bypasser le RLS côté serveur) |
| `ADMIN_PASSWORD` | Mot de passe de connexion à l'espace `/admin` (ex: `MonSecretBlue2026!`) |
| `CRON_SECRET` | Chaîne aléatoire de 32 caractères pour sécuriser le cron Vercel |
| `GITHUB_BACKUP_REPO` *(optionnel)* | Format `proprietaire/repo` (ex: `Floiwd/blue2-avis-backups`) |
| `GITHUB_BACKUP_TOKEN` *(optionnel)* | Token GitHub (PAT) avec permission `repo` pour push l'export quotidien |

---

## 🏢 3. Ajouter une nouvelle agence

Vous avez deux manières simples d'ajouter une nouvelle agence :

### Méthode 1 : Directement depuis l'espace `/admin` (Recommandé)
1. Rendez-vous sur votre déploiement : `/admin`.
2. Saisissez votre mot de passe administrateur.
3. Cliquez sur l'onglet **Agences**.
4. Renseignez le nom (ex : `Blue 2.0 - Toulouse`) et le slug (ex : `toulouse`), puis validez.
5. Allez dans l'onglet **Collaborateurs** pour y rattacher les poseurs et conseillers de cette agence.

### Méthode 2 : Par requête SQL dans Supabase
```sql
insert into public.sites (slug, nom, actif) 
values ('toulouse-midi', 'Blue 2.0 - Toulouse & Midi-Pyrénées', true);
```

---

## 🌐 4. Snippet d'intégration pour chaque site web

Pour afficher automatiquement les avis et la note moyenne en temps réel sur le site web de chaque agence :

```html
<!-- Blue 2.0 Avis Widget (Multi-sites) -->
<div id="blue2-avis-widget" data-site="lyon-centre"></div>
<script>
(function() {
  const container = document.getElementById('blue2-avis-widget');
  const site = container.getAttribute('data-site');
  const apiUrl = 'https://blue2-avis.vercel.app/api/avis?site=' + site;

  fetch(apiUrl)
    .then(r => r.json())
    .then(data => {
      const { stats, avis, site: siteInfo } = data;
      if (!stats || stats.total === 0) return;
      
      container.innerHTML = `
        <div style="font-family:system-ui,sans-serif;background:#fff;border-radius:18px;padding:20px;border:1px solid #e0f2fe;box-shadow:0 4px 14px rgba(2,132,199,0.06);max-width:440px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div>
              <strong style="color:#0f172a;font-size:15px;">${siteInfo.nom}</strong>
              <div style="color:#0284c7;font-size:12px;font-weight:600;">${stats.total} avis certifiés</div>
            </div>
            <div style="font-size:20px;font-weight:800;color:#0284c7;background:#f0f9ff;padding:4px 10px;border-radius:12px;border:1px solid #bae6fd;">
              💧 ${stats.moyenne_globale}/5
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;color:#475569;background:#f8fafc;padding:8px 10px;border-radius:10px;">
            <div>Conseil : <strong>${stats.moyenne_conseil}/5</strong></div>
            <div>Diversité : <strong>${stats.moyenne_diversite}/5</strong></div>
            <div>Propreté : <strong>${stats.moyenne_proprete}/5</strong></div>
            <div>Engagements : <strong>${stats.moyenne_engagements}/5</strong></div>
            <div>Qualité/Budget : <strong>${stats.moyenne_qualite_prix}/5</strong></div>
            <div>Recommandation : <strong>${stats.moyenne_recommandation}/5</strong></div>
          </div>
        </div>
      `;
    })
    .catch(console.error);
})();
</script>
```

---

## 📱 5. Envoi pré-rempli & tablettes chantier

Dans l'onglet **"Envoyer un questionnaire"** de l'admin :
1. Choisissez l'agence et le collaborateur.
2. Saisissez le nom, prénom et l'intitulé de la prestation (ex: *Installation piscine coque 8x4*).
3. Cliquez sur **"Générer"** :
   - Vous obtenez un lien direct pré-rempli à envoyer au client par SMS/E-mail.
   - Ou cliquez sur **"Accéder au questionnaire"** pour faire signer le client directement sur la tablette à la réception du chantier.
