# ⚽ PLAYERSTATS - Plateforme d'Analyse Footballistique

Une application web full-stack moderne pour l'analyse et la comparaison de joueurs de football avec des données en temps réel de FBref et Transfermarkt.

## 🚀 Fonctionnalités

### 🔍 Recherche Intelligente
- Recherche de n'importe quel joueur présent sur Transfermarkt/FBref
- Suggestions en temps réel avec autocomplétion
- Base de données locale avec scraping automatique

### 📊 Analyses Avancées
- Statistiques détaillées par saison et compétition
- Cartes de chaleur basées sur les positions
- Rapports de scouting professionnels
- Percentiles de performance par poste

### 🆚 Comparaisons
- Comparaison side-by-side de joueurs
- Métriques per-90 minutes normalisées
- Analyses IA avec OpenAI
- Visualisations interactives

### 🏆 Équipes & Ligues
- Exploration des équipes européennes
- Statistiques des championnats majeurs
- Valeurs de marché et données financières
- Interface moderne avec thème sombre

## 🛠️ Technologies

### Frontend
- **React 18** avec TypeScript
- **Vite** pour le développement rapide
- **TailwindCSS** + shadcn/ui pour l'interface
- **TanStack Query** pour la gestion d'état
- **Wouter** pour le routing

### Backend
- **Express.js** avec TypeScript
- **PostgreSQL** + Drizzle ORM
- **Cheerio** pour le web scraping
- **Axios** pour les requêtes HTTP

### Intégrations
- **FBref** - Statistiques détaillées
- **Transfermarkt** - Valeurs de marché
- **OpenAI** - Analyses intelligentes
- **ScrapNinja** - Contournement anti-bot

## 🏃‍♂️ Installation

```bash
# Cloner le repository
git clone [URL_DE_VOTRE_REPO]
cd playerstats

# Installer les dépendances
npm install

# Configurer la base de données
npm run db:push

# Démarrer l'application
npm run dev
```

## 🔧 Configuration

### Variables d'environnement requises
```bash
DATABASE_URL=your_postgresql_url
OPENAI_API_KEY=your_openai_key
SCRAPNINJA_API_KEY=your_scrapninja_key
```

### Structure du projet
```
├── client/           # Frontend React
│   ├── src/
│   │   ├── components/   # Composants UI
│   │   ├── pages/        # Pages principales
│   │   └── hooks/        # Hooks personnalisés
├── server/           # Backend Express
│   ├── services/     # Services métier
│   └── routes.ts     # API endpoints
├── shared/           # Types partagés
└── database/         # Schémas Drizzle
```

## 📱 Utilisation

1. **Recherche** - Tapez le nom d'un joueur dans la barre de recherche
2. **Profil** - Consultez les statistiques complètes et heatmaps
3. **Comparaison** - Ajoutez des joueurs pour les comparer
4. **Équipes** - Explorez les clubs et leurs effectifs
5. **Ligues** - Découvrez les championnats européens

## 🎯 Fonctionnalités à venir

- [ ] Mode hors ligne avec cache local
- [ ] Notifications push pour les transferts
- [ ] Analyses vidéo intégrées
- [ ] API publique pour développeurs
- [ ] Application mobile React Native

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir `LICENSE` pour plus de détails.

## 🙏 Remerciements

- [FBref](https://fbref.com) pour les données statistiques
- [Transfermarkt](https://transfermarkt.com) pour les valeurs de marché
- [OpenAI](https://openai.com) pour l'intelligence artificielle
- [Replit](https://replit.com) pour l'hébergement

---

Fait avec ❤️ pour la communauté football