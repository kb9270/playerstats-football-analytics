import { fbrefApi, transfermarktApi } from './footballApi';
import { storage } from '../storage';
import type { InsertPlayer, InsertPlayerStats, InsertScoutingReport } from '@shared/schema';

export class FootballDataScraper {
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeAndStorePlayer(query: string): Promise<any> {
    try {
      console.log(`Scraping player data for: ${query}`);
      
      // Search for players
      const searchResults = await fbrefApi.searchPlayers(query);
      
      if (searchResults.length === 0) {
        throw new Error('No players found');
      }
      
      const playerData = searchResults[0];
      
      // Get detailed profile
      const profile = await fbrefApi.getPlayerProfile(playerData.fbrefId);
      await this.delay(1000); // Rate limiting
      
      // Get market value from Transfermarkt
      const marketData = await transfermarktApi.getPlayerMarketValue(profile.name);
      await this.delay(1000);
      
      // Create player record
      const insertPlayer: InsertPlayer = {
        name: profile.name,
        fullName: profile.name,
        age: profile.age,
        position: profile.position,
        team: profile.team,
        league: 'Ligue 1', // Default, should be extracted
        foot: profile.foot,
        fbrefId: profile.fbrefId,
        transfermarktId: marketData?.transfermarktId,
        marketValue: marketData?.marketValue ? this.parseMarketValue(marketData.marketValue) : null,
        contractEnd: marketData?.contractEnd,
      };
      
      const player = await storage.createPlayer(insertPlayer);
      
      // Get current season stats
      const stats = await fbrefApi.getPlayerStats(profile.fbrefId);
      await this.delay(1000);
      
      if (stats) {
        const insertStats: InsertPlayerStats = {
          playerId: player.id,
          season: '2024-2025',
          competition: 'Ligue 1',
          ...stats,
        };
        
        await storage.createPlayerStats(insertStats);
      }
      
      // Get scouting report (percentiles)
      if (profile.position) {
        const percentileData = await fbrefApi.getPlayerPercentiles(profile.fbrefId, profile.position);
        await this.delay(1000);
        
        if (percentileData.percentiles && Object.keys(percentileData.percentiles).length > 0) {
          const insertReport: InsertScoutingReport = {
            playerId: player.id,
            season: '2024-2025',
            competition: 'Ligue 1',
            position: profile.position,
            percentiles: percentileData.percentiles,
            overallRating: this.calculateOverallRating(percentileData.percentiles),
          };
          
          await storage.createScoutingReport(insertReport);
        }
      }
      
      return player;
      
    } catch (error) {
      console.error('Error scraping player data:', error);
      throw error;
    }
  }

  async updatePlayerData(playerId: number): Promise<void> {
    try {
      const player = await storage.getPlayer(playerId);
      if (!player || !player.fbrefId) {
        throw new Error('Player not found or missing FBref ID');
      }
      
      // Update stats
      const stats = await fbrefApi.getPlayerStats(player.fbrefId);
      if (stats) {
        const existingStats = await storage.getPlayerStatsBySeason(playerId, '2024-2025');
        
        if (existingStats) {
          await storage.updatePlayerStats(existingStats.id, stats);
        } else {
          const insertStats: InsertPlayerStats = {
            playerId,
            season: '2024-2025',
            competition: 'Ligue 1',
            ...stats,
          };
          await storage.createPlayerStats(insertStats);
        }
      }
      
      // Update scouting report
      if (player.position) {
        const percentileData = await fbrefApi.getPlayerPercentiles(player.fbrefId, player.position);
        
        if (percentileData.percentiles && Object.keys(percentileData.percentiles).length > 0) {
          const existingReport = await storage.getScoutingReport(playerId, '2024-2025');
          
          if (existingReport) {
            await storage.updateScoutingReport(existingReport.id, {
              percentiles: percentileData.percentiles,
              overallRating: this.calculateOverallRating(percentileData.percentiles),
            });
          } else {
            const insertReport: InsertScoutingReport = {
              playerId,
              season: '2024-2025',
              competition: 'Ligue 1',
              position: player.position,
              percentiles: percentileData.percentiles,
              overallRating: this.calculateOverallRating(percentileData.percentiles),
            };
            await storage.createScoutingReport(insertReport);
          }
        }
      }
      
    } catch (error) {
      console.error('Error updating player data:', error);
      throw error;
    }
  }

  private parseMarketValue(marketValueStr: string): number | null {
    if (!marketValueStr) return null;
    
    const cleanValue = marketValueStr.replace(/[^\d.,]/g, '');
    const value = parseFloat(cleanValue.replace(',', '.'));
    
    if (marketValueStr.includes('m') || marketValueStr.includes('M')) {
      return value * 1000000;
    } else if (marketValueStr.includes('k') || marketValueStr.includes('K')) {
      return value * 1000;
    }
    
    return value;
  }

  private calculateOverallRating(percentiles: Record<string, number>): number {
    const values = Object.values(percentiles).filter(v => typeof v === 'number' && !isNaN(v));
    if (values.length === 0) return 0;
    
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  }
}

export const scraper = new FootballDataScraper();
