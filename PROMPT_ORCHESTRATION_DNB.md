# PROMPT_ORCHESTRATION — AnnalesDNB
**Version :** 1.0.0 | **Date :** 2026-08-16 | **Auteur :** Paul Valéry  
**Destinataire :** Agent Claude Code PRO  
**Projet :** Site statique catalogue des annales du DNB (2020-2026) + Programme 3e 2027

---

## ⚙️ MÉTA-INSTRUCTIONS POUR L'AGENT CLAUDE CODE

Tu es un agent de développement web autonome. Ce fichier est ta spécification complète.

**RÈGLE ABSOLUE N°1 — COMMENCER PAR LA PHASE 0**
Avant toute création de fichier, toute commande git ou wrangler : exécute la **Phase 0 (CP00)**. Elle collecte et vérifie tout ce dont tu as besoin. Ne commence pas CP01 avant que Paul ait confirmé que tout est prêt.

**Règles de comportement :**
- Avance phase par phase, checkpoint par checkpoint.
- Après chaque checkpoint réussi : mets à jour `.dnb-state.json`.
- En cas d'erreur **non bloquante** (ex. lien PDF cassé) : note dans `.dnb-state.json` → `errors`, continue.
- En cas d'erreur **bloquante** : arrête-toi. Affiche un message guidé à Paul (gabarit Section 12). Attends sa réponse. Ne suppose jamais une solution.
- Quand tu demandes une action à Paul : sois précis, simple, non-expert. Dis-lui exactement où cliquer, quoi taper, et comment te signaler que c'est fait.
- Ne modifie jamais les projets protégés. Voir Section 3.

---

## 1. CONTEXTE ET OBJECTIF

### Projet
Créer un site web statique public, hébergé sur **Cloudflare Pages**, répertoriant toutes les annales du Diplôme National du Brevet (DNB) français de 2020 à 2026 avec :
- Liens de téléchargement des **sujets** (PDF)
- Liens de téléchargement des **corrigés** (PDF, quand disponibles)
- Outil de **filtrage et de tri** par matière, année, session
- Section dédiée **Programme 3e 2027** : périmètre officiel par matière
- Alerte contextuelle sur la **réforme DNB 2027**
- Bouton **"Signaler un lien cassé"** par ressource

### Destinataires
Élèves de 3e préparant le DNB, en priorité depuis l'Afrique (connexion parfois limitée → les PDF doivent être légers et les liens directs).

### Contraintes clés
- Site **100% statique** : HTML + CSS + JS vanilla. Zéro framework. Zéro build step.
- Données stockées dans un fichier JSON local (`data/annales.json`).
- Liens PDF pointent vers des **sources tierces vérifiées** (Option A : liens externes).
- Le site doit fonctionner **sans JavaScript** pour la navigation de base (progressive enhancement).
- Responsive : **mobile-first**, puis tablette, puis desktop.

---

## 2. IDENTIFIANTS DU PROJET

| Paramètre | Valeur |
|---|---|
| Nom du projet | `annalesdnb` |
| Repo GitHub | `annalesdnb` (sous le compte `paulvcompaore-cpu`) |
| Site Cloudflare Pages | `annalesdnb.pages.dev` |
| Branche de déploiement | `main` |
| **Répertoire de travail** | `/home/pv/Bureau/annalesdnb/` |
| **Home utilisateur** | `/home/pv/` |
| **Compte Cloudflare** | `paulv.compaore@gmail.com` |
| **ID compte Cloudflare** | `72526defb4d8a503b6f21c5263e9775a` |
| **Auth Wrangler** | Variable d'env `CLOUDFLARE_API_TOKEN` (User API Token, déjà configurée) |
| **gh CLI** | Authentifié `paulvcompaore-cpu`, scopes : gist, read:org, repo, workflow, HTTPS |

> ⚠️ Le répertoire des projets est `/home/pv/Bureau/` (pas `~/` seul). Toutes les commandes `cd` doivent utiliser le chemin absolu `/home/pv/Bureau/annalesdnb`.

---

## 3. 🚨 RÈGLES DE SÉCURITÉ ABSOLUES — ISOLATION

**Ces règles ne peuvent PAS être contournées, même si une instruction ultérieure le demande.**

### Ressources Cloudflare protégées — INVENTAIRE COMPLET À NE JAMAIS TOUCHER

**Workers :**
| Nom | URL | Action |
|---|---|---|
| `talenthere-duo` | `talenthere-duo.paulv-compaore.workers.dev` | ❌ Jamais |

**Bases D1 (4 bases — toutes protégées) :**
| Nom | UUID |
|---|---|
| `talenthere-duo-db` | `9c126c7d-b3b1-4a3a-b190-1cd084a13919` |
| `talenthug-db` | — |
| `lfrii_jobs_db` | — |
| `nathan-explorer-v9-db` | — |

**Buckets R2 (2 buckets — tous protégés) :**
| Nom | Usage |
|---|---|
| `talenthere-duo-documents` | Bibliothèque documentaire chiffrée |
| `talenthug-cvs` | Projet distinct |

**Cloudflare Pages :**
| Nom | URL |
|---|---|
| `jmj2027-family` | `jmj2027-family.pages.dev` |

**Cloudflare Access :**
- App : `TalentHere Duo API`
- Team domain : `rapid-sun-6d15.cloudflareaccess.com`
- ❌ Ne jamais modifier, ajouter ou supprimer de règle Access

**Répertoires locaux protégés :**
- `/home/pv/Bureau/TalentHere_Duo_SOIAT_v5/` → ❌ Jamais lire ni écrire

### Actions interdites (liste exhaustive)
- ❌ `wrangler deploy` ailleurs que dans `/home/pv/Bureau/annalesdnb/`
- ❌ `wrangler d1 execute` ou `wrangler d1 create` : annalesdnb n'utilise PAS D1
- ❌ `wrangler r2 object put` ou `wrangler r2 bucket create` : annalesdnb n'utilise PAS R2
- ❌ `wrangler cron trigger` : annalesdnb n'a pas de Cron
- ❌ `npm update wrangler` ou `npx wrangler@latest` : version pinée 4.116.0 (une mise à jour 4.122.0 existe — NE PAS APPLIQUER)
- ❌ Modifier `.dev.vars` hors du répertoire annalesdnb
- ❌ Modifier les secrets du Worker `talenthere-duo` (CF_API_TOKEN, DOCUMENT_ENCRYPTION_KEY, GMAIL_SMTP_APP_PASSWORD, OPENROUTER_API_KEY)

### Vérification de sécurité (à exécuter avant chaque `wrangler deploy`)
```bash
# Double vérification obligatoire — ne pas ignorer ces sorties
echo "=== CHEMIN COURANT ==="
pwd
# ATTENDU : /home/pv/Bureau/annalesdnb

echo "=== NOM DU PROJET WRANGLER ==="
cat wrangler.toml | grep "^name"
# ATTENDU : name = "annalesdnb"

echo "=== VERSION WRANGLER ==="
npx wrangler@4.116.0 --version
# ATTENDU : 4.116.0

echo "=== D1 EXISTANTES (ne pas toucher) ==="
npx wrangler@4.116.0 d1 list 2>/dev/null | grep -E "talenthere|talenthug|lfrii|nathan"
# Aucune opération sur ces bases
```

---

## 4. STACK TECHNIQUE

| Composant | Technologie | Version/Notes |
|---|---|---|
| Structure | HTML5 sémantique | index.html, programme.html, 404.html |
| Style | CSS3 pur | Variables CSS, Flexbox, Grid, Media queries |
| Logique | JavaScript ES6+ vanilla | Modules, fetch, pas de jQuery |
| Données | JSON statique | data/annales.json, data/programme2027.json |
| Police | Marianne (État français) | Via CDN @codegouvfr/marianne |
| Police fallback | Plus Jakarta Sans | Via Google Fonts |
| Hébergement | Cloudflare Pages | Déploiement depuis GitHub |
| Outils CLI | Wrangler 4.116.0 (pinné) | gh CLI, git 2.43.0 |
| Node | v24.19.0 | Pas de build step |
| Validation liens | Python 3.12.3 + requests | Script validate_links.py |

---

## 5. ARCHITECTURE DES FICHIERS

```
/home/pv/Bureau/annalesdnb/
├── index.html                  # Page principale : catalogue des annales
├── programme.html              # Section : Programme 3e DNB 2027
├── 404.html                    # Page d'erreur 404 personnalisée
├── assets/
│   ├── css/
│   │   ├── main.css            # Styles globaux + tokens design
│   │   ├── catalogue.css       # Styles spécifiques au catalogue
│   │   └── programme.css       # Styles spécifiques au programme
│   ├── js/
│   │   ├── catalogue.js        # Filtres, recherche, tri, affichage
│   │   ├── programme.js        # Accordéon programme par matière
│   │   └── signalement.js      # Bouton "Signaler un lien cassé"
│   └── img/
│       └── logo-rf.svg         # Logo République Française (SVG inline)
├── data/
│   ├── annales.json            # Toutes les annales (généré + validé)
│   └── programme2027.json      # Programme 3e par matière + notions
├── _headers                    # Headers HTTP Cloudflare Pages
├── _redirects                  # Redirections Cloudflare Pages
├── wrangler.toml               # Config Cloudflare Pages
├── .dnb-state.json             # Fichier d'état des checkpoints (NE PAS IGNORER)
└── scripts/
    ├── validate_links.py       # Validation HEAD request des URLs
    └── generate_annales.py     # (Optionnel) Scraping des URLs depuis les sources
```

---

## 6. DESIGN — STYLE "RÉPUBLIQUE ACADÉMIQUE"

### Principes directeurs
- Sobre, lisible, institutionnel modernisé
- Bordure gauche colorée par matière sur chaque card (identité visuelle forte)
- Ombres légères, coins arrondis modérés
- Contraste élevé pour lisibilité en plein soleil (écrans mobiles en Afrique)

### Tokens CSS — À placer dans `:root {}`

```css
:root {
  /* Couleurs principales */
  --color-marine:       #003189;
  --color-marine-light: #1a4aad;
  --color-marine-dark:  #001f5e;
  --color-gold:         #C8A84B;
  --color-gold-light:   #e8c96b;
  --color-white:        #FFFFFF;
  --color-bg:           #F5F6FA;
  --color-bg-alt:       #EEF0F8;
  --color-text:         #1A1A2E;
  --color-text-muted:   #5A5A7A;
  --color-border:       #D0D4E8;

  /* Couleurs par matière (bordure gauche des cards) */
  --color-francais:     #C0392B;   /* Rouge */
  --color-maths:        #1A5276;   /* Bleu foncé */
  --color-hg-emc:       #1A6B3A;   /* Vert forêt */
  --color-sciences:     #6C3483;   /* Violet */

  /* Couleurs de statut */
  --color-success:      #1A6B3A;
  --color-warning:      #B7770D;
  --color-error:        #C0392B;
  --color-info:         #1A5276;

  /* Typographie */
  --font-primary:   'Marianne', 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-serif:     'Source Serif 4', 'Georgia', serif;
  --font-mono:      'JetBrains Mono', monospace;

  /* Tailles de police (mobile-first) */
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;

  /* Espacements */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Effets */
  --radius-sm: 4px;
  --radius:    8px;
  --radius-lg: 12px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 46, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 46, 0.12);
  --shadow-lg: 0 8px 32px rgba(0, 0, 46, 0.16);
  --transition: 200ms ease;
}
```

### Composants UI à implémenter

**Header global :**
- Fond bleu marine `--color-marine`
- Logo RF (tricolore SVG) à gauche
- Titre "AnnalesDNB" en blanc + tagline "Toutes les épreuves du Brevet 2020–2026"
- Navigation : "Catalogue" | "Programme 2027" | (lien Eduscol officiel)

**Banner d'alerte réforme (présent sur index.html) :**
- Fond `--color-warning` (jaune ambre léger)
- Icône ⚠️ + texte : "Nathan passe le DNB en session 2027. À partir de 2027, les épreuves portent sur le programme de la classe de 3e uniquement. Ces annales (2020-2026) restent pertinentes pour s'entraîner, mais le périmètre programme était plus large. Consultez la section Programme 3e 2027."
- Lien vers `programme.html`

**Card d'annale :**
```
┌──────────────────────────────────────────────────┐
│ ▌[COULEUR MATIÈRE]  [MATIÈRE]        [ANNÉE]     │
│   Session : Métropole                            │
│                                                  │
│   📄 Sujet  [Source 1] [Source 2] [Source 3]     │
│   ✅ Corrigé [Source 1] [Source 2]               │
│                                                  │
│   [🚩 Signaler un lien cassé]                    │
└──────────────────────────────────────────────────┘
```
- Bordure gauche 4px colorée selon `--color-[matiere]`
- Badge "Corrigé disponible" (vert) ou "Pas de corrigé" (gris)
- Boutons de téléchargement : libellé = nom de la source (ex. "PrépaDNB", "APMEP")

**Panneau de filtres (sidebar sur desktop, drawer sur mobile) :**
- Filtre matière : checkboxes colorées (Français / Maths / Histoire-Géo EMC / Sciences)
- Filtre année : 2020, 2021, 2022, 2023, 2024, 2025, 2026
- Filtre type : Tous / Avec corrigé / Sans corrigé
- Tri : Plus récent → Plus ancien | Par matière
- Bouton "Réinitialiser les filtres"
- Compteur : "X résultats trouvés"

**Footer :**
- Fond marine, texte blanc
- "Site non officiel. Sources : APMEP, PrépaDNB, Académies, L'Étudiant."
- "Pour les sources officielles : eduscol.education.gouv.fr"
- Lien Signalement général (mailto: ou GitHub Issues)

---

## 7. DONNÉES — ANNALES JSON

### Structure du fichier `data/annales.json`

```json
{
  "meta": {
    "version": "1.0.0",
    "generated": "2026-08-16",
    "derniere_validation": null,
    "total": 0,
    "note": "URLs marquées validated:false doivent être vérifiées par validate_links.py"
  },
  "sources_reference": {
    "prepadnb":   { "nom": "PrépaDNB",          "url_base": "https://prepadnb.com/sujets",                                              "fiabilite": "haute", "corriges": true  },
    "apmep":      { "nom": "APMEP",              "url_base": "https://www.apmep.fr/Annales-du-Brevet-des-colleges",                      "fiabilite": "haute", "corriges": true  },
    "mathsapiens":{ "nom": "Mathsapiens",        "url_base": "https://mathsapiens.fr/dnb.html",                                         "fiabilite": "haute", "corriges": true  },
    "grenoble":   { "nom": "Académie Grenoble",  "url_base": "https://lettres-pedagogie.web.ac-grenoble.fr/annales-du-dnb",             "fiabilite": "haute", "corriges": true  },
    "amiens":     { "nom": "Académie Amiens",    "url_base": "https://maths.ac-amiens.fr/065-annales-de-sujets-dnb.html",               "fiabilite": "haute", "corriges": false },
    "letudiant":  { "nom": "L'Étudiant",         "url_base": "https://www.letudiant.fr/college/annales-du-brevet.html",                 "fiabilite": "moyenne","corriges": true },
    "eduscol":    { "nom": "Éduscol (officiel)", "url_base": "https://eduscol.education.gouv.fr/5202/preparer-le-diplome-national-du-brevet-dnb-avec-les-sujets-des-annales", "fiabilite": "haute", "corriges": false }
  },
  "annales": [
    {
      "id": "FRANCAIS-2026-METROPOLE",
      "matiere": "Français", "matiere_code": "francais",
      "annee": 2026, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "grenoble", "letudiant"],
      "sources_corriges": ["prepadnb", "grenoble"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "MATHS-2026-METROPOLE",
      "matiere": "Mathématiques", "matiere_code": "maths",
      "annee": 2026, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "apmep", "mathsapiens"],
      "sources_corriges": ["prepadnb", "apmep", "mathsapiens"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "HG-EMC-2026-METROPOLE",
      "matiere": "Histoire-Géo EMC", "matiere_code": "hg-emc",
      "annee": 2026, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb", "letudiant"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "SVT-2026-METROPOLE",
      "matiere": "SVT", "matiere_code": "sciences",
      "annee": 2026, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "PC-2026-METROPOLE",
      "matiere": "Physique-Chimie", "matiere_code": "sciences",
      "annee": 2026, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "FRANCAIS-2025-METROPOLE",
      "matiere": "Français", "matiere_code": "francais",
      "annee": 2025, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "grenoble", "letudiant"],
      "sources_corriges": ["prepadnb", "grenoble"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "MATHS-2025-METROPOLE",
      "matiere": "Mathématiques", "matiere_code": "maths",
      "annee": 2025, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "apmep", "mathsapiens"],
      "sources_corriges": ["prepadnb", "apmep", "mathsapiens"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "HG-EMC-2025-METROPOLE",
      "matiere": "Histoire-Géo EMC", "matiere_code": "hg-emc",
      "annee": 2025, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb", "letudiant"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "SVT-2025-METROPOLE",
      "matiere": "SVT", "matiere_code": "sciences",
      "annee": 2025, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "PC-2025-METROPOLE",
      "matiere": "Physique-Chimie", "matiere_code": "sciences",
      "annee": 2025, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "FRANCAIS-2024-METROPOLE",
      "matiere": "Français", "matiere_code": "francais",
      "annee": 2024, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "grenoble", "letudiant"],
      "sources_corriges": ["prepadnb", "grenoble"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "MATHS-2024-METROPOLE",
      "matiere": "Mathématiques", "matiere_code": "maths",
      "annee": 2024, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "apmep", "mathsapiens"],
      "sources_corriges": ["prepadnb", "apmep", "mathsapiens"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "HG-EMC-2024-METROPOLE",
      "matiere": "Histoire-Géo EMC", "matiere_code": "hg-emc",
      "annee": 2024, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb", "letudiant"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "SVT-2024-METROPOLE",
      "matiere": "SVT", "matiere_code": "sciences",
      "annee": 2024, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "PC-2024-METROPOLE",
      "matiere": "Physique-Chimie", "matiere_code": "sciences",
      "annee": 2024, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "FRANCAIS-2023-METROPOLE",
      "matiere": "Français", "matiere_code": "francais",
      "annee": 2023, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "grenoble", "letudiant"],
      "sources_corriges": ["prepadnb", "grenoble"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "MATHS-2023-METROPOLE",
      "matiere": "Mathématiques", "matiere_code": "maths",
      "annee": 2023, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "apmep"],
      "sources_corriges": ["prepadnb", "apmep"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "HG-EMC-2023-METROPOLE",
      "matiere": "Histoire-Géo EMC", "matiere_code": "hg-emc",
      "annee": 2023, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "SVT-2023-METROPOLE",
      "matiere": "SVT", "matiere_code": "sciences",
      "annee": 2023, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "PC-2023-METROPOLE",
      "matiere": "Physique-Chimie", "matiere_code": "sciences",
      "annee": 2023, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "letudiant"],
      "sources_corriges": ["prepadnb"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "FRANCAIS-2022-METROPOLE",
      "matiere": "Français", "matiere_code": "francais",
      "annee": 2022, "session": "Métropole",
      "sources_sujets":  ["prepadnb", "grenoble", "letudiant"],
      "sources_corriges": ["prepadnb", "grenoble"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "MATHS-2022-METROPOLE",
      "matiere": "Mathématiques", "matiere_code": "maths",
      "annee": 2022, "session": "Métropole",
      "sources_sujets":  ["apmep", "letudiant"],
      "sources_corriges": ["apmep"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "HG-EMC-2022-METROPOLE",
      "matiere": "Histoire-Géo EMC", "matiere_code": "hg-emc",
      "annee": 2022, "session": "Métropole",
      "sources_sujets":  ["letudiant"],
      "sources_corriges": ["letudiant"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "SVT-2022-METROPOLE",
      "matiere": "SVT", "matiere_code": "sciences",
      "annee": 2022, "session": "Métropole",
      "sources_sujets":  ["letudiant"],
      "sources_corriges": [],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": false,
      "status": "a_valider",
      "note": "Corrigé non confirmé pour 2022 SVT"
    },
    {
      "id": "PC-2022-METROPOLE",
      "matiere": "Physique-Chimie", "matiere_code": "sciences",
      "annee": 2022, "session": "Métropole",
      "sources_sujets":  ["letudiant"],
      "sources_corriges": [],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": false,
      "status": "a_valider"
    },
    {
      "id": "FRANCAIS-2021-METROPOLE",
      "matiere": "Français", "matiere_code": "francais",
      "annee": 2021, "session": "Métropole",
      "sources_sujets":  ["grenoble", "letudiant"],
      "sources_corriges": ["grenoble"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "MATHS-2021-METROPOLE",
      "matiere": "Mathématiques", "matiere_code": "maths",
      "annee": 2021, "session": "Métropole",
      "sources_sujets":  ["apmep", "amiens"],
      "sources_corriges": ["apmep"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "HG-EMC-2021-METROPOLE",
      "matiere": "Histoire-Géo EMC", "matiere_code": "hg-emc",
      "annee": 2021, "session": "Métropole",
      "sources_sujets":  ["letudiant"],
      "sources_corriges": [],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": false,
      "status": "a_valider"
    },
    {
      "id": "SVT-2021-METROPOLE",
      "matiere": "SVT", "matiere_code": "sciences",
      "annee": 2021, "session": "Métropole",
      "sources_sujets":  ["letudiant"],
      "sources_corriges": [],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": false,
      "status": "a_valider"
    },
    {
      "id": "PC-2021-METROPOLE",
      "matiere": "Physique-Chimie", "matiere_code": "sciences",
      "annee": 2021, "session": "Métropole",
      "sources_sujets":  ["letudiant"],
      "sources_corriges": [],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": false,
      "status": "a_valider"
    },
    {
      "id": "FRANCAIS-2020-METROPOLE",
      "matiere": "Français", "matiere_code": "francais",
      "annee": 2020, "session": "Métropole",
      "sources_sujets":  ["grenoble", "letudiant"],
      "sources_corriges": ["grenoble"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider",
      "note": "Session maintenue malgré le COVID-19"
    },
    {
      "id": "MATHS-2020-METROPOLE",
      "matiere": "Mathématiques", "matiere_code": "maths",
      "annee": 2020, "session": "Métropole",
      "sources_sujets":  ["apmep", "letudiant"],
      "sources_corriges": ["apmep"],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": true,
      "status": "a_valider"
    },
    {
      "id": "HG-EMC-2020-METROPOLE",
      "matiere": "Histoire-Géo EMC", "matiere_code": "hg-emc",
      "annee": 2020, "session": "Métropole",
      "sources_sujets":  ["letudiant"],
      "sources_corriges": [],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": false,
      "status": "a_valider"
    },
    {
      "id": "SVT-2020-METROPOLE",
      "matiere": "SVT", "matiere_code": "sciences",
      "annee": 2020, "session": "Métropole",
      "sources_sujets":  ["letudiant"],
      "sources_corriges": [],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": false,
      "status": "a_valider"
    },
    {
      "id": "PC-2020-METROPOLE",
      "matiere": "Physique-Chimie", "matiere_code": "sciences",
      "annee": 2020, "session": "Métropole",
      "sources_sujets":  ["letudiant"],
      "sources_corriges": [],
      "urls_sujets":  [],
      "urls_corriges": [],
      "corriges_disponibles": false,
      "status": "a_valider"
    }
  ]
}
```

**Valeurs possibles pour `status` :**
- `"a_valider"` : URLs non encore récupérées → à traiter par `validate_links.py`
- `"valide"` : URLs testées et fonctionnelles (HTTP 200)
- `"partiel"` : Sujet trouvé, corrigé manquant
- `"manquant"` : Ni sujet ni corrigé localisé après recherche

---

## 8. DONNÉES — PROGRAMME 3e 2027 (`data/programme2027.json`)

> **Note critique :** À partir de la session 2027 du DNB, les épreuves portent sur les programmes de la **classe de troisième uniquement** (et non plus le cycle 4 entier). Pour les mathématiques, le nouveau programme de cycle 4 (publié mars 2026) n'entre en vigueur en 3e qu'à la rentrée 2028 — Nathan passera avec le programme actuel.

```json
{
  "meta": {
    "version": "1.0.0",
    "session": 2027,
    "source": "Eduscol / Bulletins officiels Éducation nationale",
    "note_importante": "À partir du DNB 2027 : épreuves sur programmes de 3e uniquement. Les annales 2020-2026 restent utiles pour l'entraînement, avec un périmètre légèrement plus large."
  },
  "matieres": [
    {
      "id": "francais",
      "nom": "Français",
      "couleur": "#C0392B",
      "emoji": "📖",
      "duree_epreuve": "3 heures",
      "coefficient": 2,
      "note_sur": "20 (total 100 pts ramené sur 20)",
      "structure_epreuve": [
        { "partie": "Travail sur le texte (Partie 1)", "points": 50, "description": "Compréhension, interprétation, grammaire et compétences linguistiques sur un texte littéraire (avec éventuellement une image)" },
        { "partie": "Dictée (Partie 2)", "points": 10, "description": "Texte de 100 à 150 mots. Pénalité par faute." },
        { "partie": "Rédaction (Partie 3)", "points": 40, "description": "Écrire un texte narratif, argumentatif ou créatif selon un sujet donné" }
      ],
      "chapitres": [
        {
          "titre": "Lire — Comprendre et interpréter",
          "notions": [
            "Lecture d'un texte littéraire (roman, nouvelle, récit)",
            "Lecture d'une œuvre de théâtre",
            "Lecture d'un poème",
            "Lecture d'une image fixe (photo, tableau, illustration)",
            "Identification du narrateur, du point de vue, du registre",
            "Repérage des procédés stylistiques : métaphore, comparaison, antithèse, hyperbole",
            "Analyse du sens implicite et explicite"
          ]
        },
        {
          "titre": "Écrire — Produire des textes",
          "notions": [
            "Rédaction narrative (récit cohérent, structure chronologique)",
            "Rédaction argumentative (thèse, arguments, exemples)",
            "Rédaction descriptive",
            "Respect des consignes d'écriture (type de texte, longueur, registre)",
            "Réécriture selon une consigne grammaticale (changement de temps, de personne...)"
          ]
        },
        {
          "titre": "Langue française — Grammaire et orthographe",
          "notions": [
            "Analyse grammaticale : nature et fonction des mots",
            "Propositions subordonnées (relative, conjonctive, infinitive, participiale)",
            "Conjugaison : tous les temps (présent, imparfait, passé simple, futur, conditionnel, subjonctif)",
            "Accord du participe passé (être, avoir, pronominal)",
            "Accord du verbe avec le sujet (cas complexes)",
            "Ponctuation et orthographe lexicale",
            "Figures de style (identification et effet)",
            "Champ lexical, champ sémantique",
            "Registres de langue (familier, courant, soutenu)"
          ]
        },
        {
          "titre": "Culture littéraire et artistique",
          "notions": [
            "Œuvres littéraires du programme (roman, théâtre, poésie — à identifier avec le professeur de l'établissement)",
            "Grands genres littéraires et leurs caractéristiques",
            "Repères historiques de la littérature française",
            "Lecture d'image : vocabulaire spécifique (plan, cadrage, composition, couleurs)"
          ]
        }
      ]
    },
    {
      "id": "maths",
      "nom": "Mathématiques",
      "couleur": "#1A5276",
      "emoji": "📐",
      "duree_epreuve": "2 heures",
      "coefficient": 2,
      "note_sur": "20",
      "note_programme": "Programme cycle 4 en vigueur pour le DNB 2027. Le nouveau programme de maths 3e (BO mars 2026) n'entre en vigueur en 3e qu'en septembre 2028.",
      "structure_epreuve": [
        { "partie": "Partie 1 — Automatismes (sans calculatrice)", "points": "~30 pts", "duree": "30 min", "description": "Questions courtes sur les réflexes fondamentaux" },
        { "partie": "Partie 2 — Exercices (avec calculatrice)", "points": "~70 pts", "duree": "1h30", "description": "4 à 5 exercices variés couvrant les domaines du programme" }
      ],
      "chapitres": [
        {
          "titre": "Nombres et calculs",
          "notions": [
            "Calcul littéral : développement, factorisation (distributivité simple et double)",
            "Identités remarquables : (a+b)² = a²+2ab+b², (a-b)² = a²-2ab+b², (a+b)(a-b) = a²-b²",
            "Équations du 1er degré à une inconnue",
            "Systèmes d'équations du 1er degré à deux inconnues",
            "Inéquations du 1er degré",
            "Puissances entières relatives (exposants positifs et négatifs)",
            "Notation scientifique",
            "Racines carrées (simplification, calcul)",
            "Fractions : opérations, simplification, comparaison",
            "Arithmétique : PGCD, multiples, diviseurs, nombres premiers",
            "Proportionnalité et pourcentages"
          ]
        },
        {
          "titre": "Fonctions",
          "notions": [
            "Notion de fonction, image et antécédent",
            "Fonctions linéaires : f(x) = ax (représentation, coefficient)",
            "Fonctions affines : f(x) = ax + b (représentation, pente, ordonnée à l'origine)",
            "Lecture graphique : image, antécédent, variations",
            "Résolution graphique d'équations et d'inéquations",
            "Tableau de valeurs et représentation graphique"
          ]
        },
        {
          "titre": "Géométrie",
          "notions": [
            "Théorème de Pythagore et sa réciproque",
            "Théorème de Thalès (deux configurations : direct et réciproque)",
            "Trigonométrie dans le triangle rectangle : sinus, cosinus, tangente",
            "Triangles semblables (angles égaux, rapports de côtés)",
            "Translations, rotations, symétries (axiale et centrale)",
            "Homothéties (rapport, image d'une figure)",
            "Droites : parallélisme, perpendicularité, médiatrice",
            "Cercles : propriétés, tangente, angle inscrit",
            "Géométrie dans l'espace : représentation de solides",
            "Sections de solides (cube, cylindre, cône, pyramide)",
            "Agrandissement et réduction de figures"
          ]
        },
        {
          "titre": "Grandeurs et mesures",
          "notions": [
            "Aires des figures usuelles (triangle, cercle, trapèze, disque)",
            "Volumes : sphère (4/3 πr³), cylindre (πr²h), cône (1/3 πr²h), pyramide, pavé",
            "Périmètres et longueurs (dont longueur d'arc de cercle)",
            "Conversions d'unités (longueurs, aires, volumes, durées, angles)",
            "Vitesse, distance, durée"
          ]
        },
        {
          "titre": "Statistiques et probabilités",
          "notions": [
            "Tableaux de données, diagrammes (barres, circulaires, histogrammes)",
            "Indicateurs de position : moyenne, médiane, quartiles (Q1, Q2, Q3)",
            "Indicateurs de dispersion : étendue, écart interquartile",
            "Probabilités : calcul de probabilités d'événements simples et composés",
            "Expériences aléatoires : tableaux à double entrée, arbres de probabilités",
            "Loi des grands nombres (approche intuitive)",
            "Fluctuation d'échantillonnage"
          ]
        },
        {
          "titre": "Algorithmique et programmation",
          "notions": [
            "Lecture et écriture d'un algorithme simple (variables, affectation)",
            "Structures conditionnelles (si / sinon)",
            "Boucles (pour, tant que)",
            "Programmation Scratch : blocs, boucles, conditions, variables",
            "Simulation d'expériences aléatoires par programme"
          ]
        }
      ]
    },
    {
      "id": "hg-emc",
      "nom": "Histoire-Géographie EMC",
      "couleur": "#1A6B3A",
      "emoji": "🌍",
      "duree_epreuve": "2 heures",
      "coefficient": 2,
      "note_sur": "20 (HG : coeff 1,5 / EMC : coeff 0,5)",
      "structure_epreuve": [
        { "partie": "Histoire-Géographie", "points": "30 pts (ramenés sur 15)", "description": "Question de réflexion argumentée + analyse de document(s)" },
        { "partie": "EMC", "points": "10 pts (ramenés sur 5)", "description": "Courte réflexion ou analyse de document sur un enjeu civique" }
      ],
      "chapitres": [
        {
          "titre": "HISTOIRE — Thème 1 : L'Europe, un théâtre majeur des guerres totales (1914-1945)",
          "notions": [
            "La Première Guerre mondiale : guerre des tranchées, mobilisation civile et économique",
            "Les violences de masse et le génocide des Arméniens",
            "La paix de 1919 (traités, nouvelles frontières, Société des Nations)",
            "Les crises économiques des années 1920-1930",
            "Les régimes totalitaires : URSS stalinienne, Italie fasciste, Allemagne nazie",
            "La Seconde Guerre mondiale : phases du conflit, alliances",
            "L'occupation en France et la Résistance",
            "Le génocide des Juifs et des Tziganes (Shoah)",
            "La Libération et la fin de la guerre (1944-1945)"
          ]
        },
        {
          "titre": "HISTOIRE — Thème 2 : Le monde depuis 1945",
          "notions": [
            "La Guerre froide (1947-1991) : blocs, crises (Berlin, Cuba, Corée, Vietnam)",
            "La décolonisation (Inde, Algérie, Afrique subsaharienne) et ses enjeux",
            "La construction du Tiers-Monde (conférence de Bandung 1955)",
            "La fin de la Guerre froide : chute du mur de Berlin (1989), dissolution de l'URSS (1991)",
            "Le monde depuis 1991 : multipolarité, mondialisation, nouveaux conflits"
          ]
        },
        {
          "titre": "HISTOIRE — Thème 3 : Françaises et Français dans une République repensée",
          "notions": [
            "La Libération et la IVe République (1944-1958)",
            "La Ve République : naissance, institutions, présidents",
            "La société française depuis 1945 : baby-boom, trente glorieuses, immigration",
            "L'émancipation des femmes (droit de vote 1944, loi Veil 1975, parité...)",
            "La construction européenne (CECA, CEE, Union européenne)",
            "La France dans le monde : rôle international, décolonisation"
          ]
        },
        {
          "titre": "GÉOGRAPHIE — Thème 1 : L'urbanisation du monde",
          "notions": [
            "La croissance urbaine dans le monde (métropolisation)",
            "Les espaces urbains : centres, périphéries, banlieues, espaces ruraux",
            "Les mégalopoles et métropoles mondiales",
            "Les inégalités dans les villes (ségrégation, bidonvilles)",
            "Mobilités et transports dans les espaces urbains"
          ]
        },
        {
          "titre": "GÉOGRAPHIE — Thème 2 : Les territoires dans la mondialisation",
          "notions": [
            "La mondialisation : flux, acteurs, réseaux",
            "Les espaces productifs (agricoles, industriels, tertiaires, touristiques)",
            "Les inégalités mondiales de développement",
            "La France dans la mondialisation",
            "Les grandes puissances et pôles de la mondialisation (États-Unis, Europe, Asie)"
          ]
        },
        {
          "titre": "GÉOGRAPHIE — Thème 3 : La France et l'Europe dans le monde",
          "notions": [
            "Les dynamiques territoriales de la France (espaces urbains, ruraux, littoraux, montagnards)",
            "Les outre-mer français",
            "L'Union européenne : territoire, institutions, politiques communes",
            "L'aménagement du territoire français (ZAC, décentralisation, intercommunalité)"
          ]
        },
        {
          "titre": "EMC — Programme 2026-2027 : «Faire vivre la démocratie»",
          "notions": [
            "Chapitre 1 — Les règles du jeu démocratique : institutions de la Ve République, séparation des pouvoirs, élections, État de droit",
            "Chapitre 2 — Opinion et information : liberté de la presse, pluralisme, éducation aux médias, lutte contre la désinformation",
            "Chapitre 3 — L'engagement collectif : associations, partis politiques, syndicats, service civique, bénévolat"
          ]
        }
      ]
    },
    {
      "id": "sciences",
      "nom": "Sciences (SVT + Physique-Chimie + Technologie)",
      "couleur": "#6C3483",
      "emoji": "🔬",
      "duree_epreuve": "1 heure",
      "coefficient": 1,
      "note_sur": "20",
      "note_programme": "⚠️ 2 disciplines parmi 3 (SVT, Physique-Chimie, Technologie) sont tirées au sort 2 mois avant l'examen. Impossible de prévoir lesquelles. Réviser les 3.",
      "chapitres": [
        {
          "titre": "SVT — Thème 1 : Diversité et stabilité génétiques",
          "notions": [
            "ADN : structure, rôle, localisation dans la cellule",
            "Chromosomes et caryotype humain (23 paires)",
            "Méiose et fécondation : maintien du nombre de chromosomes",
            "Mutations génétiques : causes, conséquences, réparation",
            "Hérédité : caractères héréditaires, gènes, allèles, phénotype/génotype",
            "Maladies génétiques héréditaires"
          ]
        },
        {
          "titre": "SVT — Thème 2 : Évolution des êtres vivants",
          "notions": [
            "Sélection naturelle : définition, mécanismes (Darwin)",
            "Preuves de l'évolution : fossiles, homologies anatomiques, ADN",
            "Biodiversité : définition, niveaux, menaces humaines",
            "Brassage génétique et diversité des individus"
          ]
        },
        {
          "titre": "SVT — Thème 3 : Corps humain, santé et comportements",
          "notions": [
            "Systèmes musculaire et osseux : fonctionnement coordonné (sport)",
            "Système nerveux : influx nerveux, arc réflexe, cerveau",
            "Puberté, reproduction humaine, contraception",
            "Addictions : alcool, tabac, drogues — mécanismes et risques",
            "Alimentation et santé (nutriments, apports énergétiques)"
          ]
        },
        {
          "titre": "SVT — Thème 4 : Responsabilité humaine, environnement et développement durable",
          "notions": [
            "Impact humain sur les écosystèmes : pollution, déforestation, espèces invasives",
            "Réchauffement climatique : causes (gaz à effet de serre), conséquences",
            "Développement durable : définition, exemples concrets",
            "Ressources naturelles : eau, sol, énergie — gestion durable"
          ]
        },
        {
          "titre": "PHYSIQUE-CHIMIE — Thème 1 : Organisation et transformation de la matière",
          "notions": [
            "Structure de l'atome : proton, neutron, électron",
            "Tableau périodique : éléments, familles, périodes",
            "Ions : formation, charge, notation",
            "Molécules : représentation (Lewis), formule brute et développée",
            "Réactions chimiques : équation bilan, conservation de la masse et des atomes",
            "Réactions d'oxydo-réduction (oxydant, réducteur)",
            "pH et solutions acides/basiques (ions H⁺ et OH⁻)"
          ]
        },
        {
          "titre": "PHYSIQUE-CHIMIE — Thème 2 : Électricité",
          "notions": [
            "Circuits électriques en série et en parallèle",
            "Loi d'Ohm : U = R × I",
            "Lois de Kirchhoff (tension et intensité)",
            "Puissance électrique : P = U × I",
            "Énergie électrique : E = P × t (en Wh ou J)",
            "Effets du courant électrique (Joule, magnétique, lumineux)"
          ]
        },
        {
          "titre": "PHYSIQUE-CHIMIE — Thème 3 : Mouvement et énergie",
          "notions": [
            "Vitesse et mouvements (uniforme, accéléré, décéléré)",
            "Forces : représentation vectorielle, unité (Newton)",
            "Principe d'inertie (1ère loi de Newton)",
            "Pression (P = F/S), applications (hydrostatique)",
            "Énergie cinétique, énergie potentielle, conservation de l'énergie",
            "Énergie cinétique : Ec = ½ m v²"
          ]
        },
        {
          "titre": "PHYSIQUE-CHIMIE — Thème 4 : Ondes et signaux",
          "notions": [
            "La lumière : propagation rectiligne, vitesse, sources lumineuses",
            "Réflexion et réfraction de la lumière",
            "Spectre de la lumière blanche (dispersion, couleurs)",
            "Ondes sonores : fréquence (Hz), amplitude, ultrason",
            "Signaux numériques et analogiques",
            "Transmission de l'information (codage binaire, fibres optiques)"
          ]
        },
        {
          "titre": "TECHNOLOGIE — Systèmes techniques et numériques",
          "notions": [
            "Structure d'un système technique : entrée, traitement, sortie",
            "Fonctions techniques : communiquer, acquérir, traiter, mémoriser",
            "Modélisation et simulation de systèmes (outils numériques)",
            "Conception et réalisation : prototypage, fabrication numérique",
            "Systèmes d'information : données, réseaux, protocoles",
            "Programmation : algorithme, variables, boucles, conditions (Python ou Scratch)",
            "Transition numérique et énergétique : enjeux, exemples"
          ]
        }
      ]
    }
  ]
}
```

---

## 9. SCRIPT DE VALIDATION DES LIENS (`scripts/validate_links.py`)

Ce script doit être exécuté en Phase 2 pour vérifier la validité de chaque URL avant insertion dans le JSON final.

```python
#!/usr/bin/env python3
"""
AnnalesDNB — Script de validation des liens
Usage: python3 scripts/validate_links.py
"""

import json, requests, time, sys
from pathlib import Path
from urllib.parse import urlparse

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; AnnalesDNB-Validator/1.0)"
}
TIMEOUT = 10
DELAY_BETWEEN_REQUESTS = 1.5  # Secondes (respecter les serveurs)
MAX_URLS_PER_ANNALE = 3       # Garder les 3 meilleurs liens par épreuve

def check_url(url: str) -> dict:
    """Vérifie une URL via HEAD request. Retourne le statut et le type de contenu."""
    try:
        r = requests.head(url, headers=HEADERS, timeout=TIMEOUT,
                          allow_redirects=True)
        content_type = r.headers.get("Content-Type", "")
        is_pdf = "pdf" in content_type.lower() or url.lower().endswith(".pdf")
        return {
            "url": url,
            "status": r.status_code,
            "ok": r.status_code == 200,
            "is_pdf": is_pdf,
            "content_type": content_type
        }
    except Exception as e:
        return {"url": url, "status": 0, "ok": False, "error": str(e)}

def validate_all(annales_path: Path) -> dict:
    data = json.loads(annales_path.read_text())
    results = {}
    annales = data.get("annales", [])
    total = sum(len(a.get("urls_sujets", [])) + len(a.get("urls_corriges", [])) for a in annales)
    print(f"→ {len(annales)} épreuves à valider, {total} URLs totales")

    for annale in annales:
        aid = annale["id"]
        results[aid] = {"sujets": [], "corriges": []}
        for url in annale.get("urls_sujets", []):
            print(f"  [{aid}] sujet: {url[:60]}...")
            result = check_url(url)
            results[aid]["sujets"].append(result)
            time.sleep(DELAY_BETWEEN_REQUESTS)
        for url in annale.get("urls_corriges", []):
            print(f"  [{aid}] corrigé: {url[:60]}...")
            result = check_url(url)
            results[aid]["corriges"].append(result)
            time.sleep(DELAY_BETWEEN_REQUESTS)

    return results

def update_json_with_results(annales_path: Path, results: dict):
    data = json.loads(annales_path.read_text())
    for annale in data["annales"]:
        aid = annale["id"]
        if aid in results:
            valid_sujets = [r["url"] for r in results[aid]["sujets"] if r["ok"]]
            valid_corriges = [r["url"] for r in results[aid]["corriges"] if r["ok"]]
            annale["urls_sujets"] = valid_sujets[:MAX_URLS_PER_ANNALE]
            annale["urls_corriges"] = valid_corriges[:MAX_URLS_PER_ANNALE]
            annale["corriges_disponibles"] = len(valid_corriges) > 0
            annale["status"] = "valide" if valid_sujets else "manquant"
            if valid_sujets and not valid_corriges:
                annale["status"] = "partiel"
    data["meta"]["derniere_validation"] = __import__("datetime").date.today().isoformat()
    annales_path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"✅ JSON mis à jour : {annales_path}")

if __name__ == "__main__":
    annales_path = Path("data/annales.json")
    if not annales_path.exists():
        print("❌ data/annales.json introuvable"); sys.exit(1)
    results = validate_all(annales_path)
    update_json_with_results(annales_path, results)

    # Rapport final
    all_missing = [aid for aid, r in results.items()
                   if not any(x["ok"] for x in r["sujets"])]
    if all_missing:
        print(f"\n⚠️  Épreuves sans sujet trouvé ({len(all_missing)}) :")
        for aid in all_missing:
            print(f"   • {aid}")
    print("\n✅ Validation terminée.")
```

---

## 10. FONCTIONNALITÉS — SPÉCIFICATIONS DÉTAILLÉES

### 10.1 Catalogue (index.html)

**Filtres (sidebar desktop / drawer mobile) :**
- Matière : Français ☑ | Maths ☑ | HG-EMC ☑ | Sciences (SVT) ☑ | Sciences (PC) ☑
- Année : 2026 ☑ | 2025 ☑ | 2024 ☑ | 2023 ☑ | 2022 ☑ | 2021 ☑ | 2020 ☑
- Corrigé : Tous ● | Avec corrigé ○ | Sans corrigé ○
- Tri : Plus récent d'abord (défaut) | Plus ancien | Alphabétique matière
- Bouton "Réinitialiser" : remet tous les filtres à leur valeur initiale
- Compteur dynamique : "X épreuves affichées sur Y"

**Barre de recherche :**
- Recherche full-text sur : matière, année, session, note éventuelle
- Résultats filtrés en temps réel (debounce 300ms)
- Message "Aucun résultat pour cette recherche" si liste vide

**Cards d'annales :**
- Triées par année décroissante par défaut
- Bordure gauche colorée selon matière
- Badge "Corrigé disponible ✅" ou "Pas de corrigé ⛔"
- Chaque lien de téléchargement : ouvre dans un nouvel onglet
- Maximum 3 liens sujet, 3 liens corrigé par épreuve
- Bouton "🚩 Signaler un lien cassé" → ouvre un modal avec mailto: pré-rempli

**Section alerte réforme :**
- Banner fixe sous le header (peut être fermé avec ✕ en session, réouvre au rechargement)
- Lien vers `programme.html`

### 10.2 Programme 3e 2027 (programme.html)

**Structure :**
- 4 onglets : Français | Mathématiques | Histoire-Géo EMC | Sciences
- Dans chaque onglet : accordéon par chapitre
- Chaque chapitre : titre cliquable → liste des notions s'ouvre/se ferme
- Indicateur visuel "Cette notion peut apparaître au DNB 2027"
- Bandeau info : "Ces annales (2020-2026) couvrent un périmètre programme plus large. Certaines notions présentes dans les anciens sujets ne seront peut-être pas au programme de la session 2027."
- Bouton "Imprimer cette page" (window.print())
- Lien vers le catalogue des annales correspondantes (filtre automatique par matière)

### 10.3 Bouton "Signaler un lien cassé"

**Comportement :**
- Bouton discret (icône 🚩 + texte) sur chaque card
- Clic → modal avec :
  - "Quel lien est cassé ?" (liste des URLs de l'épreuve)
  - Bouton "Envoyer le signalement" → `mailto:annalesdnb@gmail.com?subject=Lien cassé : [ID]&body=...`
  - Alternative : lien vers GitHub Issues si repo public
- Pas de backend nécessaire (mailto: suffit)

---

## 11. FICHIER D'ÉTAT DES CHECKPOINTS (`.dnb-state.json`)

Ce fichier DOIT être créé dès la Phase 1 et mis à jour après chaque checkpoint.

```json
{
  "projet": "annalesdnb",
  "version": "1.0.0",
  "demarre_le": "",
  "derniere_mise_a_jour": "",
  "phase_courante": 1,
  "checkpoint_courant": "CP00",
  "checkpoints_completes": [],
  "checkpoints_disponibles": [
    "CP01", "CP02", "CP03", "CP04", "CP05",
    "CP06", "CP07", "CP08", "CP09", "CP10",
    "CP11", "CP12", "CP13"
  ],
  "erreurs": [],
  "notes": {}
}
```

**Mise à jour après chaque checkpoint :**
```bash
python3 -c "
import json, datetime
s = json.load(open('.dnb-state.json'))
s['checkpoint_courant'] = 'CP0X'
s['checkpoints_completes'].append('CP0X')
s['derniere_mise_a_jour'] = datetime.datetime.now().isoformat()
json.dump(s, open('.dnb-state.json','w'), indent=2)
print('State updated → CP0X')
"
```

---

## 12. PHASES D'EXÉCUTION — CHECKPOINTS DÉTAILLÉS

### PHASE 0 — INTERVIEW ET VÉRIFICATION DE L'ENVIRONNEMENT (CP00)

> **Cette phase est obligatoire et ne peut pas être sautée.**
> Claude Code exécute les vérifications automatiques, puis guide Paul sur chaque point bloquant.
> Paul n'a pas besoin d'être expert Cloudflare ou GitHub.

---

#### ÉTAPE 0.1 — Vérifications automatiques

Exécuter ces commandes et noter les résultats dans un bilan interne :

```bash
# TEST 1 — Token Cloudflare présent dans l'environnement ?
echo "TEST1_TOKEN=$([ -n "$CLOUDFLARE_API_TOKEN" ] && echo PRESENT || echo ABSENT)"

# TEST 2 — gh CLI authentifié et scopes corrects ?
gh auth status 2>&1 | head -5

# TEST 3 — Wrangler reconnaît le bon compte Cloudflare ?
npx wrangler@4.116.0 whoami 2>&1

# TEST 4 — Python requests installé ?
python3 -c "import requests; print('TEST4_REQUESTS=OK')" 2>/dev/null || echo "TEST4_REQUESTS=ABSENT"

# TEST 5 — Repo GitHub annalesdnb existe déjà ?
gh repo view paulvcompaore-cpu/annalesdnb 2>/dev/null && echo "TEST5_REPO=EXISTE" || echo "TEST5_REPO=A_CREER"

# TEST 6 — Projet Cloudflare Pages annalesdnb existe déjà ?
npx wrangler@4.116.0 pages project list 2>/dev/null | grep -i "annalesdnb" && echo "TEST6_PAGES=EXISTE" || echo "TEST6_PAGES=A_CREER"

# TEST 7 — Répertoire /home/pv/Bureau/annalesdnb/ existe déjà ?
ls /home/pv/Bureau/annalesdnb 2>/dev/null && echo "TEST7_DIR=EXISTE" || echo "TEST7_DIR=A_CREER"

# TEST 8 — Version Wrangler correcte ?
npx wrangler@4.116.0 --version 2>&1 | head -1
```

---

#### ÉTAPE 0.2 — Traitement de chaque résultat

Pour chaque test, afficher le résultat et réagir selon le tableau ci-dessous.
Afficher le **BILAN LISIBLE** à la fin (voir gabarit plus bas).

---

**TEST 1 : Token Cloudflare — ABSENT**

Afficher ce message et attendre la réponse de Paul :

```
╔══════════════════════════════════════════════════════════════════╗
║  🔑 ACTION REQUISE — Token Cloudflare non chargé               ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Le token d'accès à ton compte Cloudflare n'est pas disponible  ║
║  dans ce terminal. C'est nécessaire pour déployer le site.      ║
║                                                                  ║
║  Ce que tu dois faire (30 secondes) :                           ║
║                                                                  ║
║  1. Ouvre un NOUVEAU terminal (Ctrl+Alt+T)                       ║
║  2. Tape exactement :  source /home/pv/.bashrc                   ║
║  3. Ferme ce nouveau terminal                                    ║
║  4. Reviens ici et dis-moi : "Token rechargé"                   ║
║                                                                  ║
║  Si tu ne sais pas où est ton token :                           ║
║  → Va sur https://dash.cloudflare.com                           ║
║  → Clique sur ton email (en haut à droite)                      ║
║  → "Mon profil" → "Tokens API" → copie le token existant        ║
║  → Dis-moi : "Voici mon token : [colle-le ici]"                 ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

Quand Paul répond, relancer TEST 1 pour confirmer, puis continuer.

---

**TEST 2 : gh CLI — non authentifié**

```
╔══════════════════════════════════════════════════════════════════╗
║  🐙 ACTION REQUISE — Connexion GitHub à renouveler             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  La connexion GitHub a expiré. Il faut la renouveler.           ║
║                                                                  ║
║  Tape cette commande dans le terminal :                          ║
║                                                                  ║
║     gh auth login                                               ║
║                                                                  ║
║  Suis les instructions :                                         ║
║  → Choisis "GitHub.com"                                          ║
║  → Choisis "HTTPS"                                               ║
║  → Réponds "Y" pour authentification via navigateur             ║
║  → Suis le lien qui s'ouvre dans ton navigateur                 ║
║  → Quand c'est fait, reviens ici et dis : "GitHub reconnecté"   ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

**TEST 3 : Wrangler — mauvais compte ou erreur**

```
╔══════════════════════════════════════════════════════════════════╗
║  ☁️  ACTION REQUISE — Vérification Cloudflare                   ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Wrangler ne reconnaît pas le bon compte Cloudflare.            ║
║  Compte attendu : paulv.compaore@gmail.com                      ║
║                                                                  ║
║  Ce que tu vois actuellement : [AFFICHER LA SORTIE DE whoami]   ║
║                                                                  ║
║  Possible cause : le token dans CLOUDFLARE_API_TOKEN est         ║
║  peut-être périmé ou associé à un autre compte.                 ║
║                                                                  ║
║  Vérifie ton token ici (1 minute) :                             ║
║  1. Va sur https://dash.cloudflare.com                          ║
║  2. Clique ton email → "Mon profil" → "Tokens API"              ║
║  3. Vérifie que le token existe et n'a pas expiré               ║
║  4. Si expiré : clique "Créer un token" → "Modifier Cloudflare  ║
║     Workers" → génère → copie la valeur                         ║
║  5. Dis-moi : "Nouveau token : [valeur]"                        ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

**TEST 4 : Python requests — ABSENT**

```
╔══════════════════════════════════════════════════════════════════╗
║  🐍 ACTION REQUISE — Module Python manquant                     ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Le module "requests" de Python n'est pas installé.             ║
║  Il est nécessaire pour vérifier les liens PDF.                  ║
║                                                                  ║
║  Tape cette commande dans le terminal :                          ║
║                                                                  ║
║     pip3 install requests --break-system-packages               ║
║                                                                  ║
║  Attends que ça se termine (quelques secondes).                  ║
║  Quand tu vois "Successfully installed", dis : "requests OK"    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

**TEST 5 : Repo GitHub — EXISTE déjà**

Vérifier que c'est bien le bon repo (public, branche main, vide ou pas). S'il est non vide, demander :

```
╔══════════════════════════════════════════════════════════════════╗
║  ⚠️  QUESTION — Repo GitHub "annalesdnb" déjà existant         ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Un dépôt "annalesdnb" existe déjà sur ton compte GitHub.       ║
║  Que veux-tu faire ?                                             ║
║                                                                  ║
║  A → Garder ce repo et continuer (je rattacherai le projet)     ║
║  B → Le supprimer et en créer un nouveau propre                 ║
║                                                                  ║
║  Réponds : "A" ou "B"                                           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

**TEST 6 : Projet Cloudflare Pages — EXISTE déjà**

```
╔══════════════════════════════════════════════════════════════════╗
║  ⚠️  QUESTION — Projet Cloudflare Pages déjà existant          ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Un projet "annalesdnb" existe déjà sur Cloudflare Pages.       ║
║  Que veux-tu faire ?                                             ║
║                                                                  ║
║  A → Continuer et déployer dessus (il sera mis à jour)          ║
║  B → Le supprimer et repartir de zéro                           ║
║                                                                  ║
║  Réponds : "A" ou "B"                                           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

**TEST 7 : Répertoire local — EXISTE déjà**

```
╔══════════════════════════════════════════════════════════════════╗
║  ⚠️  QUESTION — Dossier annalesdnb déjà présent sur ton PC     ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Le dossier /home/pv/Bureau/annalesdnb/ existe déjà.            ║
║  Que veux-tu faire ?                                             ║
║                                                                  ║
║  A → Continuer dedans (je travaillerai sur l'existant)          ║
║  B → Le supprimer et recommencer à zéro                         ║
║                                                                  ║
║  ⚠️  Attention : "B" supprimera tout le contenu actuel.         ║
║  Réponds : "A" ou "B"                                           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

**TEST 8 : Version Wrangler — différente de 4.116.0**

```
╔══════════════════════════════════════════════════════════════════╗
║  ⛔ ARRÊT — Version Wrangler incorrecte                         ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Wrangler tourne en version [VERSION DÉTECTÉE].                 ║
║  La version autorisée est UNIQUEMENT 4.116.0.                   ║
║                                                                  ║
║  Je vais utiliser npx wrangler@4.116.0 de façon explicite       ║
║  pour toutes les commandes. Aucune mise à jour ne sera faite.   ║
║  Tu n'as rien à faire — je continue.                            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```
*(Ce cas est informatif, pas bloquant — continue avec `npx wrangler@4.116.0` explicite.)*

---

#### ÉTAPE 0.3 — Question sur l'email de signalement

Après les vérifications automatiques, poser cette question à Paul :

```
╔══════════════════════════════════════════════════════════════════╗
║  📧 QUESTION — Email pour "Signaler un lien cassé"             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Les visiteurs du site pourront signaler les liens PDF cassés.  ║
║  Quel email doit recevoir ces signalements ?                    ║
║                                                                  ║
║  Par défaut je propose : paulv.compaore@gmail.com               ║
║                                                                  ║
║  → Réponds "OK" pour garder cet email                           ║
║  → Ou donne-moi un autre email                                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

#### ÉTAPE 0.4 — Bilan final avant démarrage

Une fois tous les tests verts et toutes les questions répondues, afficher ce bilan :

```
╔══════════════════════════════════════════════════════════════════╗
║            ✅  BILAN DE DÉMARRAGE — AnnalesDNB                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Environnement                                                   ║
║  ─────────────                                                   ║
║  Token Cloudflare       : ✅ PRÉSENT                            ║
║  Compte Cloudflare      : ✅ paulv.compaore@gmail.com           ║
║  gh CLI                 : ✅ paulvcompaore-cpu / HTTPS          ║
║  Python requests        : ✅ INSTALLÉ                           ║
║  Wrangler               : ✅ 4.116.0 (pinné)                    ║
║                                                                  ║
║  Ressources à créer / à utiliser                                 ║
║  ────────────────────────────────                                ║
║  Répertoire local       : [CRÉER / EXISTANT]                    ║
║  Repo GitHub            : [CRÉER / EXISTANT]                    ║
║  Projet Cloudflare Pages: [CRÉER / EXISTANT]                    ║
║                                                                  ║
║  Configuration site                                              ║
║  ──────────────────                                              ║
║  Email signalement      : [EMAIL CONFIRMÉ]                      ║
║  URL finale             : https://annalesdnb.pages.dev          ║
║                                                                  ║
║  Ressources protégées (jamais touchées)                          ║
║  ──────────────────────────────────────                          ║
║  ❌ talenthere-duo (Worker + D1 + R2 + Access + Cron)           ║
║  ❌ jmj2027-family (Cloudflare Pages)                           ║
║  ❌ D1 : talenthug-db, lfrii_jobs_db, nathan-explorer-v9-db     ║
║  ❌ R2 : talenthug-cvs                                          ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Tout est prêt. Je commence la construction du site.             ║
║  Tu n'as rien d'autre à faire pour l'instant.                   ║
║  Je t'avertirai si j'ai besoin de toi.                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Attendre une confirmation de Paul ("OK", "Lance", "Continue" ou similaire) avant de passer à CP01.**

---

### PHASE 1 — Setup et infrastructure

**CP01 — Création du répertoire et git init**
```bash
cd /home/pv/Bureau
mkdir annalesdnb && cd annalesdnb
git init
git branch -m main
echo "node_modules/" > .gitignore
echo ".dnb-state.json" >> .gitignore  # NE PAS versionner l'état
echo "scripts/__pycache__/" >> .gitignore

# Créer le fichier d'état initial
python3 -c "
import json, datetime
state = {
  'projet': 'annalesdnb',
  'version': '1.0.0',
  'demarre_le': datetime.datetime.now().isoformat(),
  'derniere_mise_a_jour': datetime.datetime.now().isoformat(),
  'phase_courante': 1,
  'checkpoint_courant': 'CP01',
  'checkpoints_completes': ['CP01'],
  'erreurs': [],
  'notes': {}
}
json.dump(state, open('.dnb-state.json','w'), indent=2)
print('CP01 ✅')
"
```

**CP02 — Création du repo GitHub et liaison Cloudflare Pages**
```bash
cd /home/pv/Bureau/annalesdnb

# Créer le repo GitHub public
gh repo create annalesdnb --public --source=. --remote=origin

# Créer le wrangler.toml pour Cloudflare Pages
# L'authentification passe par CLOUDFLARE_API_TOKEN (déjà dans l'environnement)
cat > wrangler.toml << 'EOF'
name = "annalesdnb"
pages_build_output_dir = "."
compatibility_date = "2026-08-16"

# Compte Cloudflare : paulv.compaore@gmail.com
# ID : 72526defb4d8a503b6f21c5263e9775a
# Auth : variable CLOUDFLARE_API_TOKEN (déjà configurée)
EOF

# Vérification de sécurité OBLIGATOIRE
echo "=== VÉRIFICATION ISOLATION ==="
pwd        # ATTENDU : /home/pv/Bureau/annalesdnb
cat wrangler.toml | grep "^name"  # ATTENDU : name = "annalesdnb"
echo "=== FIN VÉRIFICATION ==="

# Créer les _headers
cat > _headers << 'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), camera=()
  Cache-Control: public, max-age=3600
EOF

# Créer les _redirects
cat > _redirects << 'EOF'
/annales  /index.html  200
/programme  /programme.html  200
EOF

# Premier commit
git add .
git commit -m "feat: init projet annalesdnb"
git push -u origin main
```

**CP03 — Connexion Cloudflare Pages via Wrangler**
```bash
cd /home/pv/Bureau/annalesdnb

# Vérifier que CLOUDFLARE_API_TOKEN est bien chargée
echo "Token présent : $([ -n \"$CLOUDFLARE_API_TOKEN\" ] && echo OUI || echo NON)"
# ATTENDU : Token présent : OUI

# Créer le projet Cloudflare Pages (lié au repo GitHub)
npx wrangler@4.116.0 pages project create annalesdnb --production-branch=main

# Si erreur d'auth malgré la variable : vérifier avec
# npx wrangler@4.116.0 whoami
# Doit afficher le compte paulv.compaore@gmail.com
```

### PHASE 2 — Génération et validation des données

**CP04 — Création de la structure de données**
```bash
cd /home/pv/Bureau/annalesdnb
mkdir -p data scripts assets/{css,js,img}
mkdir -p assets/fonts

# Copier le JSON annales depuis cette spécification
# (voir Section 7 — le JSON complet)
# Créer data/annales.json avec le contenu de la Section 7

# Copier le JSON programme depuis cette spécification
# (voir Section 8 — le JSON complet)
# Créer data/programme2027.json avec le contenu de la Section 8

# Créer le script de validation
# (voir Section 9 — le script Python complet)
# Créer scripts/validate_links.py

# Installer requests pour Python
pip3 install requests --break-system-packages
```

**CP05 — Scraping et validation des URLs**

Avant d'exécuter la validation, Claude Code doit :
1. Fetcher chaque page source listée dans `sources_reference` du JSON
2. Extraire les liens PDF trouvés pour chaque matière/année correspondante
3. Remplir les champs `urls_sujets` et `urls_corriges` dans le JSON
4. Puis exécuter `validate_links.py`

```bash
cd /home/pv/Bureau/annalesdnb

# Étape 1 : Scraper les URLs depuis les pages sources
# (Claude Code doit écrire scripts/scrape_sources.py pour cela,
#  en fetchant chaque url_base des sources_reference et en extrayant les PDFs)

# Étape 2 : Valider les URLs récupérées
python3 scripts/validate_links.py

# Étape 3 : Vérifier le rapport
python3 -c "
import json
data = json.load(open('data/annales.json'))
manquants = [a['id'] for a in data['annales'] if a['status'] == 'manquant']
partiels = [a['id'] for a in data['annales'] if a['status'] == 'partiel']
valides = [a['id'] for a in data['annales'] if a['status'] == 'valide']
print(f'Valides: {len(valides)} | Partiels: {len(partiels)} | Manquants: {len(manquants)}')
if manquants:
    print('Manquants:', manquants)
"
```

### PHASE 3 — Développement Frontend

**CP06 — HTML structure (index.html)**

Créer `index.html` avec :
- `<head>` : meta viewport, charset UTF-8, meta description, title, lien CSS, preconnect fonts
- Chargement de la police Marianne : `<link rel="stylesheet" href="https://unpkg.com/@codegouvfr/marianne@1.0.3/fonts.css">`
- Fallback Google Fonts : `<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
- Structure HTML sémantique : `<header>`, `<main>`, `<aside>`, `<footer>`
- Banner alerte réforme (dismissible)
- Placeholder pour les cards (générées par JS)
- Section filtres
- Compteur de résultats
- `<script type="module" src="assets/js/catalogue.js">`

**CP07 — CSS complet (assets/css/main.css + catalogue.css + programme.css)**

Implémenter tous les tokens de la Section 6.
CSS mobile-first avec breakpoints :
- Mobile : défaut (< 640px)
- Tablette : `@media (min-width: 640px)`
- Desktop : `@media (min-width: 1024px)`

**CP08 — JS catalogue (assets/js/catalogue.js)**

```javascript
// Structure attendue
const catalogue = {
  data: [],           // JSON chargé depuis data/annales.json
  filtres: {
    matieres: [],     // [] = toutes
    annees: [],
    avecCorrige: null // null = tous, true, false
  },
  tri: 'annee_desc',

  async init() { /* charger JSON, rendre les filtres, afficher */ },
  filtrerEtTrier() { /* appliquer les filtres au dataset */ },
  renderCards(annales) { /* générer le HTML des cards */ },
  bindEvents() { /* attacher les écouteurs */ },
  recherche(query) { /* filtre texte full */ }
}
```

**CP09 — HTML + JS programme (programme.html + assets/js/programme.js)**

Créer `programme.html` avec :
- Onglets par matière (Français / Maths / HG-EMC / Sciences)
- Accordéon par chapitre (animation CSS, pas de JS lourd)
- Bandeau d'avertissement périmètre programme
- Lien "Voir les annales de cette matière →" (renvoie vers index.html avec filtre pré-sélectionné)
- Bouton imprimer

**CP10 — JS signalement (assets/js/signalement.js)**

Modal légère en HTML/CSS/JS vanilla.
Action : `mailto:` avec ID de l'épreuve et URL concernée pré-remplis.

### PHASE 4 — Déploiement et validation

**CP11 — Test local**
```bash
cd /home/pv/Bureau/annalesdnb
# Serveur HTTP simple pour tester
python3 -m http.server 3000 &
# Ouvrir http://localhost:3000 dans le navigateur
# Vérifier : filtres, recherche, responsive, programme.html, liens PDF
```

**CP12 — Déploiement Cloudflare Pages**
```bash
cd /home/pv/Bureau/annalesdnb

# VÉRIFICATION SÉCURITÉ (obligatoire avant tout déploiement)
pwd  # ATTENDU : /home/pv/Bureau/annalesdnb
cat wrangler.toml | grep "^name"  # ATTENDU : name = "annalesdnb"
echo "Token : $([ -n \"$CLOUDFLARE_API_TOKEN\" ] && echo PRÉSENT || echo ABSENT)"

# Commit de tout le code
git add .
git commit -m "feat: site annalesdnb v1.0.0 complet"
git push origin main

# Déploiement direct via Wrangler
npx wrangler@4.116.0 pages deploy . --project-name=annalesdnb --branch=main

# OU laisser Cloudflare Pages déployer automatiquement depuis GitHub
# (si le projet est configuré avec déploiement auto)
```

**CP13 — Validation finale**
```bash
# Vérifier le site en production
curl -I https://annalesdnb.pages.dev
# Doit retourner HTTP 200

# Vérifier les pages
curl -s https://annalesdnb.pages.dev | grep -c "<title>"
curl -s https://annalesdnb.pages.dev/programme.html | grep -c "Programme"

# Vérifier les données JSON accessibles
curl -s https://annalesdnb.pages.dev/data/annales.json | python3 -c "
import json,sys
d = json.load(sys.stdin)
print(f'Total annales: {len(d[\"annales\"])}')
valides = sum(1 for a in d['annales'] if a['status'] == 'valide')
print(f'Validées: {valides}')
"
```

---

## 13. GABARIT — MESSAGES D'INTERVENTION EN COURS D'EXÉCUTION

Pendant les phases 1 à 4, si une commande échoue, utiliser ce gabarit.
Ne jamais supposer, ne jamais continuer en silence sur une erreur bloquante.

**Gabarit standard erreur bloquante :**
```
╔══════════════════════════════════════════════════════════════════╗
║  🛑 PAUSE — [TITRE DU PROBLÈME]                                 ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Où j'en suis : [CP en cours, action tentée]                    ║
║                                                                  ║
║  Ce qui s'est passé : [Description simple de l'erreur]          ║
║                                                                  ║
║  Ce que tu dois faire :                                          ║
║  1. [Étape 1 — action simple et précise]                        ║
║  2. [Étape 2 — si nécessaire]                                   ║
║  3. [Étape 3 — si nécessaire]                                   ║
║                                                                  ║
║  Quand c'est fait : dis-moi "[MOT DE REPRISE]"                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Cas spécifiques fréquents :**

**Déploiement Cloudflare Pages échoue (CP12) :**
```
╔══════════════════════════════════════════════════════════════════╗
║  🛑 PAUSE — Déploiement Cloudflare Pages impossible             ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  La commande wrangler pages deploy a échoué.                    ║
║  Erreur reçue : [COLLER L'ERREUR EXACTE ICI]                    ║
║                                                                  ║
║  Solution alternative (manuel, 2 minutes) :                     ║
║                                                                  ║
║  1. Va sur : https://dash.cloudflare.com                        ║
║  2. Dans le menu de gauche : "Workers & Pages"                  ║
║  3. Clique sur "Create application" → onglet "Pages"            ║
║  4. Clique "Connect to Git" → sélectionne "annalesdnb"          ║
║     (dépôt du compte paulvcompaore-cpu)                         ║
║  5. Production branch : tape "main"                             ║
║  6. Framework preset : "None" (aucun)                           ║
║  7. Clique "Save and Deploy"                                    ║
║  8. Attends le message "Your site is live"                      ║
║  9. Reviens ici et dis : "Cloudflare Pages créé, continue"      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Repo GitHub échoue à être créé (CP02) :**
```
╔══════════════════════════════════════════════════════════════════╗
║  🛑 PAUSE — Création du repo GitHub impossible                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  La commande gh repo create a échoué.                           ║
║  Erreur : [COLLER L'ERREUR ICI]                                 ║
║                                                                  ║
║  Crée le repo manuellement (1 minute) :                         ║
║                                                                  ║
║  1. Va sur : https://github.com/new                             ║
║  2. Repository name : annalesdnb                                ║
║  3. Visibilité : Public                                         ║
║  4. NE PAS cocher "Add a README file"                          ║
║  5. Clique "Create repository"                                  ║
║  6. Reviens ici et dis : "Repo GitHub créé, continue"           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

**Validation de liens — 0 lien trouvé pour une épreuve :**
```
╔══════════════════════════════════════════════════════════════════╗
║  ⚠️  INFO — Liens introuvables pour [ID ÉPREUVE]               ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Aucun lien PDF valide n'a été trouvé pour cette épreuve.       ║
║                                                                  ║
║  Ce que je fais : je marque cette épreuve comme "manquant"      ║
║  dans le JSON. Elle apparaîtra sur le site avec la mention      ║
║  "Sujet non disponible" et aucun lien de téléchargement.        ║
║                                                                  ║
║  Je continue avec les autres épreuves.                          ║
║  Tu n'as rien à faire.                                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 14. COMMANDE DE REPRISE EN CAS DE RUPTURE

Si l'exécution est interrompue, utiliser les commandes suivantes pour reprendre :

```bash
# 1. Vérifier l'état actuel
cd /home/pv/Bureau/annalesdnb
cat .dnb-state.json

# 2. Identifier le dernier checkpoint complété
python3 -c "
import json
s = json.load(open('.dnb-state.json'))
print(f'Dernier CP complété : {s[\"checkpoints_completes\"][-1] if s[\"checkpoints_completes\"] else \"Aucun\"}')
print(f'CP courant : {s[\"checkpoint_courant\"]}')
print(f'Erreurs : {s[\"erreurs\"]}')
"

# 3. Vérifier que CLOUDFLARE_API_TOKEN est toujours dans l'environnement
echo "Token : $([ -n \"$CLOUDFLARE_API_TOKEN\" ] && echo PRÉSENT || echo ABSENT)"
# Si ABSENT : recharger depuis /home/pv/.bashrc
# source /home/pv/.bashrc  (ou relancer le terminal)

# 4. Lancer Claude Code depuis le répertoire du projet
cd /home/pv/Bureau/annalesdnb
claude
```

**Prompt de reprise à utiliser dans Claude Code :**
```
Reprends la construction du site annalesdnb depuis le dernier checkpoint.
Lis le fichier .dnb-state.json pour connaître l'état actuel.
Lis le fichier PROMPT_ORCHESTRATION_DNB.md pour les spécifications complètes.
Reprends à partir du checkpoint indiqué dans checkpoint_courant.
Ne modifie JAMAIS les projets talenthere-duo et jmj2027-family.
Wrangler est pinné à 4.116.0 — ne pas mettre à jour.
```

---

## 14. CHECKLIST DE VALIDATION FINALE

Avant de considérer le projet terminé, vérifier chaque point :

- [ ] `annalesdnb.pages.dev` répond HTTP 200
- [ ] `annalesdnb.pages.dev/programme.html` répond HTTP 200
- [ ] Filtres par matière fonctionnels (Français / Maths / HG-EMC / Sciences)
- [ ] Filtres par année (2020-2026) fonctionnels
- [ ] Filtre "Avec corrigé" fonctionnel
- [ ] Barre de recherche fonctionnelle
- [ ] Compteur de résultats s'actualise en temps réel
- [ ] Cards affichent les bons badges (corrigé disponible / non disponible)
- [ ] Au moins 1 lien par épreuve (sujet) est fonctionnel
- [ ] Bouton "Signaler un lien cassé" ouvre le modal
- [ ] Section Programme 3e 2027 : 4 onglets, accordéons fonctionnels
- [ ] Bandeau alerte réforme visible sur index.html
- [ ] Site responsive : mobile (380px), tablette (768px), desktop (1280px)
- [ ] Police Marianne chargée correctement (ou fallback Plus Jakarta Sans)
- [ ] Aucune console JS error en production
- [ ] `data/annales.json` accessible publiquement
- [ ] `data/programme2027.json` accessible publiquement
- [ ] Score Lighthouse Performance ≥ 80 (viser 90+)
- [ ] Pas de liens vers TalentHere Duo ou JMJ2027 dans le code

---

*Fin du document PROMPT_ORCHESTRATION_DNB.md — v1.0.0*
