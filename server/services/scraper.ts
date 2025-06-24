import { storage } from "../storage";
import { fbrefApi } from "./footballApi";
import { transfermarktApi } from "./transfermarktApi";
import { optimizedTransfermarktApi } from "./optimizedTransfermarktApi";
import { fbrefScraper } from "./fbrefScraper";
import { fbrApi } from "./fbrApi";
import { aggressiveFbrefMatcher } from "./aggressiveFbrefMatcher";
import { smartStatsCollector } from "./smartStatsCollector";
import { soccerDataService } from "./soccerDataService";
import { aiService } from "./aiService";

export class FootballDataScraper {
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeAndStorePlayer(query: string): Promise<any> {
    try {
      console.log(`Searching for player: ${query}`);
      
      let playerData = null;
      
      // Use optimized Transfermarkt search with multiple criteria
      const transfermarktResults = await optimizedTransfermarktApi.searchByMultipleCriteria(query);
      if (transfermarktResults.length > 0) {
        const bestMatch = transfermarktResults[0];
        console.log(`Found player on Optimized Transfermarkt: ${bestMatch.name} (score: ${bestMatch.matchScore})`);
        
        // Get detailed data from Transfermarkt
        if (bestMatch.transfermarktId) {
          const detailedData = await optimizedTransfermarktApi.getPlayerDetailsOptimized(bestMatch.transfermarktId);
          if (detailedData) {
            playerData = { ...bestMatch, ...detailedData };
          } else {
            playerData = bestMatch;
          }
        } else {
          playerData = bestMatch;
        }
        
        // Try to find FBref data using aggressive matcher
        if (playerData) {
          try {
            const fbrefId = await aggressiveFbrefMatcher.findPlayerByMultipleStrategies(
              playerData.name,
              playerData.team,
              playerData.nationality,
              playerData.age
            );
            
            if (fbrefId) {
              console.log(`Found matching FBref ID: ${fbrefId}`);
              playerData.fbrefId = fbrefId;
              
              // Get complete FBref profile data
              const fbrefProfile = await fbrefScraper.getPlayerProfile(fbrefId);
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
        
        // Ensure Python script exists
        await soccerDataService.ensurePythonScriptExists();

        // Use soccerdata for precise statistics
        console.log(`Using soccerdata for precise stats: ${playerData.name}`);
        try {
          const soccerDataStats = await soccerDataService.getPlayerDetailedStats(
            playerData.name,
            playerData.team,
            playerData.league
          );

          if (soccerDataStats && soccerDataStats.success) {
            console.log(`✓ Got precise soccerdata stats for ${playerData.name}`);
            
            // Store soccerdata stats
            await storage.createPlayerStats({
              playerId: storedPlayer.id,
              season: '2024-2025',
              competition: 'SoccerData Precise',
              ...soccerDataStats.player_stats,
              source: 'soccerdata'
            });

            // Get performance analysis
            if (playerData.position) {
              const performanceAnalysis = await soccerDataService.getPlayerPerformanceAnalysis(
                playerData.name,
                playerData.position
              );

              if (performanceAnalysis && performanceAnalysis.success) {
                console.log(`✓ Got performance analysis for ${playerData.name}`);
                
                // Create comprehensive scouting report
                await storage.createScoutingReport({
                  playerId: storedPlayer.id,
                  season: '2024-2025',
                  competition: 'SoccerData Analysis',
                  position: playerData.position,
                  percentiles: performanceAnalysis.percentiles,
                  strengths: this.calculateStrengths(performanceAnalysis.percentiles),
                  weaknesses: this.calculateWeaknesses(performanceAnalysis.percentiles),
                  overallRating: this.calculateOverallRating(performanceAnalysis.percentiles)
                });
              }
            }
          }
        } catch (soccerDataError) {
          console.log('SoccerData collection failed, falling back to smart collector:', soccerDataError);
        }

        // Use smart stats collector as fallback
        console.log(`Using smart stats collection for: ${playerData.name}`);
        try {
          const hasStats = await smartStatsCollector.collectPlayerStats(storedPlayer.id, playerData);
          if (hasStats) {
            console.log(`✓ Successfully collected stats for ${playerData.name}`);
          } else {
            console.log(`⚠ Could not collect comprehensive stats for ${playerData.name}`);
          }
        } catch (statsError) {
          console.log('Smart stats collection failed:', statsError);
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
      
      // Use smart stats collector for comprehensive update
      console.log(`Smart update for: ${player.name}`);
      
      const hasStats = await smartStatsCollector.collectPlayerStats(playerId, player);
      if (!hasStats) {
        // If smart collection fails, try to at least find FBref ID
        let fbrefId = player.fbrefId;
        
        if (!fbrefId) {
          console.log(`Trying aggressive FBref search for: ${player.name}`);
          try {
            fbrefId = await aggressiveFbrefMatcher.findPlayerByMultipleStrategies(
              player.name,
              player.team,
              player.nationality,
              player.age
            );
            
            if (fbrefId) {
              console.log(`Found FBref ID: ${fbrefId} for ${player.name}`);
              await storage.updatePlayer(playerId, { fbrefId });
              
              // Try again with the new FBref ID
              const retryHasStats = await smartStatsCollector.collectPlayerStats(playerId, { ...player, fbrefId });
              if (retryHasStats) {
                console.log(`✓ Retry successful for ${player.name}`);
                return;
              }
            }
          } catch (searchError) {
            console.log('Aggressive search failed during update:', searchError);
          }
        }
        
        if (!hasStats) {
          throw new Error('Could not collect any stats for this player');
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