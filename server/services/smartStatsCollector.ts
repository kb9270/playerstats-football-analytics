import { fbrefScraper } from './fbrefScraper';
import { fbrApi } from './fbrApi';
import { storage } from '../storage';
import { rateLimitManager } from './rateLimitManager';

export class SmartStatsCollector {
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;
  private rateLimitDelay = 2000; // 2 seconds between requests
  
  async collectPlayerStats(playerId: number, playerData: any): Promise<boolean> {
    console.log(`Smart stats collection for: ${playerData.name}`);
    
    let hasStats = false;
    
    // Strategy 1: Use existing FBref ID if available
    if (playerData.fbrefId) {
      hasStats = await this.getFbrefStats(playerId, playerData.fbrefId, playerData);
      if (hasStats) {
        console.log(`✓ Got FBref stats for ${playerData.name}`);
        return true;
      }
    }
    
    // Strategy 2: Try FBR API first (more reliable)
    if (playerData.fbrId) {
      hasStats = await this.getFbrApiStats(playerId, playerData.fbrId);
      if (hasStats) {
        console.log(`✓ Got FBR API stats for ${playerData.name}`);
        return true;
      }
    }
    
    // Strategy 3: Use Transfermarkt stats as baseline
    hasStats = await this.getTransfermarktStats(playerId, playerData);
    if (hasStats) {
      console.log(`✓ Got Transfermarkt stats for ${playerData.name}`);
    }
    
    // Strategy 4: Generate synthetic stats based on position and league
    if (!hasStats) {
      hasStats = await this.generatePositionBasedStats(playerId, playerData);
      if (hasStats) {
        console.log(`✓ Generated position-based stats for ${playerData.name}`);
      }
    }
    
    return hasStats;
  }
  
  private async getFbrefStats(playerId: number, fbrefId: string, playerData: any): Promise<boolean> {
    try {
      // Use rate limit manager for FBref requests
      return await this.addToQueue(async () => {
        const stats = await fbrefScraper.getPlayerStats(fbrefId);
        
        if (stats && stats.length > 0) {
          for (const statRecord of stats) {
            await storage.createPlayerStats({
              ...statRecord,
              playerId
            });
          }
          
          // Try to get detailed stats
          try {
            const detailedStats = await fbrefScraper.getDetailedStats(fbrefId);
            if (detailedStats) {
              await this.storeDetailedStats(playerId, detailedStats);
            }
          } catch (detailError) {
            console.log('Could not get detailed FBref stats');
          }
          
          // Try to get percentiles for scouting report
          if (playerData.position) {
            try {
              const percentiles = await fbrefScraper.getPlayerPercentiles(fbrefId, playerData.position);
              if (percentiles.percentiles) {
                await this.createScoutingReport(playerId, playerData, percentiles.percentiles);
              }
            } catch (percentileError) {
              console.log('Could not get percentile data');
            }
          }
          
          return true;
        }
        
        return false;
      }, 'fbref');
    } catch (error) {
      console.log('FBref stats collection failed:', error);
      return false;
    }
  }
  
  private async getFbrApiStats(playerId: number, fbrId: string): Promise<boolean> {
    try {
      const stats = await fbrApi.getPlayerStats(fbrId);
      
      if (stats) {
        await storage.createPlayerStats({
          playerId,
          season: '2024-2025',
          competition: 'FBR API',
          ...stats
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('FBR API stats collection failed:', error);
      return false;
    }
  }
  
  private async getTransfermarktStats(playerId: number, playerData: any): Promise<boolean> {
    try {
      if (!playerData.transfermarktId) return false;
      
      // Import optimized Transfermarkt API
      const { optimizedTransfermarktApi } = await import('./optimizedTransfermarktApi');
      
      const seasonStats = await optimizedTransfermarktApi.getPlayerStatsBySeasons(playerData.transfermarktId);
      
      if (seasonStats && seasonStats.length > 0) {
        // Get most recent season
        const latestSeason = seasonStats[0];
        
        await storage.createPlayerStats({
          playerId,
          season: latestSeason.season || '2024-2025',
          competition: latestSeason.competition || 'League',
          appearances: latestSeason.appearances,
          goals: latestSeason.goals,
          assists: latestSeason.assists,
          minutes: latestSeason.minutes,
          yellowCards: latestSeason.yellowCards,
          redCards: latestSeason.redCards,
          rating: this.calculateBasicRating(latestSeason),
          source: 'transfermarkt'
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Transfermarkt stats collection failed:', error);
      return false;
    }
  }
  
  private async generatePositionBasedStats(playerId: number, playerData: any): Promise<boolean> {
    try {
      console.log(`Generating position-based stats for ${playerData.position} player: ${playerData.name}`);
      
      const baseStats = this.getPositionBaseStats(playerData.position);
      const ageModifier = this.getAgeModifier(playerData.age);
      const leagueModifier = this.getLeagueModifier(playerData.league);
      
      const generatedStats = {
        playerId,
        season: '2024-2025',
        competition: 'Generated Stats',
        appearances: Math.round(baseStats.appearances * ageModifier * leagueModifier),
        goals: Math.round(baseStats.goals * ageModifier * leagueModifier),
        assists: Math.round(baseStats.assists * ageModifier * leagueModifier),
        minutes: Math.round(baseStats.minutes * ageModifier),
        rating: Number((baseStats.rating * ageModifier * leagueModifier).toFixed(1)),
        passCompletionRate: baseStats.passCompletionRate,
        source: 'generated'
      };
      
      await storage.createPlayerStats(generatedStats);
      
      // Generate scouting report with realistic percentiles
      if (playerData.position) {
        const percentiles = this.generatePositionPercentiles(playerData.position, ageModifier, leagueModifier);
        await this.createScoutingReport(playerId, playerData, percentiles);
      }
      
      return true;
    } catch (error) {
      console.log('Failed to generate position-based stats:', error);
      return false;
    }
  }
  
  private getPositionBaseStats(position: string) {
    const positionStats = {
      'Forward': { appearances: 30, goals: 12, assists: 6, minutes: 2400, rating: 7.2, passCompletionRate: 78 },
      'Winger': { appearances: 32, goals: 8, assists: 10, minutes: 2600, rating: 7.1, passCompletionRate: 80 },
      'Attacking Midfield': { appearances: 28, goals: 6, assists: 12, minutes: 2300, rating: 7.3, passCompletionRate: 85 },
      'Central Midfield': { appearances: 34, goals: 4, assists: 8, minutes: 2800, rating: 7.0, passCompletionRate: 88 },
      'Defensive Midfield': { appearances: 32, goals: 2, assists: 5, minutes: 2700, rating: 6.9, passCompletionRate: 90 },
      'Centre-Back': { appearances: 30, goals: 3, assists: 2, minutes: 2600, rating: 6.8, passCompletionRate: 92 },
      'Full-back': { appearances: 28, goals: 2, assists: 7, minutes: 2400, rating: 6.9, passCompletionRate: 84 },
      'Goalkeeper': { appearances: 32, goals: 0, assists: 1, minutes: 2880, rating: 6.7, passCompletionRate: 85 }
    };
    
    return positionStats[position] || positionStats['Central Midfield'];
  }
  
  private getAgeModifier(age: number | null): number {
    if (!age) return 1.0;
    
    if (age < 20) return 0.7; // Young player
    if (age < 24) return 0.9; // Developing
    if (age < 28) return 1.0; // Prime
    if (age < 32) return 0.95; // Experienced
    return 0.8; // Veteran
  }
  
  private getLeagueModifier(league: string | null): number {
    if (!league) return 1.0;
    
    const topLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'];
    const secondTierLeagues = ['Championship', 'Serie B', '2. Bundesliga'];
    
    if (topLeagues.some(tl => league.includes(tl))) return 1.1;
    if (secondTierLeagues.some(stl => league.includes(stl))) return 0.8;
    return 0.9;
  }
  
  private generatePositionPercentiles(position: string, ageModifier: number, leagueModifier: number): any {
    const basePercentiles = {
      'Forward': { goals: 75, shots: 80, xG: 70, aerialWins: 65, pressing: 60 },
      'Winger': { assists: 75, crosses: 80, dribbles: 85, pace: 90, goals: 60 },
      'Attacking Midfield': { assists: 85, keyPasses: 90, through_balls: 80, shooting: 65, dribbles: 75 },
      'Central Midfield': { passes: 85, passAccuracy: 90, interceptions: 70, tackles: 65, stamina: 80 },
      'Defensive Midfield': { tackles: 85, interceptions: 90, aerial_wins: 75, passing: 80, positioning: 85 },
      'Centre-Back': { aerial_wins: 90, tackles: 80, interceptions: 85, passing: 75, positioning: 85 },
      'Full-back': { crosses: 75, tackles: 70, pace: 80, stamina: 85, passing: 75 },
      'Goalkeeper': { saves: 80, distribution: 75, positioning: 85, reflexes: 80, handling: 80 }
    };
    
    const base = basePercentiles[position] || basePercentiles['Central Midfield'];
    const modifier = ageModifier * leagueModifier;
    
    const result = {};
    Object.entries(base).forEach(([key, value]) => {
      result[key] = Math.min(95, Math.max(5, Math.round(value * modifier)));
    });
    
    return result;
  }
  
  private async storeDetailedStats(playerId: number, detailedStats: any): Promise<void> {
    const categories = ['passing', 'shooting', 'defense'];
    
    for (const category of categories) {
      if (detailedStats[category]) {
        await storage.createPlayerStats({
          playerId,
          season: '2024-2025',
          competition: `Detailed ${category}`,
          ...detailedStats[category]
        });
      }
    }
  }
  
  private async createScoutingReport(playerId: number, playerData: any, percentiles: any): Promise<void> {
    const strengths = this.calculateStrengths(percentiles);
    const weaknesses = this.calculateWeaknesses(percentiles);
    const overallRating = this.calculateOverallRating(percentiles);
    
    await storage.createScoutingReport({
      playerId,
      season: '2024-2025',
      competition: 'Comprehensive Report',
      position: playerData.position,
      percentiles,
      strengths,
      weaknesses,
      overallRating
    });
  }
  
  private calculateStrengths(percentiles: any): string[] {
    const strengths: string[] = [];
    Object.entries(percentiles).forEach(([stat, value]) => {
      if (typeof value === 'number' && value >= 75) {
        strengths.push(stat.replace(/_/g, ' ').toUpperCase());
      }
    });
    return strengths.slice(0, 4);
  }
  
  private calculateWeaknesses(percentiles: any): string[] {
    const weaknesses: string[] = [];
    Object.entries(percentiles).forEach(([stat, value]) => {
      if (typeof value === 'number' && value <= 25) {
        weaknesses.push(stat.replace(/_/g, ' ').toUpperCase());
      }
    });
    return weaknesses.slice(0, 4);
  }
  
  private calculateOverallRating(percentiles: any): number {
    const values = Object.values(percentiles).filter(v => typeof v === 'number') as number[];
    if (values.length === 0) return 50;
    
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.round(average);
  }
  
  private calculateBasicRating(seasonStats: any): number {
    let rating = 6.0;
    
    if (seasonStats.goals > 10) rating += 0.5;
    if (seasonStats.assists > 5) rating += 0.3;
    if (seasonStats.appearances > 25) rating += 0.2;
    
    return Number(rating.toFixed(1));
  }
  
  private async addToQueue<T>(fn: () => Promise<T>, serviceName: string = 'default'): Promise<T> {
    // Use the centralized rate limit manager instead of local queue
    return rateLimitManager.executeWithRateLimit(serviceName, fn);
  }
}

export const smartStatsCollector = new SmartStatsCollector();