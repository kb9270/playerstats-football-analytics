#!/usr/bin/env python3
"""
Enhanced Player Analyzer - Système d'analyse complète de joueurs de football
Traite le fichier CSV de 2800+ joueurs européens pour générer des fiches complètes
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.patches import Rectangle
import matplotlib.patches as mpatches
import json
import sys
import os
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Configuration matplotlib pour les graphiques
plt.style.use('default')
sns.set_palette("husl")

class EnhancedPlayerAnalyzer:
    def __init__(self, csv_path=None):
        """Initialise l'analyseur avec le fichier CSV des joueurs"""  
        self.csv_path = csv_path or "players_data-2024_2025_1751387048911.csv"
        self.df = None
        self.current_player = None
        self.load_data()
    
    def load_data(self):
        """Charge et nettoie les données du CSV"""
        try:
            if os.path.exists(self.csv_path):
                self.df = pd.read_csv(self.csv_path)
                print(f"✓ Données chargées: {len(self.df)} joueurs")
            else:
                print(f"⚠ Fichier CSV non trouvé: {self.csv_path}")
                self.df = pd.DataFrame()
        except Exception as e:
            print(f"❌ Erreur lors du chargement: {e}")
            self.df = pd.DataFrame()
    
    def search_player(self, player_name, team=None):
        """Recherche un joueur par nom et équipe optionnelle"""
        if self.df.empty:
            return None
        
        # Recherche flexible par nom
        mask = self.df['Player'].str.contains(player_name, case=False, na=False)
        
        if team:
            mask &= self.df['Squad'].str.contains(team, case=False, na=False)
        
        results = self.df[mask]
        
        if len(results) == 0:
            return None
        elif len(results) == 1:
            return results.iloc[0].to_dict()
        else:
            # Retourne le premier résultat si plusieurs matches
            return results.iloc[0].to_dict()
    
    def get_player_complete_profile(self, player_name, team=None):
        """Génère le profil complet d'un joueur"""
        player_data = self.search_player(player_name, team)
        if not player_data:
            return {"error": f"Joueur '{player_name}' non trouvé"}
        
        self.current_player = player_data
        
        # Informations personnelles
        personal_info = {
            "nom": player_data['Player'],
            "age": int(player_data['Age']) if pd.notna(player_data['Age']) else None,
            "nationalite": player_data['Nation'],
            "position": player_data['Pos'],
            "equipe": player_data['Squad'],
            "championnat": player_data['Comp'],
            "annee_naissance": int(player_data['Born']) if pd.notna(player_data['Born']) else None
        }
        
        # Statistiques de base
        stats_base = {
            "matchs_joues": int(player_data['MP']) if pd.notna(player_data['MP']) else 0,
            "titularisations": int(player_data['Starts']) if pd.notna(player_data['Starts']) else 0,
            "minutes": int(player_data['Min']) if pd.notna(player_data['Min']) else 0,
            "buts": int(player_data['Gls']) if pd.notna(player_data['Gls']) else 0,
            "passes_d": int(player_data['Ast']) if pd.notna(player_data['Ast']) else 0,
            "cartons_jaunes": int(player_data['CrdY']) if pd.notna(player_data['CrdY']) else 0,
            "cartons_rouges": int(player_data['CrdR']) if pd.notna(player_data['CrdR']) else 0
        }
        
        # Statistiques avancées
        stats_avancees = {
            "xG": float(player_data['xG']) if pd.notna(player_data['xG']) else 0.0,
            "xA": float(player_data['xAG']) if pd.notna(player_data['xAG']) else 0.0,
            "npxG": float(player_data['npxG']) if pd.notna(player_data['npxG']) else 0.0,
            "passes_progressives": int(player_data['PrgP']) if pd.notna(player_data['PrgP']) else 0,
            "courses_progressives": int(player_data['PrgC']) if pd.notna(player_data['PrgC']) else 0,
            "receptions_progressives": int(player_data['PrgR']) if pd.notna(player_data['PrgR']) else 0
        }
        
        # Analyse des performances
        performance_analysis = self.analyze_performance(player_data)
        
        # Comparaison percentile
        percentiles = self.calculate_percentiles(player_data)
        
        # Zones d'activité simulées
        activity_zones = self.generate_activity_zones(player_data)
        
        return {
            "informations_personnelles": personal_info,
            "statistiques_base": stats_base,
            "statistiques_avancees": stats_avancees,
            "analyse_performance": performance_analysis,
            "percentiles": percentiles,
            "zones_activite": activity_zones,
            "note_globale": self.calculate_overall_rating(percentiles),
            "style_jeu": self.determine_playing_style(player_data),
            "forces": self.identify_strengths(percentiles),
            "faiblesses": self.identify_weaknesses(percentiles)
        }
    
    def analyze_performance(self, player_data):
        """Analyse détaillée des performances"""
        minutes = float(player_data['Min']) if pd.notna(player_data['Min']) else 0
        if minutes == 0:
            return {"message": "Pas assez de temps de jeu pour analyser"}
        
        # Calculs par 90 minutes
        per_90_stats = {}
        if minutes > 0:
            factor = 90 / minutes
            per_90_stats = {
                "buts_par_90": round(float(player_data['Gls'] or 0) * factor, 2),
                "passes_d_par_90": round(float(player_data['Ast'] or 0) * factor, 2),
                "xG_par_90": round(float(player_data['xG'] or 0) * factor, 2),
                "xA_par_90": round(float(player_data['xAG'] or 0) * factor, 2)
            }
        
        return {
            "efficacite_offensive": self.calculate_offensive_efficiency(player_data),
            "contribution_defensive": self.calculate_defensive_contribution(player_data),
            "stats_par_90": per_90_stats,
            "regularite": self.calculate_consistency(player_data)
        }
    
    def calculate_percentiles(self, player_data):
        """Calcule les percentiles par rapport aux joueurs du même poste"""
        if self.df.empty:
            return {}
        
        position = player_data['Pos']
        same_position = self.df[self.df['Pos'] == position]
        
        if len(same_position) < 5:
            same_position = self.df  # Utilise tous les joueurs si pas assez du même poste
        
        percentiles = {}
        stats_to_compare = ['Gls', 'Ast', 'xG', 'xAG', 'PrgP', 'PrgC', 'PrgR']
        
        for stat in stats_to_compare:
            if stat in player_data and pd.notna(player_data[stat]):
                value = float(player_data[stat])
                percentile = (same_position[stat].fillna(0) < value).mean() * 100
                percentiles[stat] = round(percentile, 1)
        
        return percentiles
    
    def generate_activity_zones(self, player_data):
        """Génère les zones d'activité basées sur la position"""
        position = player_data['Pos']
        
        # Zones simplifiées basées sur la position
        zones = {
            "defense": 20,
            "milieu_defensif": 15,
            "milieu_central": 30,
            "milieu_offensif": 25,
            "attaque": 10
        }
        
        # Ajustement selon la position
        if 'DF' in position:
            zones = {"defense": 50, "milieu_defensif": 30, "milieu_central": 15, "milieu_offensif": 5, "attaque": 0}
        elif 'MF' in position:
            zones = {"defense": 15, "milieu_defensif": 25, "milieu_central": 35, "milieu_offensif": 20, "attaque": 5}
        elif 'FW' in position:
            zones = {"defense": 5, "milieu_defensif": 10, "milieu_central": 20, "milieu_offensif": 35, "attaque": 30}
        
        return zones
    
    def calculate_overall_rating(self, percentiles):
        """Calcule une note globale sur 100"""
        if not percentiles:
            return 50
        
        avg_percentile = sum(percentiles.values()) / len(percentiles)
        return round(avg_percentile, 1)
    
    def determine_playing_style(self, player_data):
        """Détermine le style de jeu du joueur"""
        position = player_data['Pos']
        
        styles = {
            "DF": "Défenseur solide",
            "MF": "Milieu polyvalent", 
            "FW": "Attaquant efficace"
        }
        
        # Style plus spécifique basé sur les stats
        if 'FW' in position:
            goals = float(player_data['Gls'] or 0)
            assists = float(player_data['Ast'] or 0)
            if goals > assists * 2:
                return "Finisseur"
            elif assists > goals:
                return "Créateur"
            else:
                return "Attaquant complet"
        
        return styles.get(position[:2], "Joueur polyvalent")
    
    def identify_strengths(self, percentiles):
        """Identifie les forces du joueur"""
        if not percentiles:
            return ["Données insuffisantes"]
        
        strengths = []
        for stat, percentile in percentiles.items():
            if percentile >= 80:
                stat_names = {
                    'Gls': 'Finition',
                    'Ast': 'Passes décisives',
                    'xG': 'Occasions créées',
                    'xAG': 'Création offensive',
                    'PrgP': 'Passes progressives',
                    'PrgC': 'Courses vers l\'avant',
                    'PrgR': 'Réceptions avancées'
                }
                strengths.append(stat_names.get(stat, stat))
        
        return strengths if strengths else ["Profil équilibré"]
    
    def identify_weaknesses(self, percentiles):
        """Identifie les faiblesses du joueur"""
        if not percentiles:
            return ["Données insuffisantes"]
        
        weaknesses = []
        for stat, percentile in percentiles.items():
            if percentile <= 20:
                stat_names = {
                    'Gls': 'Finition',
                    'Ast': 'Passes décisives', 
                    'xG': 'Occasions créées',
                    'xAG': 'Création offensive',
                    'PrgP': 'Passes progressives',
                    'PrgC': 'Courses vers l\'avant',
                    'PrgR': 'Réceptions avancées'
                }
                weaknesses.append(stat_names.get(stat, stat))
        
        return weaknesses if weaknesses else ["Pas de faiblesse majeure"]
    
    def calculate_offensive_efficiency(self, player_data):
        """Calcule l'efficacité offensive"""
        goals = float(player_data['Gls'] or 0)
        xG = float(player_data['xG'] or 0)
        
        if xG > 0:
            efficiency = (goals / xG) * 100
            return round(efficiency, 1)
        return 0
    
    def calculate_defensive_contribution(self, player_data):
        """Évalue la contribution défensive"""
        # Simulation basée sur la position
        position = player_data['Pos']
        if 'DF' in position:
            return 85
        elif 'MF' in position:
            return 60
        else:
            return 30
    
    def calculate_consistency(self, player_data):
        """Évalue la régularité du joueur"""
        matches = int(player_data['MP'] or 0)
        starts = int(player_data['Starts'] or 0)
        
        if matches > 0:
            consistency = (starts / matches) * 100
            return round(consistency, 1)
        return 0
    
    def generate_heatmap_data(self, player_data):
        """Génère des données de heatmap réalistes"""
        position = player_data['Pos']
        
        # Grille 10x10 représentant le terrain
        heatmap = np.zeros((10, 10))
        
        # Remplissage basé sur la position
        if 'DF' in position:
            # Défenseurs : activité en zone défensive
            heatmap[7:10, 3:7] = np.random.uniform(0.7, 1.0, (3, 4))
            heatmap[5:7, 4:6] = np.random.uniform(0.3, 0.6, (2, 2))
        elif 'MF' in position:
            # Milieux : activité au centre
            heatmap[4:8, 3:7] = np.random.uniform(0.6, 1.0, (4, 4))
            heatmap[2:4, 4:6] = np.random.uniform(0.3, 0.5, (2, 2))
            heatmap[8:10, 4:6] = np.random.uniform(0.3, 0.5, (2, 2))
        elif 'FW' in position:
            # Attaquants : activité offensive
            heatmap[0:4, 3:7] = np.random.uniform(0.7, 1.0, (4, 4))
            heatmap[4:6, 4:6] = np.random.uniform(0.4, 0.6, (2, 2))
        
        return heatmap.tolist()

def main():
    """Point d'entrée principal"""
    if len(sys.argv) < 2:
        print("Usage: python enhanced_player_analyzer.py <action> [params...]")
        sys.exit(1)
    
    action = sys.argv[1]
    analyzer = EnhancedPlayerAnalyzer()
    
    if action == "search_player":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Nom du joueur requis"}))
            sys.exit(1)
        
        player_name = sys.argv[2]
        team = sys.argv[3] if len(sys.argv) > 3 else None
        
        result = analyzer.search_player(player_name, team)
        if result:
            print(json.dumps({"found": True, "player": result}))
        else:
            print(json.dumps({"found": False, "message": f"Joueur '{player_name}' non trouvé"}))
    
    elif action == "get_complete_profile":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Nom du joueur requis"}))
            sys.exit(1)
        
        player_name = sys.argv[2]
        team = sys.argv[3] if len(sys.argv) > 3 else None
        
        profile = analyzer.get_player_complete_profile(player_name, team)
        print(json.dumps(profile, ensure_ascii=False, indent=2))
    
    elif action == "generate_heatmap":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Nom du joueur requis"}))
            sys.exit(1)
        
        player_name = sys.argv[2]
        player_data = analyzer.search_player(player_name)
        
        if player_data:
            heatmap_data = analyzer.generate_heatmap_data(player_data)
            print(json.dumps({"heatmap": heatmap_data}))
        else:
            print(json.dumps({"error": "Joueur non trouvé"}))
    
    else:
        print(json.dumps({"error": f"Action '{action}' non reconnue"}))

if __name__ == "__main__":
    main()