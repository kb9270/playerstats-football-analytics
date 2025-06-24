import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scraper } from "./services/scraper";
import { pdfReportGenerator } from "./services/pdfReportGenerator";
import { soccerDataService } from "./services/soccerDataService";
import { enhancedSoccerDataService } from "./services/enhancedSoccerDataService";
import { aiService } from "./services/aiService";
import { insertPlayerSchema, insertComparisonSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Search players endpoint
  app.get("/api/players/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      // First search in local storage
      const localPlayers = await storage.searchPlayers(q);
      
      // If no local results, try external scraping with enhanced APIs
      if (localPlayers.length === 0) {
        try {
          const scrapedPlayer = await scraper.scrapeAndStorePlayer(q);
          if (scrapedPlayer) {
            return res.json([scrapedPlayer]);
          }
        } catch (scrapeError) {
          console.log('External scraping failed, returning local results only');
        }
      }
      
      return res.json(localPlayers);
      
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get player by ID
  app.get("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid player ID" });
      }
      
      const player = await storage.getPlayer(id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      res.json(player);
    } catch (error) {
      console.error('Get player error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get player stats
  app.get("/api/players/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { season } = req.query;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid player ID" });
      }
      
      const stats = await storage.getPlayerStats(id, season as string);
      res.json(stats);
    } catch (error) {
      console.error('Get player stats error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get scouting report
  app.get("/api/players/:id/scouting", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { season = '2024-2025' } = req.query;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid player ID" });
      }
      
      const report = await storage.getScoutingReport(id, season as string);
      
      if (!report) {
        // Try to generate scouting report by updating player data
        try {
          await scraper.updatePlayerData(id);
          const newReport = await storage.getScoutingReport(id, season as string);
          return res.json(newReport);
        } catch (updateError) {
          return res.status(404).json({ error: "Scouting report not available" });
        }
      }
      
      res.json(report);
    } catch (error) {
      console.error('Get scouting report error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create comparison
  app.post("/api/comparisons", async (req, res) => {
    try {
      const validatedData = insertComparisonSchema.parse(req.body);
      const comparison = await storage.createComparison(validatedData);
      res.json(comparison);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error('Create comparison error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get comparison data
  app.get("/api/comparisons/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid comparison ID" });
      }
      
      const comparison = await storage.getComparison(id);
      if (!comparison) {
        return res.status(404).json({ error: "Comparison not found" });
      }
      
      // Get player data for comparison
      const playerIds = comparison.playerIds as number[];
      const players = await Promise.all(
        playerIds.map(async (playerId) => {
          const player = await storage.getPlayer(playerId);
          const stats = await storage.getPlayerStatsBySeason(playerId, comparison.season, comparison.competition || undefined);
          return { player, stats };
        })
      );
      
      res.json({
        ...comparison,
        players: players.filter(p => p.player) // Filter out null players
      });
    } catch (error) {
      console.error('Get comparison error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update player data (refresh from external sources)
  app.post("/api/players/:id/update", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid player ID" });
      }
      
      console.log(`Updating player data for ID: ${id}`);
      await scraper.updatePlayerData(id);
      
      const updatedPlayer = await storage.getPlayer(id);
      res.json(updatedPlayer);
    } catch (error) {
      console.error('Update player error:', error);
      res.status(500).json({ error: error.message || "Failed to update player data" });
    }
  });

  // Force comprehensive analysis refresh using enhanced soccerdata
  app.post("/api/players/:id/refresh-precise", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid player ID" });
      }
      
      const player = await storage.getPlayer(id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      console.log(`Force refreshing comprehensive data for: ${player.name}`);
      
      // Ensure Python scripts exist
      await enhancedSoccerDataService.ensurePythonScriptExists();
      
      // Get comprehensive analysis
      const comprehensiveAnalysis = await enhancedSoccerDataService.getComprehensivePlayerAnalysis(
        player.name,
        player.team,
        player.league
      );
      
      let hasStats = false;
      let hasReport = false;
      
      if (comprehensiveAnalysis && comprehensiveAnalysis.success) {
        console.log(`✓ Got comprehensive analysis for ${player.name}`);
        
        // Store comprehensive stats
        const keyStats = comprehensiveAnalysis.key_stats;
        if (keyStats) {
          await storage.createPlayerStats({
            playerId: id,
            season: '2024-2025',
            competition: 'Comprehensive Analysis',
            goals: keyStats.goals,
            assists: keyStats.assists,
            shots: keyStats.shots,
            shotsOnTarget: keyStats.shots_on_target,
            passes: keyStats.pass_completion,
            tackles: keyStats.tackles,
            interceptions: keyStats.interceptions,
            rating: comprehensiveAnalysis.current_form?.rating || 7.0,
            source: 'enhanced_soccerdata'
          });
          hasStats = true;
        }
        
        // Create enhanced scouting report
        if (comprehensiveAnalysis.percentiles && player.position) {
          await storage.createScoutingReport({
            playerId: id,
            season: '2024-2025',
            competition: 'Comprehensive Analysis',
            position: player.position,
            percentiles: comprehensiveAnalysis.percentiles,
            strengths: comprehensiveAnalysis.strengths || [],
            weaknesses: comprehensiveAnalysis.weaknesses || [],
            overallRating: Math.round(Object.values(comprehensiveAnalysis.percentiles).reduce((a: number, b: number) => a + b, 0) / Object.keys(comprehensiveAnalysis.percentiles).length)
          });
          hasReport = true;
        }
        
        res.json({ 
          success: true, 
          hasStats, 
          hasReport,
          source: 'enhanced_soccerdata',
          analysis: comprehensiveAnalysis,
          message: `Successfully refreshed comprehensive data for ${player.name}`
        });
      } else {
        res.status(404).json({ error: "Could not find comprehensive data for this player" });
      }
    } catch (error) {
      console.error('Refresh comprehensive data error:', error);
      res.status(500).json({ error: error.message || "Failed to refresh comprehensive data" });
    }
  });

  // Generate PDF scouting report
  app.get("/api/players/:id/report/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid player ID" });
      }
      
      const player = await storage.getPlayer(id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      console.log(`Generating PDF report for: ${player.name}`);
      
      // Get player stats and scouting report
      const stats = await storage.getPlayerStats(id);
      const scoutingReport = await storage.getScoutingReport(id, '2024-2025');
      
      if (!scoutingReport) {
        return res.status(404).json({ error: "No scouting report available for this player" });
      }
      
      // Generate PDF
      const pdfBuffer = await pdfReportGenerator.generateScoutingReport(player, stats, scoutingReport);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-${player.name.replace(/\s+/g, '-')}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: "Failed to generate PDF report" });
    }
  });

  // Get comprehensive player analysis
  app.get("/api/players/:id/comprehensive-analysis", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid player ID" });
      }
      
      const player = await storage.getPlayer(id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      console.log(`Getting comprehensive analysis for: ${player.name}`);
      
      await enhancedSoccerDataService.ensurePythonScriptExists();
      
      const analysis = await enhancedSoccerDataService.getComprehensivePlayerAnalysis(
        player.name,
        player.team,
        player.league
      );
      
      if (analysis && analysis.success) {
        res.json(analysis);
      } else {
        res.status(404).json({ error: "Comprehensive analysis not available" });
      }
    } catch (error) {
      console.error('Error getting comprehensive analysis:', error);
      res.status(500).json({ error: "Failed to get comprehensive analysis" });
    }
  });

  // Get team analysis
  app.get("/api/teams/:teamName/analysis", async (req, res) => {
    try {
      const teamName = req.params.teamName;
      const league = req.query.league as string;
      
      console.log(`Getting team analysis for: ${teamName}`);
      
      await enhancedSoccerDataService.ensurePythonScriptExists();
      
      const analysis = await enhancedSoccerDataService.getTeamAnalysis(teamName, league);
      
      if (analysis && analysis.success) {
        res.json(analysis);
      } else {
        res.status(404).json({ error: "Team analysis not available" });
      }
    } catch (error) {
      console.error('Error getting team analysis:', error);
      res.status(500).json({ error: "Failed to get team analysis" });
    }
  });

  // Get position comparison
  app.get("/api/players/:id/position-comparison", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid player ID" });
      }
      
      const player = await storage.getPlayer(id);
      if (!player || !player.position) {
        return res.status(404).json({ error: "Player or position not found" });
      }
      
      console.log(`Getting position comparison for: ${player.name} (${player.position})`);
      
      await enhancedSoccerDataService.ensurePythonScriptExists();
      
      const comparison = await enhancedSoccerDataService.getPlayerComparison(
        player.name,
        player.position,
        player.league
      );
      
      if (comparison && comparison.success) {
        res.json(comparison);
      } else {
        res.status(404).json({ error: "Position comparison not available" });
      }
    } catch (error) {
      console.error('Error getting position comparison:', error);
      res.status(500).json({ error: "Failed to get position comparison" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
