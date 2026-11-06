# 💧 Formulaire avis Blue 2.0 (PWA)

Application Web Progressive (PWA) mobile-first officielle pour le recueil, la certification et la diffusion multi-sites des avis clients du réseau **Blue 2.0**.

- **Stack** : Next.js (App Router) + TypeScript + Tailwind CSS
- **PWA** : Installable sur écran d'accueil (iOS / Android / Desktop), Service Worker offline, icônes en gouttes d'eau bleue (192, 512, maskable, apple-touch-icon).
- **Stockage Photos Cloudflare R2** : API compatible S3 (`@aws-sdk/client-s3`), upload direct du navigateur vers R2 par URLs présignées (contourne les limites de taille Vercel). Qualité d'origine préservée (aucune compression sur le fichier original) + miniature (~800px) générée côté client pour affichage rapide. Jusqu'à 15 Mo par photo et 8 photos par avis.
- **Base de données Supabase Postgres** : Seules les clés des fichiers sont stockées en base. Jamais de suppression physique des fichiers (Zéro perte : clés étrangères strictes `ON DELETE RESTRICT` et suppression logique `deleted_at`).
- **Sauvegarde & Keep-Alive Vercel Cron** : Cron quotidien à 4h00 qui maintient actif le plan gratuit Supabase et exporte tous les avis, agences, collaborateurs et la liste de toutes les clés R2 vers un repo GitHub privé ou en téléchargement JSON.
- **Notation tactile** : 6 critères notés de 1 à 5 en gouttes d'eau stylisées (grandes zones tactiles).
- **Multi-sites** : API REST avec CORS activé (`GET /api/avis?site=<slug>`) et widget d'intégration dynamique prêt à l'emploi.
- **Admin protégé** : `/admin` sécurisé par mot de passe pour modérer les avis, gérer les agences/collaborateurs et générer des invitations directes pour tablettes de chantier.

---

## ☁️ 1. Configuration Cloudflare R2 (Stockage Photos HD)

Cloudflare R2 offre un stockage d'objets compatible S3 ultra-rapide sans frais de transfert de données sortant (zéro egress fees).

### A. Créer le bucket R2
1. Connectez-vous sur votre tableau de bord [Cloudflare](https://dash.cloudflare.com/).
2. Dans le menu de gauche, rendez-vous dans **R2 Object Storage**.
3. Cliquez sur **Create bucket**.
4. Nommez votre bucket (ex : `blue2-avis-photos`), choisissez l'emplacement par défaut (ou Europe) et validez.

### B. Créer les clés API R2 (Access Key & Secret Key)
1. Toujours dans **R2 Object Storage**, cliquez sur le lien **Manage R2 API Tokens** à droite.
2. Cliquez sur **Create API token**.
3. Choisissez les permissions : **Object Read & Write** (Lecture et Écriture).
4. Sous *Specify bucket(s)*, vous pouvez sélectionner votre bucket `blue2-avis-photos`.
5. Validez la création :
   - Notez l'**Access Key ID**
   - Notez la **Secret Access Key**
   - Votre **Account ID** Cloudflare est visible dans l'URL de votre console ou sur la page d'accueil R2.

### C. Configuration CORS du bucket R2 (Obligatoire pour l'upload direct)
Puisque le navigateur envoie les photos directement vers Cloudflare R2 via URL présignée, il faut autoriser les requêtes `PUT` et `GET` depuis vos domaines :

1. Entrez dans votre bucket `blue2-avis-photos`.
2. Ouvrez l'onglet **Settings** (Paramètres).
3. Descendez à la section **CORS Policy** et cliquez sur **Add CORS policy** (ou Edit).
4. Collez la configuration JSON suivante :

```json
[
  {
    "AllowedOrigins": [
      "https://blue2-avis.vercel.app",
      "https://*.vercel.app",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### D. Accès public aux photos (Optionnel / Recommandé)
Pour distribuer les photos et miniatures directement via le CDN Cloudflare :
1. Dans l'onglet **Settings** du bucket, section **Public Access**.
2. Activez **R2.dev subdomain** (ex : `https://pub-xxxxxxxx.r2.dev`) OU associez votre propre domaine personnalisé (ex : `https://photos.blue20.fr`).
3. Renseignez cette URL dans la variable `NEXT_PUBLIC_R2_PUBLIC_URL`. *(Si non renseignée, un proxy streaming sécurisé `/api/photos/[key]` prend automatiquement le relais).*

---

## 🗄️ 2. Configuration Supabase (Postgres gratuit)

1. Rendez-vous sur [supabase.com](https://supabase.com) et créez un projet gratuit.
2. Ouvrez le **SQL Editor**.
3. Exécutez le script [supabase/migrations/20261106_init.sql](./supabase/migrations/20261106_init.sql) pour créer les tables `sites`, `collaborateurs`, `avis` et les règles RLS.
4. Exécutez le script [supabase/seed.sql](./supabase/seed.sql) pour charger les vraies agences du réseau Blue 2.0 (Annecy, Léman, Lyon, Clermont-Ferrand, IDF, Saint-Dié-des-Vosges, Colmar, Toulouse).
5. Dans **Project Settings > API**, copiez l'URL du projet, la clé `anon` et la clé `service_role`.

---

## ⚙️ 3. Variables d'environnement sur Vercel

Dans votre projet Vercel (**Settings > Environment Variables**), renseignez :

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète `service_role` Supabase |
| `R2_ACCOUNT_ID` | Account ID Cloudflare (32 caractères hexadécimaux) |
| `R2_ACCESS_KEY_ID` | Clé d'accès R2 Token (32 caractères) |
| `R2_SECRET_ACCESS_KEY` | Clé secrète R2 Token (64 caractères) |
| `R2_BUCKET_NAME` | Nom du bucket (ex : `blue2-avis-photos`) |
| `NEXT_PUBLIC_R2_PUBLIC_URL` *(recommandé)* | URL publique Cloudflare (ex : `https://pub-xxxx.r2.dev`) |
| `ADMIN_PASSWORD` | Mot de passe pour accéder à `/admin` |
| `CRON_SECRET` | Chaîne secrète pour le cron quotidien |
| `GITHUB_BACKUP_REPO` *(optionnel)* | Format `owner/repo` (ex: `Floiwd/blue2-avis-backups`) |
| `GITHUB_BACKUP_TOKEN` *(optionnel)* | Personal Access Token GitHub avec scope `repo` |

---

## 🏢 4. Ajouter une agence

### Depuis l'espace `/admin` (Recommandé) :
1. Connectez-vous sur `/admin`.
2. Rendez-vous dans l'onglet **Agences**.
3. Indiquez le nom et le slug (ex : `perpignan`), puis enregistrez.
4. Dans l'onglet **Collaborateurs**, associez les conseillers et poseurs de cette agence.

---

## 🌐 5. Snippet d'intégration pour chaque site d'agence

Insérez ce code sur n'importe quel site web (WordPress, Webflow, HTML statique) :

```html
<!-- Blue 2.0 Avis Widget (Multi-sites) -->
<div id="blue2-avis-widget" data-site="annecy-siege"></div>
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
