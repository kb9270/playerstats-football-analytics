# 🚀 Guide de Déploiement GitHub

## Étapes pour connecter à GitHub

### 1. Créer un nouveau repository sur GitHub
- Allez sur [github.com](https://github.com)
- Cliquez sur "New repository"
- Nommez le `playerstats-football-analytics`
- Laissez-le public ou privé selon vos préférences
- **NE PAS** initialiser avec README, .gitignore ou license

### 2. Connecter le repository local
```bash
git remote add origin https://github.com/VOTRE_USERNAME/playerstats-football-analytics.git
git branch -M main
git push -u origin main
```

### 3. Configuration des secrets pour le déploiement
Dans votre repository GitHub, allez dans Settings > Secrets and variables > Actions et ajoutez :
- `OPENAI_API_KEY` : Votre clé OpenAI
- `SCRAPNINJA_API_KEY` : Votre clé ScrapNinja
- `DATABASE_URL` : URL de votre base de données PostgreSQL

### 4. Déploiement sur Replit
L'application est déjà configurée pour Replit avec :
- Base de données PostgreSQL intégrée
- Variables d'environnement sécurisées
- Hot reload pour le développement

### 5. Alternative : Déploiement sur Vercel/Netlify
Pour déployer sur d'autres plateformes :
```bash
npm run build
npm run start
```

## Structure du projet sauvegardée

✅ **Frontend** : React + TypeScript + TailwindCSS
✅ **Backend** : Express.js + PostgreSQL + Drizzle ORM  
✅ **APIs** : FBref + Transfermarkt + OpenAI integration
✅ **Database** : Schémas complets avec migrations
✅ **UI** : Thème sombre professionnel + shadcn/ui
✅ **Features** : Recherche avancée + Heatmaps + Comparaisons

## Notes importantes
- Le `.gitignore` est configuré pour exclure les secrets
- Le README contient toute la documentation
- L'application est prête pour la production
- Tous les contrastes de police sont corrigés