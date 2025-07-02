import fs from 'fs';
import path from 'path';

export interface PlayerData {
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
      const headers = this.parseCSVLine(lines[0]);

      this.playersData = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = this.parseCSVLine(line);
        const player: any = {};

        headers.forEach((header, index) => {
          let value: any = values[index] || '';

          // Clean the value
          if (typeof value === 'string') {
            value = value.trim();
          }

          // Convert numeric fields
          if (!isNaN(Number(value)) && value !== '' && value !== null) {
            value = Number(value);
          } else if (value === '' || value === 'null' || value === 'undefined') {
            value = null;
          }

          player[header.trim()] = value;
        });

        return player as PlayerData;
      });

      this.loaded = true;
      console.log(`Loaded ${this.playersData.length} players from CSV`);
    } catch (error) {
      console.error('Error loading CSV data:', error);
      throw error;
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // Double quote escape
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current.trim().replace(/^"|"$/g, ''));
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

    // Analyse de progression et tendances
    const progressionAnalysis = this.generateProgressionAnalysis(player, percentiles);
    
    return {
      player,
      percentiles,
      strengths,
      weaknesses,
      playingStyle,
      overallRating,
      progression: progressionAnalysis,
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

  async getSimilarPlayers(targetName: string, k: number = 3): Promise<PlayerData[]> {
    await this.loadData();
    const target = await this.getPlayerByName(targetName);
    if (!target) return [];

    const { PlayerSimilarityService } = await import('./playerSimilarityService');
    return PlayerSimilarityService.getSimilarPlayers(target, this.playersData, k);
  }

  async getPlayerWeaknesses(playerName: string): Promise<{ weaknesses: string[], suggestions: string[] }> {
    await this.loadData();
    const player = await this.getPlayerByName(playerName);
    if (!player) return { weaknesses: [], suggestions: [] };

    const { WeaknessAnalysisService } = await import('./weaknessAnalysisService');
    const weaknesses = WeaknessAnalysisService.detectWeaknesses(player);
    const suggestions = WeaknessAnalysisService.getImprovementSuggestions(player, weaknesses);

    return { weaknesses, suggestions };
  }

  generateProgressionAnalysis(player: PlayerData, percentiles: Record<string, number>): any {
    // Basé sur l'âge et les performances actuelles
    const age = player.Age || 25;
    const minutesPlayed = player.Min || 0;
    const experience = minutesPlayed / 90; // Approximation des matchs joués
    
    // Identifie les domaines à fort potentiel de progression
    const progressionAreas: Array<{
      domain: string;
      currentLevel: string;
      potential: string;
      timeline: string;
      recommendation: string;
    }> = [];

    // Analyse technique (based on percentiles)
    if (percentiles.dribbleSuccess < 60 && age < 26) {
      progressionAreas.push({
        domain: 'Technique de dribble',
        currentLevel: percentiles.dribbleSuccess < 40 ? 'À développer' : 'Moyen',
        potential: 'Élevé',
        timeline: '6-12 mois',
        recommendation: 'Travail spécifique en 1v1, exercices techniques répétitifs'
      });
    }

    // Analyse physique
    if (age < 23) {
      progressionAreas.push({
        domain: 'Développement physique',
        currentLevel: 'En développement',
        potential: 'Très élevé',
        timeline: '12-24 mois',
        recommendation: 'Programme de musculation adapté, travail de vitesse'
      });
    }

    // Analyse tactique
    if (percentiles.progressivePasses < 50 && (player.Pos?.includes('MF') || player.Pos?.includes('FW'))) {
      progressionAreas.push({
        domain: 'Vision de jeu',
        currentLevel: 'À améliorer',
        potential: 'Moyen à élevé',
        timeline: '3-6 mois',
        recommendation: 'Travail vidéo, placement et lecture du jeu'
      });
    }

    // Analyse de la régularité
    const consistency = this.calculateConsistency(player);
    if (consistency < 70) {
      progressionAreas.push({
        domain: 'Régularité des performances',
        currentLevel: 'Inconstant',
        potential: 'Élevé',
        timeline: '6-12 mois',
        recommendation: 'Travail mental, routines pré-match, gestion de la pression'
      });
    }

    // Projection de valeur marchande
    const currentValue = this.estimateMarketValue(player);
    const projectedValue = this.projectMarketValue(player, progressionAreas);

    return {
      progressionAreas,
      timeline: {
        shortTerm: progressionAreas.filter(area => area.timeline.includes('3-6')),
        mediumTerm: progressionAreas.filter(area => area.timeline.includes('6-12')),
        longTerm: progressionAreas.filter(area => area.timeline.includes('12-24'))
      },
      marketValue: {
        current: currentValue,
        projected: projectedValue,
        potentialGain: projectedValue - currentValue
      },
      riskFactors: this.identifyRiskFactors(player),
      recommendation: this.generateProgressionRecommendation(player, progressionAreas)
    };
  }

  private calculateConsistency(player: PlayerData): number {
    // Basé sur le ratio entre performances attendues et réelles
    const xGOverPerformance = Math.abs((player.Gls || 0) - (player.xG || 0));
    const xAOverPerformance = Math.abs((player.Ast || 0) - (player.xAG || 0));
    
    // Plus l'écart est petit, plus le joueur est régulier
    const consistencyScore = 100 - (xGOverPerformance + xAOverPerformance) * 10;
    return Math.max(0, Math.min(100, consistencyScore));
  }

  private estimateMarketValue(player: PlayerData): number {
    const age = player.Age || 25;
    const avgPercentile = Object.values(this.calculatePercentiles(player, player.Pos?.split(',')[0] || 'MF'))
      .reduce((a, b) => a + b, 0) / 10;

    // Base value calculation
    let baseValue = 1000000; // 1M base
    
    // Age factor
    if (age < 21) baseValue *= 1.5;
    else if (age < 25) baseValue *= 1.2;
    else if (age > 30) baseValue *= 0.7;
    
    // Performance factor
    baseValue *= (avgPercentile / 50);
    
    // League factor (approximate based on common European leagues)
    const league = player.Comp;
    if (league?.includes('Premier League') || league?.includes('La Liga') || league?.includes('Serie A') || league?.includes('Bundesliga')) {
      baseValue *= 2;
    } else if (league?.includes('Ligue 1')) {
      baseValue *= 1.5;
    }

    return Math.round(baseValue / 100000) * 100000; // Round to nearest 100k
  }

  private projectMarketValue(player: PlayerData, progressionAreas: any[]): number {
    const currentValue = this.estimateMarketValue(player);
    const age = player.Age || 25;
    
    let multiplier = 1;
    
    // High potential areas increase value projection
    const highPotentialAreas = progressionAreas.filter(area => area.potential === 'Très élevé' || area.potential === 'Élevé');
    multiplier += highPotentialAreas.length * 0.3;
    
    // Age factor for projection
    if (age < 23) multiplier += 0.5;
    else if (age < 26) multiplier += 0.2;
    else if (age > 29) multiplier -= 0.1;
    
    return Math.round(currentValue * multiplier / 100000) * 100000;
  }

  private identifyRiskFactors(player: PlayerData): string[] {
    const risks: string[] = [];
    const age = player.Age || 25;
    
    if (age > 29) risks.push('Âge - Déclin physique potentiel');
    if ((player.CrdY || 0) > 8) risks.push('Discipline - Cartons jaunes fréquents');
    if ((player.CrdR || 0) > 1) risks.push('Discipline - Cartons rouges');
    if ((player.Min || 0) < 1000) risks.push('Temps de jeu limité cette saison');
    
    const injuryRisk = this.calculateInjuryRisk(player);
    if (injuryRisk > 0.3) risks.push('Risque de blessure modéré');
    
    return risks;
  }

  private calculateInjuryRisk(player: PlayerData): number {
    // Estimation basée sur l'âge et l'intensité de jeu
    const age = player.Age || 25;
    const minutesPlayed = player.Min || 0;
    
    let risk = 0;
    if (age > 30) risk += 0.2;
    if (minutesPlayed > 2500) risk += 0.1; // Surcharge
    if (minutesPlayed < 500) risk += 0.1; // Manque de rythme
    
    return Math.min(1, risk);
  }

  private generateProgressionRecommendation(player: PlayerData, progressionAreas: any[]): string {
    const age = player.Age || 25;
    const position = player.Pos?.split(',')[0] || 'MF';
    
    if (age < 21) {
      return "Joueur en développement avec un potentiel élevé. Focus sur la formation complète et l'accumulation d'expérience.";
    } else if (age < 25) {
      return `Période critique pour ${position}. Développement ciblé des faiblesses identifiées et consolidation des forces.`;
    } else if (age < 29) {
      return "Joueur mature. Optimisation des performances et adaptation tactique selon les besoins de l'équipe.";
    } else {
      return "Joueur expérimenté. Gestion de la charge et valorisation de l'expérience pour guider les jeunes.";
    }
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