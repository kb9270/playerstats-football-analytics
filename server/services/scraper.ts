import { storage } from "../storage";
import { fbrefApi } from "./footballApi";
import { transfermarktApi } from "./transfermarktApi";
import { fbrefScraper } from "./fbrefScraper";
import { fbrApi } from "./fbrApi";
import { aiService } from "./aiService";

export class FootballDataScraper {
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeAndStorePlayer(query: string): Promise<any> {
    try {
      console.log(`Searching for player: ${query}`);
      
      let playerData = null;
      
      // Try Transfermarkt first for broader search coverage
      const transfermarktResults = await transfermarktApi.searchPlayers(query);
      if (transfermarktResults.length > 0) {
        const bestMatch = transfermarktResults[0];
        console.log(`Found player on Transfermarkt: ${bestMatch.name}`);
        
        // Get detailed data from Transfermarkt
        if (bestMatch.transfermarktId) {
          const detailedData = await transfermarktApi.getPlayerDetails(bestMatch.transfermarktId);
          if (detailedData) {
            playerData = { ...bestMatch, ...detailedData };
          } else {
            playerData = bestMatch;
          }
        }
      }
      
      // Try FBR API for comprehensive data
      if (!playerData) {
        const fbrResults = await fbrApi.searchPlayer(query);
        if (fbrResults.length > 0) {
          const bestMatch = fbrResults[0];
          console.log(`Found player on FBR API: ${bestMatch.name}`);
          
          const profile = await fbrApi.getPlayerProfile(bestMatch.id);
          if (profile) {
            playerData = { ...profile, fbrId: bestMatch.id };
          }
        }
      }

      // Try FBref with enhanced scraper as fallback
      if (!playerData) {
        const fbrefResults = await fbrefScraper.searchPlayer(query);
        if (fbrefResults.length > 0) {
          const bestMatch = fbrefResults[0];
          console.log(`Found player on FBref: ${bestMatch.name}`);
          
          const profile = await fbrefScraper.getPlayerProfile(bestMatch.fbrefId);
          if (profile) {
            playerData = { ...profile, fbrefId: bestMatch.fbrefId };
          }
        }
      }
      
      // If no external data, try AI enhancement
      if (!playerData) {
        console.log('No external data found, trying AI enhancement...');
        playerData = await aiService.enhancePlayerData(query);
      }
      
      if (playerData) {
        // Store the player
        // Check if player already exists to avoid duplicate key error
        if (playerData.transfermarktId) {
          try {
            const existingPlayers = await storage.searchPlayers(playerData.name);
            const existingPlayer = existingPlayers.find(p => 
              p.transfermarktId === playerData.transfermarktId || 
              p.name.toLowerCase() === playerData.name.toLowerCase()
            );
            
            if (existingPlayer) {
              console.log(`Player already exists: ${existingPlayer.name}`);
              return existingPlayer;
            }
          } catch (error) {
            console.log('Error checking for existing player');
          }
        }

        const storedPlayer = await storage.createPlayer(playerData);
        console.log(`Player stored with ID: ${storedPlayer.id}`);
        
        // Try to get and store comprehensive stats from FBR API first
        if (playerData.fbrId) {
          try {
            const stats = await fbrApi.getPlayerStats(playerData.fbrId);
            if (stats) {
              await storage.createPlayerStats({
                playerId: storedPlayer.id,
                season: '2024-2025',
                competition: 'All Competitions',
                ...stats
              });
            }
          } catch (statsError) {
            console.log('Could not fetch FBR API stats for player');
          }
        }

        // Try to get and store comprehensive stats from FBref if available
        if (playerData.fbrefId) {
          try {
            const stats = await fbrefScraper.getPlayerStats(playerData.fbrefId);
            if (stats.length > 0) {
              for (const statRecord of stats) {
                await storage.createPlayerStats({
                  ...statRecord,
                  playerId: storedPlayer.id
                });
              }
            }
            
            // Get detailed stats for better analysis
            const detailedStats = await fbrefScraper.getDetailedStats(playerData.fbrefId);
            if (detailedStats && Object.keys(detailedStats).length > 0) {
              // Store detailed stats as additional records
              if (detailedStats.shooting) {
                await storage.createPlayerStats({
                  playerId: storedPlayer.id,
                  season: '2024-2025',
                  competition: 'All Competitions',
                  ...detailedStats.shooting
                });
              }
            }
            
            // Get and store scouting report with percentiles
            if (playerData.position) {
              const percentileData = await fbrefScraper.getPlayerPercentiles(playerData.fbrefId, playerData.position);
              if (percentileData.percentiles && Object.keys(percentileData.percentiles).length > 0) {
                await storage.createScoutingReport({
                  playerId: storedPlayer.id,
                  season: '2024-2025',
                  competition: 'All Competitions',
                  position: playerData.position,
                  percentiles: percentileData.percentiles,
                  strengths: this.calculateStrengths(percentileData.percentiles),
                  weaknesses: this.calculateWeaknesses(percentileData.percentiles),
                  overallRating: this.calculateOverallRating(percentileData.percentiles)
                });
              }
            }
          } catch (statsError) {
            console.log('Could not fetch comprehensive stats for player');
          }
        }
        
        return storedPlayer;
      }
      
      return null;
    } catch (error) {
      console.error('Error in scrapeAndStorePlayer:', error);
      throw error;
    }
  }
  
  async updatePlayerData(playerId: number): Promise<void> {
    try {
      const player = await storage.getPlayer(playerId);
      if (!player || !player.fbrefId) {
        throw new Error('Player not found or missing FBref ID');
      }

      // Update player stats
      const stats = await fbrefScraper.getPlayerStats(player.fbrefId);
      if (stats.length > 0) {
        for (const statRecord of stats) {
          await storage.createPlayerStats({
            ...statRecord,
            playerId: player.id
          });
        }
      }
    } catch (error) {
      console.error('Error updating player data:', error);
      throw error;
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

export const scraper = new FootballDataScraper();