import { fbrefScraper } from './fbrefScraper';
import { storage } from '../storage';

export class FBrefEnhancer {
  // Enhanced search with multiple strategies
  async findPlayerFbrefId(playerName: string, teamName?: string, age?: number): Promise<string | null> {
    const searchStrategies = [
      playerName, // Full name
      playerName.split(' ').slice(-1)[0], // Last name only
      playerName.split(' ')[0], // First name only
      playerName.replace(/[^a-zA-Z\s]/g, ''), // Remove special characters
    ];

    // Add team-specific searches if team is provided
    if (teamName) {
      searchStrategies.push(`${playerName} ${teamName}`);
    }

    for (const searchTerm of searchStrategies) {
      try {
        console.log(`Searching FBref with: "${searchTerm}"`);
        const results = await fbrefScraper.searchPlayer(searchTerm);
        
        if (results.length > 0) {
          // If we have team info, try to match it
          if (teamName) {
            const teamMatch = results.find(result => 
              result.description && result.description.toLowerCase().includes(teamName.toLowerCase())
            );
            if (teamMatch) {
              console.log(`Found team-matched player: ${teamMatch.name}`);
              return teamMatch.fbrefId;
            }
          }
          
          // Otherwise, return the first match
          console.log(`Found player: ${results[0].name}`);
          return results[0].fbrefId;
        }
      } catch (error) {
        console.log(`Search strategy "${searchTerm}" failed:`, error);
        continue;
      }
    }

    return null;
  }

  // Comprehensive stats collection
  async getCompletePlayerStats(fbrefId: string, playerId: number): Promise<boolean> {
    try {
      let hasData = false;

      // Get basic stats
      const basicStats = await fbrefScraper.getPlayerStats(fbrefId);
      if (basicStats.length > 0) {
        console.log(`Storing ${basicStats.length} basic stat records`);
        for (const statRecord of basicStats) {
          await storage.createPlayerStats({
            ...statRecord,
            playerId
          });
        }
        hasData = true;
      }

      // Get detailed stats
      const detailedStats = await fbrefScraper.getDetailedStats(fbrefId);
      if (detailedStats && Object.keys(detailedStats).length > 0) {
        console.log('Storing detailed stats');
        
        if (detailedStats.passing) {
          await storage.createPlayerStats({
            playerId,
            season: '2024-2025',
            competition: 'Passing Details',
            ...detailedStats.passing
          });
          hasData = true;
        }
        
        if (detailedStats.shooting) {
          await storage.createPlayerStats({
            playerId,
            season: '2024-2025',
            competition: 'Shooting Details',
            ...detailedStats.shooting
          });
          hasData = true;
        }
        
        if (detailedStats.defense) {
          await storage.createPlayerStats({
            playerId,
            season: '2024-2025',
            competition: 'Defense Details',
            ...detailedStats.defense
          });
          hasData = true;
        }
      }

      return hasData;
    } catch (error) {
      console.error('Error getting complete player stats:', error);
      return false;
    }
  }

  // Enhanced scouting report generation
  async generateScoutingReport(fbrefId: string, playerId: number, position: string): Promise<boolean> {
    try {
      const percentileData = await fbrefScraper.getPlayerPercentiles(fbrefId, position);
      
      if (percentileData.percentiles && Object.keys(percentileData.percentiles).length > 0) {
        console.log('Generating enhanced scouting report');
        
        await storage.createScoutingReport({
          playerId,
          season: '2024-2025',
          competition: 'Enhanced Report',
          position,
          percentiles: percentileData.percentiles,
          strengths: this.calculateStrengths(percentileData.percentiles),
          weaknesses: this.calculateWeaknesses(percentileData.percentiles),
          overallRating: this.calculateOverallRating(percentileData.percentiles)
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error generating scouting report:', error);
      return false;
    }
  }

  private calculateStrengths(percentiles: any): string[] {
    const strengths: string[] = [];
    Object.entries(percentiles).forEach(([stat, value]) => {
      if (typeof value === 'number' && value >= 80) {
        strengths.push(stat.replace(/_/g, ' ').toUpperCase());
      }
    });
    return strengths.slice(0, 4);
  }

  private calculateWeaknesses(percentiles: any): string[] {
    const weaknesses: string[] = [];
    Object.entries(percentiles).forEach(([stat, value]) => {
      if (typeof value === 'number' && value <= 20) {
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
}

export const fbrefEnhancer = new FBrefEnhancer();