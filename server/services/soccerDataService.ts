import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { rateLimitManager } from './rateLimitManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class SoccerDataService {
  private pythonScriptPath = path.join(__dirname, '../python/soccerdata_collector.py');

  async getPlayerDetailedStats(playerName: string, team?: string, league?: string): Promise<any> {
    try {
      console.log(`Getting detailed stats for ${playerName} using soccerdata`);
      
      const result = await this.runPythonScript('get_player_stats', {
        player_name: playerName,
        team: team,
        league: league
      });
      
      return result;
    } catch (error) {
      console.error('Error getting player detailed stats:', error);
      return null;
    }
  }

  async getLeagueStats(league: string, season: string = '2024-25'): Promise<any> {
    try {
      console.log(`Getting league stats for ${league} ${season}`);
      
      const result = await this.runPythonScript('get_league_stats', {
        league: league,
        season: season
      });
      
      return result;
    } catch (error) {
      console.error('Error getting league stats:', error);
      return null;
    }
  }

  async getTeamStats(team: string, league: string, season: string = '2024-25'): Promise<any> {
    try {
      console.log(`Getting team stats for ${team} in ${league}`);
      
      const result = await this.runPythonScript('get_team_stats', {
        team: team,
        league: league,
        season: season
      });
      
      return result;
    } catch (error) {
      console.error('Error getting team stats:', error);
      return null;
    }
  }

  async getPlayerPerformanceAnalysis(playerName: string, position: string): Promise<any> {
    try {
      console.log(`Getting performance analysis for ${playerName} (${position})`);
      
      const result = await this.runPythonScript('get_performance_analysis', {
        player_name: playerName,
        position: position
      });
      
      return result;
    } catch (error) {
      console.error('Error getting performance analysis:', error);
      return null;
    }
  }

  async getPlayerComparisons(playerNames: string[], metric: string = 'overall'): Promise<any> {
    try {
      console.log(`Comparing players: ${playerNames.join(', ')}`);
      
      const result = await this.runPythonScript('compare_players', {
        player_names: playerNames,
        metric: metric
      });
      
      return result;
    } catch (error) {
      console.error('Error comparing players:', error);
      return null;
    }
  }

  async getAvailableLeagues(): Promise<string[]> {
    try {
      const result = await this.runPythonScript('get_available_leagues', {});
      return result.leagues || [];
    } catch (error) {
      console.error('Error getting available leagues:', error);
      return [];
    }
  }

  private async runPythonScript(action: string, params: any): Promise<any> {
    return rateLimitManager.executeWithRateLimit('soccerdata', async () => {
      return new Promise((resolve, reject) => {
        const python = spawn('python3', [this.pythonScriptPath, action, JSON.stringify(params)], {
          timeout: 30000 // 30 secondes timeout
        });
        
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
    });
  }

  async ensurePythonScriptExists(): Promise<void> {
    const pythonDir = path.dirname(this.pythonScriptPath);
    
    if (!fs.existsSync(pythonDir)) {
      fs.mkdirSync(pythonDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.pythonScriptPath)) {
      await this.createPythonScript();
    }
  }

  private async createPythonScript(): Promise<void> {
    const pythonCode = `#!/usr/bin/env python3
import sys
import json
import soccerdata as sd
import pandas as pd
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

def get_player_stats(params):
    """Get detailed player statistics"""
    try:
        player_name = params.get('player_name')
        team = params.get('team')
        league = params.get('league', 'ENG-Premier League')
        
        # Initialize data sources
        fbref = sd.FBref()
        
        # Get player stats
        stats = fbref.read_player_season_stats(league)
        
        # Filter for the specific player
        player_stats = stats[stats['player'].str.contains(player_name, case=False, na=False)]
        
        if team:
            player_stats = player_stats[player_stats['team'].str.contains(team, case=False, na=False)]
        
        if len(player_stats) > 0:
            # Convert to JSON serializable format
            result = player_stats.iloc[0].to_dict()
            
            # Clean up the data
            for key, value in result.items():
                if pd.isna(value):
                    result[key] = None
                elif isinstance(value, (pd.Timestamp, datetime)):
                    result[key] = value.isoformat()
                elif hasattr(value, 'item'):  # numpy types
                    result[key] = value.item()
            
            return {
                'success': True,
                'player_stats': result,
                'source': 'fbref'
            }
        else:
            return {
                'success': False,
                'error': 'Player not found'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def get_league_stats(params):
    """Get league statistics"""
    try:
        league = params.get('league', 'ENG-Premier League')
        season = params.get('season', '2024-25')
        
        fbref = sd.FBref()
        
        # Get league table
        league_table = fbref.read_league_table(league)
        
        # Get match results
        matches = fbref.read_schedule(league)
        
        # Convert to JSON
        table_data = league_table.reset_index().to_dict('records')
        match_data = matches.head(50).reset_index().to_dict('records')  # Limit matches
        
        # Clean data
        for record in table_data + match_data:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
                elif isinstance(value, (pd.Timestamp, datetime)):
                    record[key] = value.isoformat()
                elif hasattr(value, 'item'):
                    record[key] = value.item()
        
        return {
            'success': True,
            'league_table': table_data,
            'recent_matches': match_data,
            'league': league,
            'season': season
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def get_team_stats(params):
    """Get team statistics"""
    try:
        team = params.get('team')
        league = params.get('league', 'ENG-Premier League')
        season = params.get('season', '2024-25')
        
        fbref = sd.FBref()
        
        # Get team stats
        team_stats = fbref.read_team_season_stats(league)
        
        # Filter for specific team
        team_data = team_stats[team_stats.index.str.contains(team, case=False, na=False)]
        
        if len(team_data) > 0:
            result = team_data.iloc[0].to_dict()
            
            # Clean data
            for key, value in result.items():
                if pd.isna(value):
                    result[key] = None
                elif hasattr(value, 'item'):
                    result[key] = value.item()
            
            return {
                'success': True,
                'team_stats': result,
                'team': team,
                'league': league
            }
        else:
            return {
                'success': False,
                'error': 'Team not found'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def get_performance_analysis(params):
    """Get detailed performance analysis"""
    try:
        player_name = params.get('player_name')
        position = params.get('position')
        
        fbref = sd.FBref()
        
        # Get player performance data
        stats = fbref.read_player_season_stats('ENG-Premier League')
        
        # Filter for player
        player_data = stats[stats['player'].str.contains(player_name, case=False, na=False)]
        
        if len(player_data) > 0:
            player_stats = player_data.iloc[0].to_dict()
            
            # Get position-specific analysis
            position_players = stats[stats['position'].str.contains(position, case=False, na=False)]
            
            # Calculate percentiles
            percentiles = {}
            key_stats = ['goals', 'assists', 'shots', 'passes', 'tackles', 'interceptions']
            
            for stat in key_stats:
                if stat in player_stats and stat in position_players.columns:
                    player_value = player_stats[stat]
                    if pd.notna(player_value):
                        percentile = (position_players[stat] <= player_value).mean() * 100
                        percentiles[stat] = percentile
            
            # Clean data
            for key, value in player_stats.items():
                if pd.isna(value):
                    player_stats[key] = None
                elif hasattr(value, 'item'):
                    player_stats[key] = value.item()
            
            return {
                'success': True,
                'player_stats': player_stats,
                'percentiles': percentiles,
                'position': position
            }
        else:
            return {
                'success': False,
                'error': 'Player not found for analysis'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def compare_players(params):
    """Compare multiple players"""
    try:
        player_names = params.get('player_names', [])
        metric = params.get('metric', 'overall')
        
        fbref = sd.FBref()
        stats = fbref.read_player_season_stats('ENG-Premier League')
        
        comparison_data = []
        
        for player_name in player_names:
            player_data = stats[stats['player'].str.contains(player_name, case=False, na=False)]
            
            if len(player_data) > 0:
                player_stats = player_data.iloc[0].to_dict()
                
                # Clean data
                for key, value in player_stats.items():
                    if pd.isna(value):
                        player_stats[key] = None
                    elif hasattr(value, 'item'):
                        player_stats[key] = value.item()
                
                comparison_data.append({
                    'player_name': player_name,
                    'stats': player_stats
                })
        
        return {
            'success': True,
            'comparison': comparison_data,
            'metric': metric
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def get_available_leagues(params):
    """Get available leagues"""
    try:
        # List of commonly available leagues in soccerdata
        leagues = [
            'ENG-Premier League',
            'ESP-La Liga',
            'GER-Bundesliga',
            'ITA-Serie A',
            'FRA-Ligue 1',
            'UEFA-Champions League',
            'UEFA-Europa League'
        ]
        
        return {
            'success': True,
            'leagues': leagues
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    if len(sys.argv) != 3:
        print(json.dumps({'success': False, 'error': 'Invalid arguments'}))
        sys.exit(1)
    
    action = sys.argv[1]
    params = json.loads(sys.argv[2])
    
    if action == 'get_player_stats':
        result = get_player_stats(params)
    elif action == 'get_league_stats':
        result = get_league_stats(params)
    elif action == 'get_team_stats':
        result = get_team_stats(params)
    elif action == 'get_performance_analysis':
        result = get_performance_analysis(params)
    elif action == 'compare_players':
        result = compare_players(params)
    elif action == 'get_available_leagues':
        result = get_available_leagues(params)
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

export const soccerDataService = new SoccerDataService();