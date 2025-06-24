import { storage } from "../storage";
import { fbrefApi } from "./footballApi";
import { transfermarktApi } from "./transfermarktApi";
import { fbrefScraper } from "./fbrefScraper";
import { fbrApi } from "./fbrApi";
import { aggressiveFbrefMatcher } from "./aggressiveFbrefMatcher";
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
        
        // Immediately try to find FBref data for this player
        if (playerData) {
          try {
            const fbrefResults = await fbrefScraper.searchPlayer(playerData.name);
            if (fbrefResults.length > 0) {
              const fbrefMatch = fbrefResults[0];
              console.log(`Found matching FBref profile for: ${fbrefMatch.name}`);
              playerData.fbrefId = fbrefMatch.fbrefId;
              
              // Get complete FBref profile data
              const fbrefProfile = await fbrefScraper.getPlayerProfile(fbrefMatch.fbrefId);
              if (fbrefProfile) {
                playerData = { ...playerData, ...fbrefProfile };
              }
            }
          } catch (fbrefError) {
            console.log('Could not find FBref data for Transfermarkt player');
          }
        }
      }
      
      // Try FBref with enhanced scraper as primary fallback
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

      // Try FBR API for comprehensive data as secondary fallback
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
        
        // Aggressively try to get FBref data using multiple strategies
        let fbrefId = playerData.fbrefId;
        if (!fbrefId) {
          console.log(`Using aggressive FBref matching for: ${playerData.name}`);
          try {
            fbrefId = await aggressiveFbrefMatcher.findPlayerByMultipleStrategies(
              playerData.name,
              playerData.team,
              playerData.nationality,
              playerData.age
            );
            
            if (fbrefId) {
              console.log(`Aggressive search found FBref ID: ${fbrefId}`);
              // Update the stored player with fbrefId
              await storage.updatePlayer(storedPlayer.id, { fbrefId });
            }
          } catch (searchError) {
            console.log('Aggressive FBref search failed:', searchError);
          }
        }

        // Try to get and store comprehensive stats from FBref
        if (fbrefId) {
          try {
            console.log(`Fetching FBref stats for: ${playerData.name} (${fbrefId})`);
            
            const stats = await fbrefScraper.getPlayerStats(fbrefId);
            if (stats.length > 0) {
              console.log(`Found ${stats.length} stat records for ${playerData.name}`);
              for (const statRecord of stats) {
                await storage.createPlayerStats({
                  ...statRecord,
                  playerId: storedPlayer.id
                });
              }
            }
            
            // Get detailed stats for better analysis
            const detailedStats = await fbrefScraper.getDetailedStats(fbrefId);
            if (detailedStats && Object.keys(detailedStats).length > 0) {
              console.log(`Found detailed stats for ${playerData.name}`);
              
              // Store passing stats
              if (detailedStats.passing) {
                await storage.createPlayerStats({
                  playerId: storedPlayer.id,
                  season: '2024-2025',
                  competition: 'Detailed Passing',
                  ...detailedStats.passing
                });
              }
              
              // Store shooting stats
              if (detailedStats.shooting) {
                await storage.createPlayerStats({
                  playerId: storedPlayer.id,
                  season: '2024-2025',
                  competition: 'Detailed Shooting',
                  ...detailedStats.shooting
                });
              }
              
              // Store defensive stats
              if (detailedStats.defense) {
                await storage.createPlayerStats({
                  playerId: storedPlayer.id,
                  season: '2024-2025',
                  competition: 'Detailed Defense',
                  ...detailedStats.defense
                });
              }
            }
            
            // Get and store scouting report with percentiles
            if (playerData.position) {
              const percentileData = await fbrefScraper.getPlayerPercentiles(fbrefId, playerData.position);
              if (percentileData.percentiles && Object.keys(percentileData.percentiles).length > 0) {
                console.log(`Found percentile data for ${playerData.name}`);
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
            console.log('Could not fetch comprehensive FBref stats:', statsError);
          }
        }

        // Try FBR API as backup for stats
        if (playerData.fbrId) {
          try {
            const stats = await fbrApi.getPlayerStats(playerData.fbrId);
            if (stats) {
              await storage.createPlayerStats({
                playerId: storedPlayer.id,
                season: '2024-2025',
                competition: 'FBR API',
                ...stats
              });
            }
          } catch (statsError) {
            console.log('Could not fetch FBR API stats for player');
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
      if (!player) {
        throw new Error('Player not found');
      }

      let fbrefId = player.fbrefId;
      
      // If no FBref ID, use aggressive search
      if (!fbrefId) {
        console.log(`Using aggressive FBref search for: ${player.name}`);
        try {
          fbrefId = await aggressiveFbrefMatcher.findPlayerByMultipleStrategies(
            player.name,
            player.team,
            player.nationality,
            player.age
          );
          
          if (fbrefId) {
            console.log(`Aggressive search found FBref ID: ${fbrefId} for ${player.name}`);
            // Update player with fbrefId
            await storage.updatePlayer(playerId, { fbrefId });
          }
        } catch (searchError) {
          console.log('Aggressive FBref search failed during update:', searchError);
        }
      }

      if (!fbrefId) {
        throw new Error('No FBref ID available for this player');
      }

      // Update player stats from FBref
      console.log(`Updating stats for ${player.name} with FBref ID: ${fbrefId}`);
      
      const stats = await fbrefScraper.getPlayerStats(fbrefId);
      if (stats.length > 0) {
        console.log(`Found ${stats.length} stat records to update`);
        for (const statRecord of stats) {
          await storage.createPlayerStats({
            ...statRecord,
            playerId: player.id
          });
        }
      }

      // Update detailed stats
      const detailedStats = await fbrefScraper.getDetailedStats(fbrefId);
      if (detailedStats && Object.keys(detailedStats).length > 0) {
        console.log(`Updating detailed stats for ${player.name}`);
        
        if (detailedStats.passing) {
          await storage.createPlayerStats({
            playerId: player.id,
            season: '2024-2025',
            competition: 'Updated Passing',
            ...detailedStats.passing
          });
        }
        
        if (detailedStats.shooting) {
          await storage.createPlayerStats({
            playerId: player.id,
            season: '2024-2025',
            competition: 'Updated Shooting',
            ...detailedStats.shooting
          });
        }
        
        if (detailedStats.defense) {
          await storage.createPlayerStats({
            playerId: player.id,
            season: '2024-2025',
            competition: 'Updated Defense',
            ...detailedStats.defense
          });
        }
      }

      // Update scouting report if position is available
      if (player.position) {
        const percentileData = await fbrefScraper.getPlayerPercentiles(fbrefId, player.position);
        if (percentileData.percentiles && Object.keys(percentileData.percentiles).length > 0) {
          console.log(`Updating scouting report for ${player.name}`);
          await storage.createScoutingReport({
            playerId: player.id,
            season: '2024-2025',
            competition: 'Updated Report',
            position: player.position,
            percentiles: percentileData.percentiles,
            strengths: this.calculateStrengths(percentileData.percentiles),
            weaknesses: this.calculateWeaknesses(percentileData.percentiles),
            overallRating: this.calculateOverallRating(percentileData.percentiles)
          });
        }
      }

      console.log(`Successfully updated data for ${player.name}`);
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