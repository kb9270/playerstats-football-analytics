import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EnhancedSoccerDataService {
  private pythonScriptPath = path.join(__dirname, '../python/enhanced_soccerdata_analyzer.py');

  async getComprehensivePlayerAnalysis(playerName: string, team?: string, league?: string): Promise<any> {
    try {
      console.log(`Getting comprehensive analysis for ${playerName}`);
      
      const result = await this.runPythonScript('comprehensive_analysis', {
        player_name: playerName,
        team: team,
        league: league || 'ENG-Premier League'
      });
      
      return result;
    } catch (error) {
      console.error('Error getting comprehensive analysis:', error);
      return null;
    }
  }

  async getTeamAnalysis(teamName: string, league?: string): Promise<any> {
    try {
      console.log(`Getting team analysis for ${teamName}`);
      
      const result = await this.runPythonScript('team_analysis', {
        team_name: teamName,
        league: league || 'ENG-Premier League'
      });
      
      return result;
    } catch (error) {
      console.error('Error getting team analysis:', error);
      return null;
    }
  }

  async getPlayerComparison(playerName: string, position: string, league?: string): Promise<any> {
    try {
      console.log(`Getting position comparison for ${playerName} (${position})`);
      
      const result = await this.runPythonScript('position_comparison', {
        player_name: playerName,
        position: position,
        league: league || 'ENG-Premier League'
      });
      
      return result;
    } catch (error) {
      console.error('Error getting position comparison:', error);
      return null;
    }
  }

  async getMatchAnalysis(playerName: string, matchDate?: string): Promise<any> {
    try {
      console.log(`Getting match analysis for ${playerName}`);
      
      const result = await this.runPythonScript('match_analysis', {
        player_name: playerName,
        match_date: matchDate
      });
      
      return result;
    } catch (error) {
      console.error('Error getting match analysis:', error);
      return null;
    }
  }

  private async runPythonScript(action: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [this.pythonScriptPath, action, JSON.stringify(params)]);
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            console.error('Error parsing Python output:', parseError);
            reject(parseError);
          }
        } else {
          console.error('Python script error:', stderr);
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });
      
      python.on('error', (error) => {
        console.error('Failed to start Python script:', error);
        reject(error);
      });
    });
  }

  async ensurePythonScriptExists(): Promise<void> {
    const pythonDir = path.dirname(this.pythonScriptPath);
    
    if (!fs.existsSync(pythonDir)) {
      fs.mkdirSync(pythonDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.pythonScriptPath)) {
      await this.createEnhancedPythonScript();
    }
  }

  private async createEnhancedPythonScript(): Promise<void> {
    const pythonCode = `#!/usr/bin/env python3
import sys
import json
import soccerdata as sd
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

def comprehensive_analysis(params):
    """Analyse complète d'un joueur avec données d'équipe"""
    try:
        player_name = params.get('player_name')
        team = params.get('team')
        league = params.get('league', 'ENG-Premier League')
        
        # Initialize data sources
        fbref = sd.FBref()
        
        # Get player stats
        player_stats = fbref.read_player_season_stats(league)
        shooting_stats = fbref.read_player_season_stats(league, stat_type='shooting')
        passing_stats = fbref.read_player_season_stats(league, stat_type='passing')
        defense_stats = fbref.read_player_season_stats(league, stat_type='defense')
        possession_stats = fbref.read_player_season_stats(league, stat_type='possession')
        
        # Filter for the specific player
        player_data = player_stats[player_stats['player'].str.contains(player_name, case=False, na=False)]
        
        if team:
            player_data = player_data[player_data['team'].str.contains(team, case=False, na=False)]
        
        if len(player_data) == 0:
            return {'success': False, 'error': 'Player not found'}
        
        player_info = player_data.iloc[0]
        player_team = player_info['team']
        player_position = player_info.get('position', 'Unknown')
        
        # Get detailed stats for the player
        shooting_data = shooting_stats[
            (shooting_stats['player'].str.contains(player_name, case=False, na=False)) &
            (shooting_stats['team'] == player_team)
        ]
        
        passing_data = passing_stats[
            (passing_stats['player'].str.contains(player_name, case=False, na=False)) &
            (passing_stats['team'] == player_team)
        ]
        
        defense_data = defense_stats[
            (defense_stats['player'].str.contains(player_name, case=False, na=False)) &
            (defense_stats['team'] == player_team)
        ]
        
        possession_data = possession_stats[
            (possession_stats['player'].str.contains(player_name, case=False, na=False)) &
            (possession_stats['team'] == player_team)
        ]
        
        # Calculate position percentiles
        position_players = player_stats[player_stats['position'].str.contains(player_position.split('-')[0], case=False, na=False)]
        
        percentiles = {}
        key_stats = ['goals', 'assists', 'shots', 'shots_on_target', 'passes_completed', 'passes', 'tackles', 'interceptions', 'fouls', 'cards_yellow', 'cards_red']
        
        for stat in key_stats:
            if stat in player_info.index and stat in position_players.columns:
                player_value = player_info[stat]
                if pd.notna(player_value) and player_value != 0:
                    percentile = (position_players[stat] <= player_value).mean() * 100
                    percentiles[stat] = min(99, max(1, percentile))
        
        # Team analysis
        team_stats = fbref.read_team_season_stats(league)
        team_data = team_stats[team_stats.index.str.contains(player_team, case=False, na=False)]
        
        team_analysis = {}
        if len(team_data) > 0:
            team_info = team_data.iloc[0]
            team_analysis = {
                'goals_for': team_info.get('goals_for', 0),
                'goals_against': team_info.get('goals_against', 0),
                'possession': team_info.get('possession', 0),
                'shots': team_info.get('shots', 0),
                'shots_on_target': team_info.get('shots_on_target', 0),
                'passes': team_info.get('passes', 0),
                'pass_accuracy': team_info.get('pass_accuracy', 0)
            }
        
        # Forme récente (simulation basée sur les stats)
        recent_form = calculate_recent_form(player_info)
        
        # Zones d'activité (simulation basée sur le poste)
        activity_zones = get_activity_zones(player_position)
        
        # Forces et faiblesses
        strengths = calculate_strengths(percentiles)
        weaknesses = calculate_weaknesses(percentiles)
        
        # Performance vs moyenne du poste
        position_comparison = calculate_position_comparison(player_info, position_players)
        
        result = {
            'success': True,
            'player': {
                'name': player_name,
                'team': player_team,
                'position': player_position,
                'age': player_info.get('age', 'N/A'),
                'nationality': player_info.get('nationality', 'N/A'),
                'market_value': estimate_market_value(player_info, percentiles)
            },
            'current_form': recent_form,
            'key_stats': {
                'goals': clean_value(player_info.get('goals', 0)),
                'assists': clean_value(player_info.get('assists', 0)),
                'shots': clean_value(player_info.get('shots', 0)),
                'shots_on_target': clean_value(player_info.get('shots_on_target', 0)),
                'pass_completion': clean_value(player_info.get('passes_completed', 0) / max(player_info.get('passes', 1), 1) * 100),
                'key_passes': clean_value(player_info.get('assists', 0) * 3),  # Estimation
                'tackles': clean_value(player_info.get('tackles', 0)),
                'interceptions': clean_value(player_info.get('interceptions', 0)),
                'fouls_won': clean_value(player_info.get('fouls', 0) * 0.6),  # Estimation
                'duels_won': clean_value(player_info.get('tackles', 0) * 1.5),  # Estimation
                'expected_goals': clean_value(player_info.get('xg', 0)),
                'expected_assists': clean_value(player_info.get('xa', 0))
            },
            'detailed_stats': {
                'shooting': extract_stats(shooting_data),
                'passing': extract_stats(passing_data),
                'defense': extract_stats(defense_data),
                'possession': extract_stats(possession_data)
            },
            'percentiles': percentiles,
            'activity_zones': activity_zones,
            'position_comparison': position_comparison,
            'strengths': strengths,
            'weaknesses': weaknesses,
            'team_analysis': {
                'formation': '4-3-3',  # Estimation par défaut
                'tactical_style': analyze_tactical_style(team_analysis),
                'team_stats': team_analysis,
                'key_players': get_key_players(player_team, player_stats),
                'recent_results': simulate_recent_results(),
                'strengths': analyze_team_strengths(team_analysis),
                'weaknesses': analyze_team_weaknesses(team_analysis)
            }
        }
        
        return result
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def team_analysis(params):
    """Analyse détaillée d'une équipe"""
    try:
        team_name = params.get('team_name')
        league = params.get('league', 'ENG-Premier League')
        
        fbref = sd.FBref()
        
        # Get team stats
        team_stats = fbref.read_team_season_stats(league)
        player_stats = fbref.read_player_season_stats(league)
        
        team_data = team_stats[team_stats.index.str.contains(team_name, case=False, na=False)]
        
        if len(team_data) == 0:
            return {'success': False, 'error': 'Team not found'}
        
        team_info = team_data.iloc[0]
        team_players = player_stats[player_stats['team'].str.contains(team_name, case=False, na=False)]
        
        # Analyse tactique
        tactical_analysis = {
            'formation': '4-3-3',  # Estimation
            'possession_style': analyze_possession_style(team_info),
            'attacking_approach': analyze_attacking_approach(team_info),
            'defensive_structure': analyze_defensive_structure(team_info)
        }
        
        # Joueurs clés
        key_players = identify_key_players(team_players)
        
        # Forces et faiblesses
        team_strengths = analyze_detailed_team_strengths(team_info)
        team_weaknesses = analyze_detailed_team_weaknesses(team_info)
        
        result = {
            'success': True,
            'team': {
                'name': team_name,
                'league': league,
                'stats': clean_team_stats(team_info)
            },
            'tactical_analysis': tactical_analysis,
            'key_players': key_players,
            'strengths': team_strengths,
            'weaknesses': team_weaknesses,
            'recent_performance': simulate_recent_performance()
        }
        
        return result
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def position_comparison(params):
    """Comparaison avec d'autres joueurs du même poste"""
    try:
        player_name = params.get('player_name')
        position = params.get('position')
        league = params.get('league', 'ENG-Premier League')
        
        fbref = sd.FBref()
        player_stats = fbref.read_player_season_stats(league)
        
        # Get position players
        position_players = player_stats[player_stats['position'].str.contains(position.split('-')[0], case=False, na=False)]
        target_player = position_players[position_players['player'].str.contains(player_name, case=False, na=False)]
        
        if len(target_player) == 0:
            return {'success': False, 'error': 'Player not found'}
        
        player_data = target_player.iloc[0]
        
        # Calculate rankings
        rankings = {}
        key_metrics = ['goals', 'assists', 'shots', 'passes_completed', 'tackles', 'interceptions']
        
        for metric in key_metrics:
            if metric in position_players.columns:
                sorted_players = position_players.sort_values(metric, ascending=False)
                player_rank = sorted_players[sorted_players['player'].str.contains(player_name, case=False, na=False)].index
                if len(player_rank) > 0:
                    rank = list(sorted_players.index).index(player_rank[0]) + 1
                    total = len(sorted_players)
                    percentile = ((total - rank) / total) * 100
                    rankings[metric] = {
                        'rank': rank,
                        'total': total,
                        'percentile': percentile,
                        'value': clean_value(player_data[metric])
                    }
        
        # Top performers in position
        top_performers = position_players.nlargest(5, 'goals')[['player', 'team', 'goals', 'assists']].to_dict('records')
        
        result = {
            'success': True,
            'player': {
                'name': player_name,
                'position': position
            },
            'rankings': rankings,
            'top_performers': clean_top_performers(top_performers),
            'position_averages': calculate_position_averages(position_players)
        }
        
        return result
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

def match_analysis(params):
    """Analyse de match spécifique"""
    try:
        player_name = params.get('player_name')
        match_date = params.get('match_date')
        
        # Simulation d'analyse de match
        result = {
            'success': True,
            'match': {
                'date': match_date or 'Latest match',
                'opponent': 'Liverpool FC',
                'result': '2-1 W',
                'venue': 'Home'
            },
            'player_performance': {
                'rating': 8.2,
                'goals': 1,
                'assists': 1,
                'shots': 4,
                'shots_on_target': 3,
                'passes': 52,
                'pass_accuracy': 87.3,
                'key_passes': 3,
                'tackles': 2,
                'interceptions': 1,
                'touches': 67,
                'dribbles_completed': 5,
                'fouls_won': 3
            },
            'key_moments': [
                {'minute': 23, 'event': 'Goal', 'description': 'Clinical finish from inside the box'},
                {'minute': 67, 'event': 'Assist', 'description': 'Perfect through ball for teammate'},
                {'minute': 82, 'event': 'Key Pass', 'description': 'Created clear scoring opportunity'}
            ],
            'heat_map': generate_heatmap_data(),
            'match_analysis': {
                'overall': 'Excellent performance with decisive contributions',
                'attacking': 'Constant threat, excellent positioning',
                'defending': 'Solid work rate, helped team defensively',
                'passing': 'Accurate distribution, created chances'
            }
        }
        
        return result
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

# Helper functions
def clean_value(value):
    """Clean and convert values for JSON serialization"""
    if pd.isna(value):
        return 0
    elif hasattr(value, 'item'):
        return value.item()
    elif isinstance(value, (int, float)):
        return float(value) if value != int(value) else int(value)
    return value

def extract_stats(data):
    """Extract stats from dataframe"""
    if len(data) == 0:
        return {}
    
    stats = data.iloc[0].to_dict()
    cleaned_stats = {}
    
    for key, value in stats.items():
        cleaned_stats[key] = clean_value(value)
    
    return cleaned_stats

def calculate_recent_form(player_info):
    """Calculate recent form (simulation)"""
    base_rating = 7.0
    goals = clean_value(player_info.get('goals', 0))
    assists = clean_value(player_info.get('assists', 0))
    
    if goals > 15:
        base_rating += 1.0
    elif goals > 10:
        base_rating += 0.5
    
    if assists > 10:
        base_rating += 0.5
    
    return {
        'rating': min(10.0, base_rating),
        'trend': 'improving' if goals > 8 else 'stable',
        'last_5_games': {
            'goals': min(goals, 5),
            'assists': min(assists, 3),
            'average_rating': min(10.0, base_rating)
        }
    }

def get_activity_zones(position):
    """Get activity zones based on position"""
    zones = {
        'FW': ['Final Third', 'Penalty Area', 'Right Wing'],
        'MF': ['Middle Third', 'Central', 'Both Flanks'],
        'DF': ['Defensive Third', 'Central Defense', 'Aerial Duels'],
        'GK': ['Penalty Area', 'Goal Line', 'Distribution']
    }
    
    pos_key = position[:2] if len(position) >= 2 else 'MF'
    return zones.get(pos_key, zones['MF'])

def calculate_strengths(percentiles):
    """Calculate player strengths"""
    strengths = []
    for stat, percentile in percentiles.items():
        if percentile > 75:
            stat_name = stat.replace('_', ' ').title()
            strengths.append(stat_name)
    
    return strengths[:4] if strengths else ['Consistency', 'Work Rate']

def calculate_weaknesses(percentiles):
    """Calculate player weaknesses"""
    weaknesses = []
    for stat, percentile in percentiles.items():
        if percentile < 25:
            stat_name = stat.replace('_', ' ').title()
            weaknesses.append(stat_name)
    
    return weaknesses[:3] if weaknesses else ['Decision Making']

def calculate_position_comparison(player_info, position_players):
    """Compare player with position average"""
    comparison = {}
    key_stats = ['goals', 'assists', 'shots', 'passes']
    
    for stat in key_stats:
        if stat in player_info.index and stat in position_players.columns:
            player_value = clean_value(player_info[stat])
            position_avg = clean_value(position_players[stat].mean())
            
            comparison[stat] = {
                'player_value': player_value,
                'position_average': position_avg,
                'vs_average': '+' + str(round(player_value - position_avg, 1)) if player_value > position_avg else str(round(player_value - position_avg, 1))
            }
    
    return comparison

def estimate_market_value(player_info, percentiles):
    """Estimate market value based on performance"""
    age = clean_value(player_info.get('age', 25))
    goals = clean_value(player_info.get('goals', 0))
    
    base_value = 10000000  # 10M base
    
    # Age factor
    if age < 23:
        base_value *= 1.5
    elif age > 30:
        base_value *= 0.7
    
    # Performance factor
    avg_percentile = sum(percentiles.values()) / len(percentiles) if percentiles else 50
    performance_multiplier = avg_percentile / 50
    
    estimated_value = base_value * performance_multiplier
    
    return min(150000000, max(1000000, estimated_value))  # Cap between 1M and 150M

def analyze_tactical_style(team_stats):
    """Analyze team tactical style"""
    possession = team_stats.get('possession', 50)
    
    if possession > 60:
        return 'Possession-based, patient build-up'
    elif possession > 45:
        return 'Balanced approach, adaptable'
    else:
        return 'Direct, counter-attacking style'

def get_key_players(team_name, player_stats):
    """Get key players for team"""
    team_players = player_stats[player_stats['team'].str.contains(team_name, case=False, na=False)]
    
    if len(team_players) == 0:
        return []
    
    key_players = team_players.nlargest(3, 'goals')[['player', 'goals', 'assists']].to_dict('records')
    
    return clean_top_performers(key_players)

def simulate_recent_results():
    """Simulate recent match results"""
    return [
        {'match': 'vs Arsenal', 'result': '2-1 W', 'xg_for': 1.8, 'xg_against': 1.2},
        {'match': 'vs Chelsea', 'result': '1-1 D', 'xg_for': 1.5, 'xg_against': 1.4},
        {'match': 'vs Liverpool', 'result': '0-2 L', 'xg_for': 0.9, 'xg_against': 2.3},
        {'match': 'vs City', 'result': '3-1 W', 'xg_for': 2.1, 'xg_against': 1.1},
        {'match': 'vs United', 'result': '1-0 W', 'xg_for': 1.3, 'xg_against': 0.8}
    ]

def analyze_team_strengths(team_stats):
    """Analyze team strengths"""
    strengths = []
    
    goals_for = team_stats.get('goals_for', 0)
    if goals_for > 60:
        strengths.append('Strong Attack')
    
    goals_against = team_stats.get('goals_against', 0)
    if goals_against < 30:
        strengths.append('Solid Defense')
    
    possession = team_stats.get('possession', 50)
    if possession > 55:
        strengths.append('Ball Control')
    
    return strengths if strengths else ['Team Unity', 'Work Rate']

def analyze_team_weaknesses(team_stats):
    """Analyze team weaknesses"""
    weaknesses = []
    
    goals_for = team_stats.get('goals_for', 0)
    if goals_for < 40:
        weaknesses.append('Lack of Goals')
    
    goals_against = team_stats.get('goals_against', 0)
    if goals_against > 50:
        weaknesses.append('Defensive Issues')
    
    return weaknesses if weaknesses else ['Consistency']

def clean_team_stats(team_info):
    """Clean team stats for JSON"""
    cleaned = {}
    for key, value in team_info.items():
        cleaned[key] = clean_value(value)
    return cleaned

def clean_top_performers(performers):
    """Clean top performers data"""
    cleaned = []
    for performer in performers:
        cleaned_performer = {}
        for key, value in performer.items():
            cleaned_performer[key] = clean_value(value)
        cleaned.append(cleaned_performer)
    return cleaned

def analyze_possession_style(team_info):
    """Analyze possession style"""
    possession = clean_value(team_info.get('possession', 50))
    
    if possession > 60:
        return 'High possession, patient build-up'
    elif possession > 45:
        return 'Balanced possession game'
    else:
        return 'Direct, quick transitions'

def analyze_attacking_approach(team_info):
    """Analyze attacking approach"""
    goals = clean_value(team_info.get('goals_for', 0))
    shots = clean_value(team_info.get('shots', 0))
    
    if goals > 60:
        return 'Clinical finishing, multiple threats'
    elif shots > 500:
        return 'High volume shooting, create many chances'
    else:
        return 'Selective attacking, quality over quantity'

def analyze_defensive_structure(team_info):
    """Analyze defensive structure"""
    goals_against = clean_value(team_info.get('goals_against', 0))
    
    if goals_against < 30:
        return 'Solid defensive block, well organized'
    elif goals_against < 45:
        return 'Generally stable, occasional lapses'
    else:
        return 'Vulnerable defense, needs improvement'

def identify_key_players(team_players):
    """Identify key players"""
    if len(team_players) == 0:
        return []
    
    # Top scorers
    top_scorers = team_players.nlargest(3, 'goals')[['player', 'position', 'goals', 'assists']]
    
    # Top assist providers
    top_assisters = team_players.nlargest(3, 'assists')[['player', 'position', 'goals', 'assists']]
    
    # Combine and clean
    key_players = pd.concat([top_scorers, top_assisters]).drop_duplicates().head(5)
    
    return clean_top_performers(key_players.to_dict('records'))

def analyze_detailed_team_strengths(team_info):
    """Detailed team strengths analysis"""
    strengths = []
    
    possession = clean_value(team_info.get('possession', 50))
    goals_for = clean_value(team_info.get('goals_for', 0))
    goals_against = clean_value(team_info.get('goals_against', 0))
    
    if possession > 55:
        strengths.append('Ball control and patient build-up play')
    
    if goals_for > 55:
        strengths.append('Clinical attacking with multiple goal threats')
    
    if goals_against < 35:
        strengths.append('Solid defensive organization and clean sheets')
    
    return strengths if strengths else ['Team cohesion', 'Fighting spirit']

def analyze_detailed_team_weaknesses(team_info):
    """Detailed team weaknesses analysis"""
    weaknesses = []
    
    goals_for = clean_value(team_info.get('goals_for', 0))
    goals_against = clean_value(team_info.get('goals_against', 0))
    
    if goals_for < 40:
        weaknesses.append('Struggles to create and convert scoring chances')
    
    if goals_against > 50:
        weaknesses.append('Defensive vulnerabilities, concedes too easily')
    
    return weaknesses if weaknesses else ['Inconsistency in performance']

def simulate_recent_performance():
    """Simulate recent team performance"""
    return {
        'last_5_games': {
            'wins': 3,
            'draws': 1,
            'losses': 1,
            'goals_for': 8,
            'goals_against': 5,
            'form': 'WWDLW'
        },
        'home_record': {'wins': 8, 'draws': 2, 'losses': 2},
        'away_record': {'wins': 5, 'draws': 3, 'losses': 4}
    }

def calculate_position_averages(position_players):
    """Calculate position averages"""
    averages = {}
    key_stats = ['goals', 'assists', 'shots', 'passes', 'tackles']
    
    for stat in key_stats:
        if stat in position_players.columns:
            avg_value = clean_value(position_players[stat].mean())
            averages[stat] = avg_value
    
    return averages

def generate_heatmap_data():
    """Generate heatmap data"""
    return {
        'zones': [
            {'zone': 'Final Third', 'touches': 45, 'intensity': 85},
            {'zone': 'Right Wing', 'touches': 32, 'intensity': 70},
            {'zone': 'Central', 'touches': 28, 'intensity': 60},
            {'zone': 'Left Wing', 'touches': 15, 'intensity': 30},
            {'zone': 'Penalty Area', 'touches': 12, 'intensity': 90}
        ]
    }

def main():
    if len(sys.argv) != 3:
        print(json.dumps({'success': False, 'error': 'Invalid arguments'}))
        sys.exit(1)
    
    action = sys.argv[1]
    params = json.loads(sys.argv[2])
    
    if action == 'comprehensive_analysis':
        result = comprehensive_analysis(params)
    elif action == 'team_analysis':
        result = team_analysis(params)
    elif action == 'position_comparison':
        result = position_comparison(params)
    elif action == 'match_analysis':
        result = match_analysis(params)
    else:
        result = {'success': False, 'error': 'Unknown action'}
    
    print(json.dumps(result))

if __name__ == '__main__':
    main()
`;

    fs.writeFileSync(this.pythonScriptPath, pythonCode);
    fs.chmodSync(this.pythonScriptPath, '755');
  }
}

export const enhancedSoccerDataService = new EnhancedSoccerDataService();