import { storage } from "../storage";
import { fbrefApi } from "./footballApi";
import { transfermarktApi } from "./transfermarktApi";
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
      
      // Try FBref as fallback/enhancement
      if (!playerData) {
        const fbrefResults = await fbrefApi.searchPlayers(query);
        if (fbrefResults.length > 0) {
          const bestMatch = fbrefResults[0];
          console.log(`Found player on FBref: ${bestMatch.name}`);
          
          playerData = await fbrefApi.getPlayerProfile(bestMatch.fbrefId);
          if (playerData) {
            playerData.fbrefId = bestMatch.fbrefId;
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
        const storedPlayer = await storage.createPlayer(playerData);
        console.log(`Player stored with ID: ${storedPlayer.id}`);
        
        // Try to get and store stats from FBref if available
        if (playerData.fbrefId) {
          try {
            const stats = await fbrefApi.getPlayerStats(playerData.fbrefId);
            if (stats.length > 0) {
              for (const statRecord of stats) {
                await storage.createPlayerStats({
                  ...statRecord,
                  playerId: storedPlayer.id
                });
              }
            }
          } catch (statsError) {
            console.log('Could not fetch stats for player');
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
      const stats = await fbrefApi.getPlayerStats(player.fbrefId);
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
}

export const scraper = new FootballDataScraper();