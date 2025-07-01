# Guide d'utilisation - Analyse de joueurs CSV

## Deux approches disponibles

### 1. Interface Web React (Recommandée)
- Accédez à `/streamlit-style` dans votre navigateur
- Interface moderne et interactive
- Intégration complète avec le système backend
- Analyse automatique des percentiles
- Visualisations avancées

### 2. Application Streamlit Pure
- Exécutez `streamlit run streamlit_app.py`
- Interface Streamlit classique
- Upload de fichier CSV direct
- Graphiques matplotlib intégrés

## Colonnes requises dans le CSV

Votre fichier `players_data-2024_2025_1751387048911.csv` contient déjà toutes les colonnes nécessaires :

- `Player` : Nom du joueur
- `Squad` : Équipe
- `Pos` : Position
- `Age` : Âge
- `Gls` : Buts
- `Ast` : Passes décisives
- `xG` : Expected Goals
- `xAG` : Expected Assists
- `Tkl` : Tacles
- `Int` : Interceptions
- `PrgP` : Passes progressives
- `Min` : Minutes jouées

## Fonctionnalités disponibles

### Interface React
✅ Sélection de joueur interactive
✅ Statistiques par 90 minutes
✅ Calcul de percentiles par position
✅ Analyse automatique du style de jeu
✅ Identification des forces/faiblesses
✅ Visualisations modernes
✅ Design responsive

### Application Streamlit
✅ Upload de fichier CSV
✅ Sélection de joueur
✅ Statistiques détaillées
✅ Graphiques de performance
✅ Analyse automatique
✅ Export facile

## Comment tester

1. **Via React** : Allez sur `/streamlit-style`
2. **Via Streamlit** : 
   ```bash
   streamlit run streamlit_app.py
   ```
   Puis uploadez le fichier CSV

## Données intégrées

Le système utilise votre fichier CSV de 2800+ joueurs européens (saison 2024/25) avec :
- Statistiques FBref complètes
- Données par 90 minutes
- Métriques xG/xA
- Statistiques défensives
- Données de progression

## Projet de Khalil 🧬

Cette plateforme d'analyse combine les meilleures pratiques de pandas, matplotlib, seaborn et mplsoccer dans une interface moderne et accessible.