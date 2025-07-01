import fs from 'fs';
import path from 'path';

interface PlayerData {
  Rk: number;
  Player: string;
  Nation: string;
  Pos: string;
  Squad: string;
  Comp: string;
  Age: number;
  Born: number;
  MP: number;
  Starts: number;
  Min: number;
  '90s': number;
  Gls: number;
  Ast: number;
  'G+A': number;
  'G-PK': number;
  PK: number;
  PKatt: number;
  CrdY: number;
  CrdR: number;
  xG: number;
  npxG: number;
  xAG: number;
  'npxG+xAG': number;
  'G+A-PK': number;
  'xG+xAG': number;
  PrgC: number;
  PrgP: number;
  PrgR: number;
  Sh: number;
  SoT: number;
  'SoT%': number;
  'Sh/90': number;
  'SoT/90': number;
  'G/Sh': number;
  'G/SoT': number;
  Dist: number;
  FK: number;
  Tkl: number;
  Int: number;
  Clr: number;
  'Cmp%': number;
  Cmp: number;
  Att: number;
  TotDist: number;
  PrgDist: number;
  Touches: number;
  'Succ%': number;
  Succ: number;
  'Tkld%': number;
  Tkld: number;
  Carries: number;
  Won: number;
  Lost_stats_misc: number;
  'Won%': number;
}

export class CSVDirectAnalyzer {
  private csvPath = path.join(process.cwd(), 'players_data_light.csv');
  private playersData: PlayerData[] = [];
  private loaded = false;

  private async loadData(): Promise<void> {
    if (this.loaded) return;

    try {
      const csvContent = fs.readFileSync(this.csvPath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');

      this.playersData = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = this.parseCSVLine(line);
        const player: any = {};

        headers.forEach((header, index) => {
          let value: any = values[index] || '';

          // Convert numeric fields
          if (!isNaN(Number(value)) && value !== '') {
            value = Number(value);
          } else if (value === '') {
            value = null;
          }

          player[header.trim()] = value;
        });

        return player as PlayerData;
      });

      this.loaded = true;
    } catch (error) {
      console.error('Error loading CSV data:', error);
      throw error;
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  async getAllPlayers(): Promise<PlayerData[]> {
    await this.loadData();
    return this.playersData;
  }

  async searchPlayers(query: string): Promise<PlayerData[]> {
    await this.loadData();
    const searchTerm = query.toLowerCase();

    return this.playersData.filter(player => 
      player.Player?.toLowerCase().includes(searchTerm) ||
      player.Squad?.toLowerCase().includes(searchTerm)
    ).slice(0, 20);
  }

  async getPlayerByName(name: string): Promise<PlayerData | null> {
    await this.loadData();
    const searchName = decodeURIComponent(name).trim().toLowerCase();
    
    // Recherche exacte d'abord
    let player = this.playersData.find(player => 
      player.Player?.trim().toLowerCase() === searchName
    );
    
    // Si pas trouvé, recherche partielle
    if (!player) {
      player = this.playersData.find(player => 
        player.Player?.trim().toLowerCase().includes(searchName) ||
        searchName.includes(player.Player?.trim().toLowerCase() || '')
      );
    }
    
    // Si toujours pas trouvé, recherche par mots-clés
    if (!player) {
      const searchWords = searchName.split(' ').filter(word => word.length > 2);
      player = this.playersData.find(player => {
        const playerName = player.Player?.trim().toLowerCase() || '';
        return searchWords.every(word => playerName.includes(word));
      });
    }
    
    return player || null;
  }

  async getPlayersByTeam(team: string): Promise<PlayerData[]> {
    await this.loadData();
    return this.playersData.filter(player => 
      player.Squad?.toLowerCase().includes(team.toLowerCase())
    );
  }

  async getPlayersByPosition(position: string): Promise<PlayerData[]> {
    await this.loadData();
    return this.playersData.filter(player => 
      player.Pos?.includes(position)
    );
  }

  async getTopScorers(limit: number = 10): Promise<PlayerData[]> {
    await this.loadData();
    return this.playersData
      .filter(player => player.Gls > 0)
      .sort((a, b) => (b.Gls || 0) - (a.Gls || 0))
      .slice(0, limit);
  }

  async getTopAssists(limit: number = 10): Promise<PlayerData[]> {
    await this.loadData();
    return this.playersData
      .filter(player => player.Ast > 0)
      .sort((a, b) => (b.Ast || 0) - (a.Ast || 0))
      .slice(0, limit);
  }

  async getLeagueStats(): Promise<any> {
    await this.loadData();
    const leagues: Record<string, number> = {};

    this.playersData.forEach(player => {
      if (player.Comp) {
        leagues[player.Comp] = (leagues[player.Comp] || 0) + 1;
      }
    });

    return {
      totalPlayers: this.playersData.length,
      leagues,
      topLeagues: Object.entries(leagues)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
    };
  }

  async getTeamStats(): Promise<any> {
    await this.loadData();
    const teams: Record<string, number> = {};

    this.playersData.forEach(player => {
      if (player.Squad) {
        teams[player.Squad] = (teams[player.Squad] || 0) + 1;
      }
    });

    return {
      totalTeams: Object.keys(teams).length,
      teams,
      topTeams: Object.entries(teams)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    };
  }

  calculatePercentiles(player: PlayerData, position: string): Record<string, number> {
    const positionPlayers = this.playersData.filter(p => 
      p.Pos?.includes(position) && p.Min >= 90 // Au moins 90 minutes jouées
    );

    if (positionPlayers.length < 2) return {};

    const calculatePercentile = (value: number, values: number[]): number => {
      const sorted = values.filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b);
      if (sorted.length === 0) return 0;

      const rank = sorted.filter(v => v < value).length;
      return Math.round((rank / sorted.length) * 100);
    };

    return {
      goals: calculatePercentile(player.Gls || 0, positionPlayers.map(p => p.Gls || 0)),
      assists: calculatePercentile(player.Ast || 0, positionPlayers.map(p => p.Ast || 0)),
      xG: calculatePercentile(player.xG || 0, positionPlayers.map(p => p.xG || 0)),
      xAG: calculatePercentile(player.xAG || 0, positionPlayers.map(p => p.xAG || 0)),
      shots: calculatePercentile(player.Sh || 0, positionPlayers.map(p => p.Sh || 0)),
      passCompletion: calculatePercentile(player['Cmp%'] || 0, positionPlayers.map(p => p['Cmp%'] || 0)),
      tackles: calculatePercentile(player.Tkl || 0, positionPlayers.map(p => p.Tkl || 0)),
      interceptions: calculatePercentile(player.Int || 0, positionPlayers.map(p => p.Int || 0)),
      progressivePasses: calculatePercentile(player.PrgP || 0, positionPlayers.map(p => p.PrgP || 0)),
      dribbleSuccess: calculatePercentile(player['Succ%'] || 0, positionPlayers.map(p => p['Succ%'] || 0)),
    };
  }

  generatePlayerAnalysis(player: PlayerData): any {
    const percentiles = this.calculatePercentiles(player, player.Pos?.split(',')[0] || 'MF');

    // Analyse des forces et faiblesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    Object.entries(percentiles).forEach(([stat, percentile]) => {
      if (percentile >= 80) {
        strengths.push(this.getStatDisplayName(stat));
      } else if (percentile <= 20) {
        weaknesses.push(this.getStatDisplayName(stat));
      }
    });

    // Style de jeu
    let playingStyle = 'Joueur polyvalent';
    if (percentiles.goals > 80 && percentiles.shots > 70) {
      playingStyle = 'Finisseur élite';
    } else if (percentiles.assists > 80 && percentiles.progressivePasses > 70) {
      playingStyle = 'Créateur de jeu';
    } else if (percentiles.tackles > 80 && percentiles.interceptions > 70) {
      playingStyle = 'Défenseur solide';
    } else if (percentiles.dribbleSuccess > 80) {
      playingStyle = 'Dribbleur technique';
    }

    // Note globale
    const avgPercentile = Object.values(percentiles).reduce((a, b) => a + b, 0) / Object.values(percentiles).length;
    const overallRating = Math.round(50 + (avgPercentile - 50) * 0.8); // Note sur 100

    return {
      player,
      percentiles,
      strengths,
      weaknesses,
      playingStyle,
      overallRating,
      stats: {
        goalsPerGame: player.Min > 0 ? ((player.Gls || 0) / (player.Min / 90)).toFixed(2) : '0.00',
        assistsPerGame: player.Min > 0 ? ((player.Ast || 0) / (player.Min / 90)).toFixed(2) : '0.00',
        minutesPlayed: player.Min || 0,
        appearances: player.MP || 0,
        yellowCards: player.CrdY || 0,
        redCards: player.CrdR || 0,
      }
    };
  }

  private getStatDisplayName(stat: string): string {
    const displayNames: Record<string, string> = {
      goals: 'Buts',
      assists: 'Passes décisives',
      xG: 'Expected Goals',
      xAG: 'Expected Assists',
      shots: 'Tirs',
      passCompletion: 'Précision des passes',
      tackles: 'Tacles',
      interceptions: 'Interceptions',
      progressivePasses: 'Passes progressives',
      dribbleSuccess: 'Dribbles réussis'
    };
    return displayNames[stat] || stat;
  }
}

export const csvDirectAnalyzer = new CSVDirectAnalyzer();