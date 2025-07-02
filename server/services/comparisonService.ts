import { PlayerData } from './csvDirectAnalyzer';

interface ComparisonMetric {
  name: string;
  displayName: string;
  player1Value: number;
  player2Value: number;
  player1Percentile: number;
  player2Percentile: number;
  unit?: string;
  format?: 'decimal' | 'percentage' | 'integer';
}

interface PlayerComparison {
  player1: PlayerData;
  player2: PlayerData;
  metrics: ComparisonMetric[];
  summary: {
    player1Advantages: string[];
    player2Advantages: string[];
    overallWinner: 'player1' | 'player2' | 'tied';
  };
}

interface MarketValue {
  value: number;
  currency: string;
  trend: 'rising' | 'stable' | 'falling';
  lastUpdate: string;
}

export class ComparisonService {
  
  // Calculer la valeur marchande basée sur les performances
  calculateMarketValue(player: PlayerData): MarketValue {
    const age = player.Age || 25;
    const league = player.Comp || '';
    const goals = player.Gls || 0;
    const assists = player.Ast || 0;
    const minutes = player.Min || 0;
    const matches = player.MP || 0;
    const position = player.Pos || '';
    
    let baseValue = 1000000; // 1M€ de base
    
    // Ajustement par ligue
    const leagueMultipliers: { [key: string]: number } = {
      'eng Premier League': 2.5,
      'es La Liga': 2.3,
      'de Bundesliga': 2.0,
      'it Serie A': 1.8,
      'fr Ligue 1': 1.6,
      'Champions Lg': 3.0
    };
    
    const leagueMultiplier = Object.keys(leagueMultipliers).find(l => 
      league.includes(l.split(' ')[1]) || league.includes(l.split(' ')[2])
    );
    if (leagueMultiplier) {
      baseValue *= leagueMultipliers[leagueMultiplier];
    } else {
      baseValue *= 1.2; // Autres ligues européennes
    }
    
    // Ajustement par performance
    const goalsPerGame = matches > 0 ? goals / matches : 0;
    const assistsPerGame = matches > 0 ? assists / matches : 0;
    const minutesPerGame = matches > 0 ? minutes / matches : 0;
    
    // Multiplicateur de performance
    let performanceMultiplier = 1.0;
    
    if (position.includes('FW')) {
      // Attaquants - focus sur les buts
      if (goalsPerGame > 0.8) performanceMultiplier += 2.0;
      else if (goalsPerGame > 0.6) performanceMultiplier += 1.5;
      else if (goalsPerGame > 0.4) performanceMultiplier += 1.0;
      else if (goalsPerGame > 0.2) performanceMultiplier += 0.5;
      
      if (assistsPerGame > 0.3) performanceMultiplier += 0.5;
    } else if (position.includes('MF')) {
      // Milieux - équilibre buts/passes
      if (goalsPerGame > 0.3) performanceMultiplier += 1.0;
      if (assistsPerGame > 0.4) performanceMultiplier += 1.5;
      if (assistsPerGame > 0.2) performanceMultiplier += 0.8;
      
      // Bonus pour les statistiques de passe
      const passCompletion = player['Cmp%'] || 0;
      if (passCompletion > 90) performanceMultiplier += 0.5;
    } else if (position.includes('DF')) {
      // Défenseurs - focus sur la défense
      const tackles = player.Tkl || 0;
      const interceptions = player.Int || 0;
      const clearances = player.Clr || 0;
      
      if (tackles > 30) performanceMultiplier += 0.8;
      if (interceptions > 15) performanceMultiplier += 0.6;
      if (clearances > 40) performanceMultiplier += 0.4;
      
      // Bonus pour les buts de défenseurs
      if (goalsPerGame > 0.1) performanceMultiplier += 1.0;
    }
    
    // Ajustement par âge
    let ageMultiplier = 1.0;
    if (age <= 21) ageMultiplier = 1.8; // Jeunes talents
    else if (age <= 24) ageMultiplier = 1.5;
    else if (age <= 27) ageMultiplier = 1.2;
    else if (age <= 30) ageMultiplier = 1.0;
    else if (age <= 32) ageMultiplier = 0.8;
    else ageMultiplier = 0.6;
    
    // Bonus pour le temps de jeu
    let playtimeMultiplier = 1.0;
    if (minutesPerGame > 80) playtimeMultiplier = 1.2;
    else if (minutesPerGame > 60) playtimeMultiplier = 1.0;
    else if (minutesPerGame > 30) playtimeMultiplier = 0.8;
    else playtimeMultiplier = 0.6;
    
    const finalValue = Math.round(baseValue * performanceMultiplier * ageMultiplier * playtimeMultiplier);
    
    // Déterminer la tendance
    let trend: 'rising' | 'stable' | 'falling' = 'stable';
    if (age <= 23 && performanceMultiplier > 1.5) trend = 'rising';
    else if (age >= 31 || performanceMultiplier < 0.8) trend = 'falling';
    
    return {
      value: finalValue,
      currency: 'EUR',
      trend,
      lastUpdate: new Date().toISOString().split('T')[0]
    };
  }

  // Comparer deux joueurs
  comparePlayer(player1: PlayerData, player2: PlayerData): PlayerComparison {
    const metrics: ComparisonMetric[] = [
      // Statistiques offensives
      {
        name: 'goals',
        displayName: 'Buts (sans penalty)',
        player1Value: player1['G-PK'] || 0,
        player2Value: player2['G-PK'] || 0,
        player1Percentile: this.calculatePercentile(player1, 'G-PK'),
        player2Percentile: this.calculatePercentile(player2, 'G-PK'),
        format: 'decimal'
      },
      {
        name: 'assists',
        displayName: 'Passes décisives',
        player1Value: player1.Ast || 0,
        player2Value: player2.Ast || 0,
        player1Percentile: this.calculatePercentile(player1, 'Ast'),
        player2Percentile: this.calculatePercentile(player2, 'Ast'),
        format: 'decimal'
      },
      {
        name: 'xG',
        displayName: 'Expected Goals',
        player1Value: player1.xG || 0,
        player2Value: player2.xG || 0,
        player1Percentile: this.calculatePercentile(player1, 'xG'),
        player2Percentile: this.calculatePercentile(player2, 'xG'),
        format: 'decimal'
      },
      {
        name: 'xAG',
        displayName: 'Expected Assists',
        player1Value: player1.xAG || 0,
        player2Value: player2.xAG || 0,
        player1Percentile: this.calculatePercentile(player1, 'xAG'),
        player2Percentile: this.calculatePercentile(player2, 'xAG'),
        format: 'decimal'
      },
      // Statistiques de tir
      {
        name: 'shots',
        displayName: 'Tirs',
        player1Value: player1.Sh || 0,
        player2Value: player2.Sh || 0,
        player1Percentile: this.calculatePercentile(player1, 'Sh'),
        player2Percentile: this.calculatePercentile(player2, 'Sh'),
        format: 'integer'
      },
      {
        name: 'shotAccuracy',
        displayName: 'Précision des tirs',
        player1Value: player1['SoT%'] || 0,
        player2Value: player2['SoT%'] || 0,
        player1Percentile: this.calculatePercentile(player1, 'SoT%'),
        player2Percentile: this.calculatePercentile(player2, 'SoT%'),
        unit: '%',
        format: 'percentage'
      },
      // Statistiques de passe
      {
        name: 'passCompletion',
        displayName: 'Réussite des passes',
        player1Value: player1['Cmp%'] || 0,
        player2Value: player2['Cmp%'] || 0,
        player1Percentile: this.calculatePercentile(player1, 'Cmp%'),
        player2Percentile: this.calculatePercentile(player2, 'Cmp%'),
        unit: '%',
        format: 'percentage'
      },
      {
        name: 'progressivePasses',
        displayName: 'Passes progressives',
        player1Value: player1.PrgP || 0,
        player2Value: player2.PrgP || 0,
        player1Percentile: this.calculatePercentile(player1, 'PrgP'),
        player2Percentile: this.calculatePercentile(player2, 'PrgP'),
        format: 'integer'
      },
      // Statistiques défensives
      {
        name: 'tackles',
        displayName: 'Tacles',
        player1Value: player1.Tkl || 0,
        player2Value: player2.Tkl || 0,
        player1Percentile: this.calculatePercentile(player1, 'Tkl'),
        player2Percentile: this.calculatePercentile(player2, 'Tkl'),
        format: 'integer'
      },
      {
        name: 'interceptions',
        displayName: 'Interceptions',
        player1Value: player1.Int || 0,
        player2Value: player2.Int || 0,
        player1Percentile: this.calculatePercentile(player1, 'Int'),
        player2Percentile: this.calculatePercentile(player2, 'Int'),
        format: 'integer'
      },
      // Statistiques physiques
      {
        name: 'touches',
        displayName: 'Touches de balle',
        player1Value: player1.Touches || 0,
        player2Value: player2.Touches || 0,
        player1Percentile: this.calculatePercentile(player1, 'Touches'),
        player2Percentile: this.calculatePercentile(player2, 'Touches'),
        format: 'integer'
      },
      {
        name: 'dribbleSuccess',
        displayName: 'Réussite des dribbles',
        player1Value: player1['Succ%'] || 0,
        player2Value: player2['Succ%'] || 0,
        player1Percentile: this.calculatePercentile(player1, 'Succ%'),
        player2Percentile: this.calculatePercentile(player2, 'Succ%'),
        unit: '%',
        format: 'percentage'
      }
    ];

    // Analyser les avantages
    const player1Advantages: string[] = [];
    const player2Advantages: string[] = [];
    let player1Score = 0;
    let player2Score = 0;

    metrics.forEach(metric => {
      if (metric.player1Percentile > metric.player2Percentile) {
        player1Advantages.push(metric.displayName);
        player1Score += metric.player1Percentile - metric.player2Percentile;
      } else if (metric.player2Percentile > metric.player1Percentile) {
        player2Advantages.push(metric.displayName);
        player2Score += metric.player2Percentile - metric.player1Percentile;
      }
    });

    const overallWinner = player1Score > player2Score ? 'player1' : 
                         player2Score > player1Score ? 'player2' : 'tied';

    return {
      player1,
      player2,
      metrics,
      summary: {
        player1Advantages,
        player2Advantages,
        overallWinner
      }
    };
  }

  private calculatePercentile(player: PlayerData, stat: string): number {
    // Simulation simplifiée des percentiles basée sur la valeur et la position
    const value = (player as any)[stat] || 0;
    const position = player.Pos;
    
    // Valeurs de référence par position et statistique
    const references: { [key: string]: { [key: string]: number } } = {
      'FW': {
        'G-PK': 8, 'Ast': 3, 'xG': 10, 'xAG': 4, 'Sh': 60, 'SoT%': 35,
        'Cmp%': 75, 'PrgP': 40, 'Tkl': 15, 'Int': 5, 'Touches': 800, 'Succ%': 50
      },
      'MF': {
        'G-PK': 4, 'Ast': 6, 'xG': 5, 'xAG': 7, 'Sh': 35, 'SoT%': 40,
        'Cmp%': 85, 'PrgP': 60, 'Tkl': 25, 'Int': 12, 'Touches': 1200, 'Succ%': 60
      },
      'DF': {
        'G-PK': 2, 'Ast': 2, 'xG': 2, 'xAG': 2, 'Sh': 15, 'SoT%': 30,
        'Cmp%': 90, 'PrgP': 50, 'Tkl': 35, 'Int': 18, 'Touches': 1500, 'Succ%': 70
      }
    };
    
    let posKey = 'MF'; // Par défaut
    if (position.includes('FW')) posKey = 'FW';
    else if (position.includes('DF')) posKey = 'DF';
    
    const reference = references[posKey][stat] || 1;
    const percentile = Math.min(95, Math.max(5, (value / reference) * 50));
    
    return Math.round(percentile);
  }

  // Formater la valeur marchande pour l'affichage
  formatMarketValue(marketValue: MarketValue): string {
    const value = marketValue.value;
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    } else {
      return `€${value}`;
    }
  }
}

export const comparisonService = new ComparisonService();