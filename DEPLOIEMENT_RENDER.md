# 🚀 Guide de Déploiement sur Render

## Prérequis

1. Un compte GitHub avec le projet pushé
2. Un compte Render (https://render.com)

---

## Étape 1: Préparer le Repository GitHub

### 1.1 Créer un repository GitHub

```bash
# Dans le dossier du projet
git init
git add .
git commit -m "Initial commit - Application OCP"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/ocp-database-app.git
git push -u origin main
```

### 1.2 Structure attendue

```
ocp-database-app/
├── backend/
│   ├── api/
│   ├── backend/
│   ├── manage.py
│   ├── requirements-prod.txt
│   └── build.sh
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── render.yaml
```

---

## Étape 2: Déployer sur Render

### Option A: Déploiement automatique avec render.yaml (Recommandé)

1. Allez sur https://dashboard.render.com
2. Cliquez sur **"New"** → **"Blueprint"**
3. Connectez votre repository GitHub
4. Render détectera automatiquement le fichier `render.yaml`
5. Cliquez sur **"Apply"**
6. Attendez que tous les services soient déployés (5-10 minutes)

### Option B: Déploiement manuel

#### Créer la base de données PostgreSQL

1. Dashboard Render → **New** → **PostgreSQL**
2. Nom: `ocp-database`
3. Plan: **Free**
4. Région: **Frankfurt (EU)**
5. Cliquez sur **Create Database**
6. Copiez l'**Internal Database URL**

#### Déployer le Backend

1. Dashboard Render → **New** → **Web Service**
2. Connectez votre repository GitHub
3. Configurez:
   - **Name**: `ocp-backend`
   - **Region**: Frankfurt (EU)
   - **Branch**: main
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: 
     ```
     pip install -r requirements-prod.txt && python manage.py collectstatic --noinput && python manage.py migrate
     ```
   - **Start Command**: 
     ```
     gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
     ```

4. Variables d'environnement:
   | Variable | Valeur |
   |----------|--------|
   | `DEBUG` | `false` |
   | `SECRET_KEY` | (Générer automatiquement) |
   | `DATABASE_URL` | (Coller l'URL de la BDD) |
   | `ALLOWED_HOSTS` | `.onrender.com` |
   | `PYTHON_VERSION` | `3.11.0` |

5. Cliquez sur **Create Web Service**

#### Déployer le Frontend

1. Dashboard Render → **New** → **Static Site**
2. Connectez votre repository GitHub
3. Configurez:
   - **Name**: `ocp-frontend`
   - **Branch**: main
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. Variables d'environnement:
   | Variable | Valeur |
   |----------|--------|
   | `VITE_API_URL` | `https://ocp-backend.onrender.com/api` |

5. Dans **Redirects/Rewrites**, ajoutez:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite

6. Cliquez sur **Create Static Site**

---

## Étape 3: Configuration Post-Déploiement

### 3.1 Créer un utilisateur administrateur

Après le déploiement du backend, ouvrez le **Shell** dans Render:

```bash
python manage.py createsuperuser
```

Ou utilisez la console Python:

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
User.objects.create_superuser('admin', 'admin@ocp.ma', 'votre_mot_de_passe')
```

### 3.2 Mettre à jour CORS

Dans les variables d'environnement du backend, ajoutez:

```
CORS_ALLOWED_ORIGINS=https://ocp-frontend.onrender.com
```

---

## Étape 4: Vérifier le Déploiement

### URLs de l'application

| Service | URL |
|---------|-----|
| Frontend | https://ocp-frontend.onrender.com |
| Backend API | https://ocp-backend.onrender.com/api/ |
| Admin Django | https://ocp-backend.onrender.com/admin/ |

### Tests à effectuer

1. ✅ Accéder au frontend
2. ✅ Se connecter avec les identifiants
3. ✅ Voir la liste des fichiers
4. ✅ Créer un nouveau fichier
5. ✅ Ajouter des données

---

## Dépannage

### Erreur 502 Bad Gateway

- Vérifiez les logs dans le dashboard Render
- Assurez-vous que `gunicorn` est installé
- Vérifiez la variable `PORT`

### Erreur CORS

- Ajoutez l'URL du frontend dans `CORS_ALLOWED_ORIGINS`
- Format: `https://ocp-frontend.onrender.com` (sans slash final)

### Base de données non connectée

- Vérifiez que `DATABASE_URL` est correctement configuré
- La BDD doit être en statut "Available"

### Static files non trouvés

- Vérifiez que `whitenoise` est installé
- Exécutez `python manage.py collectstatic`

---

## Coûts

| Service | Plan Free | Limitations |
|---------|-----------|-------------|
| Web Service | Gratuit | Sleep après 15min d'inactivité |
| Static Site | Gratuit | 100 GB/mois de bande passante |
| PostgreSQL | Gratuit | 1 GB, expire après 90 jours |

### Pour une utilisation en production

Considérez les plans payants:
- **Starter** ($7/mois): Pas de sleep, meilleure performance
- **PostgreSQL Standard** ($7/mois): Pas d'expiration

---

## Support

Pour toute question, consultez:
- Documentation Render: https://render.com/docs
- Django Deployment: https://docs.djangoproject.com/en/5.0/howto/deployment/

---

*Guide créé pour l'application OCP - Port de Jorf Lasfar*

