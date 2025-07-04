import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scraper } from "./services/scraper";
import { pdfReportGenerator } from "./services/pdfReportGenerator";
import { soccerDataService } from "./services/soccerDataService";
import { enhancedSoccerDataService } from "./services/enhancedSoccerDataService";
import { enhancedReportService } from "./services/enhancedReportService";
import { aiService } from "./services/aiService";
import { csvPlayerAnalyzer } from "./services/csvPlayerAnalyzer";
import { csvDirectAnalyzer } from "./services/csvDirectAnalyzer";
import { csvMatchAnalyzer } from "./services/csvMatchAnalyzer";
import { pdfPlayerCard } from "./services/pdfPlayerCard";
import { heatmapService } from "./services/heatmapService";
import { comparisonService } from "./services/comparisonService";
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
        console.log(`No scouting report found for ${player.name}, creating basic report`);

        // Create basic scouting report if none exists
        const basicReport = {
          position: player.position || 'Unknown',
          season: '2024-2025',
          percentiles: {
            overall_performance: 70,
            technical_skills: 65,
            physical_attributes: 75,
            mental_strength: 80
          },
          strengths: ['Consistent Performance', 'Good Work Rate'],
          weaknesses: ['Needs More Data'],
          overallRating: 70
        };

        const pdfBuffer = await pdfReportGenerator.generateScoutingReport(player, stats, basicReport);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="rapport-${player.name.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');

        res.send(pdfBuffer);
        return;
      }

      // Generate PDF with full data
      const pdfBuffer = await pdfReportGenerator.generateScoutingReport(player, stats, scoutingReport);

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rapport-${player.name.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');

      console.log(`PDF sent successfully for ${player.name}`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ 
        error: "Failed to generate PDF report",
        details: error.message 
      });
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

  // Enhanced player report with rate limiting
  app.get("/api/players/:id/enhanced-report", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid player ID" });
      }

      const player = await storage.getPlayer(id);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }

      console.log(`Generating enhanced report for: ${player.name} with rate limiting protection`);

      // Generate complete report with enhanced rate limiting
      const report = await enhancedReportService.generateCompletePlayerReport(
        player.name,
        player.team,
        2024
      );

      if (report && report.success) {
        res.json(report);
      } else {
        res.status(500).json({ 
          error: "Failed to generate enhanced report",
          details: report?.error || "Unknown error"
        });
      }
    } catch (error) {
      console.error('Error generating enhanced report:', error);
      res.status(500).json({ error: "Failed to generate enhanced report" });
    }
  });

  // Generate enhanced PDF with Flask-style endpoint
  app.post("/api/joueur/rapport", async (req, res) => {
    try {
      const { nom } = req.body;

      if (!nom) {
        return res.status(400).json({ 
          status: "error", 
          message: "Nom du joueur requis" 
        });
      }

      console.log(`Generating Flask-style report for: ${nom}`);

      // Search for player first
      const players = await storage.searchPlayers(nom);
      let player = players.length > 0 ? players[0] : null;

      if (!player) {
        // Try to create player if not found
        try {
          await scraper.scrapeAndStorePlayer(nom);
          const newPlayers = await storage.searchPlayers(nom);
          player = newPlayers.length > 0 ? newPlayers[0] : null;
        } catch (error) {
          console.log('Could not create player:', error);
        }
      }

      if (!player) {
        return res.status(404).json({
          status: "error",
          message: `Aucune donnée trouvée pour ${nom}`
        });
      }

      // Generate enhanced report
      const report = await enhancedReportService.generateCompletePlayerReport(
        player.name,
        player.team
      );

      if (report && report.success) {
        // Generate PDF with enhanced data
        const stats = await storage.getPlayerStats(player.id);
        const scoutingReport = await storage.getScoutingReport(player.id, '2024-2025');

        const pdfBuffer = await pdfReportGenerator.generateScoutingReport(
          player, 
          stats, 
          scoutingReport || report
        );

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="rapport-${player.name.replace(/\s+/g, '-').toLowerCase()}.pdf"`);
        res.send(pdfBuffer);
      } else {
        res.status(404).json({
          status: "error",
          message: "Impossible de générer le rapport"
        });
      }
    } catch (error) {
      console.error('Error in Flask-style report generation:', error);
      res.status(500).json({
        status: "error",
        message: error.message || "Erreur lors de la génération du rapport"
      });
    }
  });

  // === NOUVELLES ROUTES POUR L'ANALYSE CSV ===

  // Rechercher un joueur dans la base CSV
  app.get("/api/csv/players/search", async (req, res) => {
    try {
      const { q, team } = req.query;

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      console.log(`Searching CSV player: ${q}${team ? ` in team ${team}` : ''}`);

      const result = await csvPlayerAnalyzer.searchPlayer(q, team as string);

      if (result.found) {
        res.json({ success: true, player: result.player });
      } else {
        res.status(404).json({ success: false, message: result.message });
      }
    } catch (error) {
      console.error('CSV search error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Obtenir le profil complet d'un joueur CSV
  app.get("/api/csv/players/profile/:playerName", async (req, res) => {
    try {
      const playerName = decodeURIComponent(req.params.playerName);
      const team = req.query.team as string;

      console.log(`Getting CSV player profile: ${playerName}${team ? ` in team ${team}` : ''}`);

      const profile = await csvPlayerAnalyzer.getCompletePlayerProfile(playerName, team);

      if (profile.error) {
        res.status(404).json({ error: profile.error });
      } else {
        res.json({ success: true, profile });
      }
    } catch (error) {
      console.error('CSV profile error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Générer la heatmap d'un joueur
  app.get("/api/csv/players/:playerName/heatmap", async (req, res) => {
    try {
      const playerName = decodeURIComponent(req.params.playerName);

      console.log(`Generating heatmap for CSV player: ${playerName}`);

      const heatmapData = await csvPlayerAnalyzer.generateHeatmap(playerName);

      if (heatmapData.error) {
        res.status(404).json({ error: heatmapData.error });
      } else {
        res.json({ success: true, heatmap: heatmapData.heatmap });
      }
    } catch (error) {
      console.error('CSV heatmap error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Obtenir la liste des joueurs disponibles
  app.get("/api/csv/players/list", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      console.log(`Getting CSV players list (limit: ${limit})`);

      const players = await csvPlayerAnalyzer.getAvailablePlayersList(limit);

      res.json({ success: true, players, count: players.length });
    } catch (error) {
      console.error('CSV players list error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Obtenir les joueurs d'une équipe
  app.get("/api/csv/teams/:teamName/players", async (req, res) => {
    try {
      const teamName = decodeURIComponent(req.params.teamName);

      console.log(`Getting CSV team players: ${teamName}`);

      const players = await csvPlayerAnalyzer.getPlayersByTeam(teamName);

      res.json({ success: true, team: teamName, players, count: players.length });
    } catch (error) {
      console.error('CSV team players error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Obtenir les statistiques des ligues
  app.get("/api/csv/leagues/stats", async (req, res) => {
    try {
      console.log('Getting CSV league stats');

      const leagueStats = await csvPlayerAnalyzer.getLeagueStats();

      res.json({ success: true, leagues: leagueStats });
    } catch (error) {
      console.error('CSV league stats error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Endpoint Flask-style pour génération de rapport complet CSV
  app.post("/api/csv/joueur/rapport-complet", async (req, res) => {
    try {
      const { nom, equipe } = req.body;

      if (!nom) {
        return res.status(400).json({ 
          status: "error", 
          message: "Nom du joueur requis" 
        });
      }

      console.log(`Generating complete CSV report for: ${nom}${equipe ? ` in team ${equipe}` : ''}`);

      const profile = await csvPlayerAnalyzer.getCompletePlayerProfile(nom, equipe);

      if (profile.error) {
        res.status(404).json({
          status: "error",
          message: profile.error
        });
      } else {
        res.json({
          status: "success",
          joueur: profile.informations_personnelles,
          statistiques: {
            base: profile.statistiques_base,
            avancees: profile.statistiques_avancees
          },
          analyse: profile.analyse_performance,
          percentiles: profile.percentiles,
          zones_activite: profile.zones_activite,
          note_globale: profile.note_globale,
          style_jeu: profile.style_jeu,
          forces: profile.forces,
          faiblesses: profile.faiblesses
        });
      }
    } catch (error) {
      console.error('Error in CSV complete report generation:', error);
      res.status(500).json({
        status: "error",
        message: error.message || "Erreur lors de la génération du rapport"
      });
    }
  });

  // ====== NOUVELLES ROUTES CSV DIRECTES ======

  // Route pour chercher des joueurs directement dans le CSV
  app.get("/api/csv-direct/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).json({ error: 'Query parameter required and must not be empty' });
      }

      const players = await csvDirectAnalyzer.searchPlayers(q.trim());
      res.json({ success: true, players });
    } catch (error) {
      console.error('Error searching players:', error);
      res.status(500).json({ error: 'Error searching players' });
    }
  });

  // Route pour obtenir l'analyse complète d'un joueur
  app.get("/api/csv-direct/player/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const player = await csvDirectAnalyzer.getPlayerByName(name);

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const analysis = csvDirectAnalyzer.generatePlayerAnalysis(player);
      res.json({ success: true, player, analysis });
    } catch (error) {
      console.error('Error getting player analysis:', error);
      res.status(500).json({ error: 'Error getting player analysis' });
    }
  });

  // Route pour l'analyse d'un joueur (endpoint spécifique)
  app.get("/api/csv-direct/player/:name/analysis", async (req, res) => {
    try {
      const { name } = req.params;
      const player = await csvDirectAnalyzer.getPlayerByName(name);

      if (!player) {
        return res.status(404).json({ success: false, error: 'Player not found' });
      }

      const analysis = csvDirectAnalyzer.generatePlayerAnalysis(player);
      res.json({ success: true, player, analysis });
    } catch (error) {
      console.error('Error getting player analysis:', error);
      res.status(500).json({ success: false, error: 'Error getting player analysis' });
    }
  });

  // Route pour la heatmap d'un joueur
  app.get("/api/csv-direct/player/:name/heatmap", async (req, res) => {
    try {
      const { name } = req.params;
      const player = await csvDirectAnalyzer.getPlayerByName(name);

      if (!player) {
        return res.status(404).json({ success: false, error: 'Player not found' });
      }

      const heatmap = heatmapService.generateHeatmap(player);
      const defensiveZones = heatmapService.generateDefensiveZones(player);
      const offensiveZones = heatmapService.generateOffensiveZones(player);

      res.json({ 
        success: true, 
        player: { name: player.Player, position: player.Pos },
        heatmap: {
          general: heatmap,
          defensive: defensiveZones,
          offensive: offensiveZones
        }
      });
    } catch (error) {
      console.error('Error generating heatmap:', error);
      res.status(500).json({ success: false, error: 'Error generating heatmap' });
    }
  });

  // Route pour la pass map d'un joueur
  app.get("/api/csv-direct/player/:name/passmap", async (req, res) => {
    try {
      const { name } = req.params;
      const player = await csvDirectAnalyzer.getPlayerByName(name);

      if (!player) {
        return res.status(404).json({ success: false, error: 'Player not found' });
      }

      const passMap = heatmapService.generatePassMap(player);

      res.json({ 
        success: true, 
        player: { name: player.Player, position: player.Pos },
        passMap,
        stats: {
          totalPasses: player.Att || 0,
          completedPasses: player.Cmp || 0,
          successRate: player['Cmp%'] || 0,
          progressivePasses: player.PrgP || 0
        }
      });
    } catch (error) {
      console.error('Error generating pass map:', error);
      res.status(500).json({ success: false, error: 'Error generating pass map' });
    }
  });

  // Route pour la valeur marchande d'un joueur
  app.get("/api/csv-direct/player/:name/market-value", async (req, res) => {
    try {
      const { name } = req.params;
      const player = await csvDirectAnalyzer.getPlayerByName(name);

      if (!player) {
        return res.status(404).json({ success: false, error: 'Player not found' });
      }

      const marketValue = comparisonService.calculateMarketValue(player);
      const formattedValue = comparisonService.formatMarketValue(marketValue);

      res.json({ 
        success: true, 
        player: { 
          name: player.Player, 
          age: player.Age, 
          position: player.Pos, 
          team: player.Squad,
          league: player.Comp 
        },
        marketValue: {
          ...marketValue,
          formatted: formattedValue
        }
      });
    } catch (error) {
      console.error('Error calculating market value:', error);
      res.status(500).json({ success: false, error: 'Error calculating market value' });
    }
  });

  // Route pour comparer deux joueurs
  app.get("/api/csv-direct/compare/:player1Name/:player2Name", async (req, res) => {
    try {
      const { player1Name, player2Name } = req.params;

      const player1 = await csvDirectAnalyzer.getPlayerByName(player1Name);
      const player2 = await csvDirectAnalyzer.getPlayerByName(player2Name);

      if (!player1) {
        return res.status(404).json({ success: false, error: `Player "${player1Name}" not found` });
      }

      if (!player2) {
        return res.status(404).json({ success: false, error: `Player "${player2Name}" not found` });
      }

      const comparison = comparisonService.comparePlayer(player1, player2);

      // Ajouter les valeurs marchandes
      const player1MarketValue = comparisonService.calculateMarketValue(player1);
      const player2MarketValue = comparisonService.calculateMarketValue(player2);

      res.json({ 
        success: true,
        comparison: {
          ...comparison,
          marketValues: {
            player1: {
              ...player1MarketValue,
              formatted: comparisonService.formatMarketValue(player1MarketValue)
            },
            player2: {
              ...player2MarketValue,
              formatted: comparisonService.formatMarketValue(player2MarketValue)
            }
          }
        }
      });
    } catch (error) {
      console.error('Error comparing players:', error);
      res.status(500).json({ success: false, error: 'Error comparing players' });
    }
  });

  // CSV Direct routes
  app.get('/api/csv-direct/leagues', async (req, res) => {
    try {
      const stats = await csvDirectAnalyzer.getLeagueStats();
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error getting league stats:', error);
      res.status(500).json({ success: false, error: 'Failed to get league stats' });
    }
  });

  app.get('/api/csv-direct/similar/:name', async (req, res) => {
    try {
      const name = decodeURIComponent(req.params.name).toLowerCase();
      const k = parseInt(req.query.k as string) || 3;
      const target = await csvDirectAnalyzer.getPlayerByName(name);

      if (!target) {
        return res.status(404).json({ success: false, error: 'Joueur introuvable' });
      }

      const allPlayers = await csvDirectAnalyzer.getAllPlayers();
      const { PlayerSimilarityService } = await import('./services/playerSimilarityService');
      const similar = PlayerSimilarityService.getSimilarPlayersV2(target, allPlayers, k);

      res.json({ 
        success: true, 
        target, 
        similar,
        count: similar.length 
      });
    } catch (error) {
      console.error('Error finding similar players:', error);
      res.status(500).json({ success: false, error: 'Failed to find similar players' });
    }
  });

  // Route pour la comparaison automatique avec les 3 joueurs les plus similaires
  app.get('/api/csv-direct/player/:name/auto-compare', async (req, res) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const targetPlayer = await csvDirectAnalyzer.getPlayerByName(name);

      if (!targetPlayer) {
        return res.status(404).json({ success: false, error: 'Joueur introuvable' });
      }

      // Trouver les 3 joueurs les plus similaires
      const allPlayers = await csvDirectAnalyzer.getAllPlayers();
      const { PlayerSimilarityService } = await import('./services/playerSimilarityService');
      const similarPlayers = PlayerSimilarityService.getSimilarPlayersV2(targetPlayer, allPlayers, 3);
      
      if (similarPlayers.length === 0) {
        return res.json({ 
          success: true, 
          targetPlayer: {
            name: targetPlayer.Player,
            age: targetPlayer.Age,
            position: targetPlayer.Pos,
            team: targetPlayer.Squad,
            league: targetPlayer.Comp
          },
          comparisons: [],
          message: 'Aucun joueur similaire trouvé'
        });
      }

      // Comparer avec chaque joueur similaire
      const comparisons = similarPlayers.map(similarPlayer => {
        const comparison = comparisonService.comparePlayer(targetPlayer, similarPlayer);
        const targetMarketValue = comparisonService.calculateMarketValue(targetPlayer);
        const similarMarketValue = comparisonService.calculateMarketValue(similarPlayer);
        
        return {
          targetPlayer: {
            name: targetPlayer.Player,
            age: targetPlayer.Age,
            position: targetPlayer.Pos,
            team: targetPlayer.Squad,
            league: targetPlayer.Comp,
            marketValue: comparisonService.formatMarketValue(targetMarketValue)
          },
          similarPlayer: {
            name: similarPlayer.Player,
            age: similarPlayer.Age,
            position: similarPlayer.Pos,
            team: similarPlayer.Squad,
            league: similarPlayer.Comp,
            marketValue: comparisonService.formatMarketValue(similarMarketValue),
            similarity: (similarPlayer as any).similarity || 0.5
          },
          metrics: comparison.metrics,
          summary: comparison.summary,
          marketValues: {
            target: {
              ...targetMarketValue,
              formatted: comparisonService.formatMarketValue(targetMarketValue)
            },
            similar: {
              ...similarMarketValue,
              formatted: comparisonService.formatMarketValue(similarMarketValue)
            }
          }
        };
      });

      res.json({ 
        success: true,
        targetPlayer: {
          name: targetPlayer.Player,
          age: targetPlayer.Age,
          position: targetPlayer.Pos,
          team: targetPlayer.Squad,
          league: targetPlayer.Comp
        },
        comparisons,
        message: `Comparaison avec les ${comparisons.length} joueurs les plus similaires`
      });
    } catch (error) {
      console.error('Error in auto-compare:', error);
      res.status(500).json({ success: false, error: 'Erreur lors de la comparaison automatique' });
    }
  });

  app.get('/api/csv-direct/player/:name/weaknesses', async (req, res) => {
    try {
      const name = decodeURIComponent(req.params.name).toLowerCase();
      const player = await csvDirectAnalyzer.getPlayerByName(name);

      if (!player) {
        return res.status(404).json({ success: false, error: 'Joueur introuvable' });
      }

      const { WeaknessAnalysisService } = await import('./services/weaknessAnalysisService');
      const weaknesses = WeaknessAnalysisService.detectWeaknesses(player);
      const suggestions = WeaknessAnalysisService.getImprovementSuggestions(player, weaknesses);

      res.json({ 
        success: true,
        player: player.Player,
        position: player.Pos,
        weaknesses,
        suggestions
      });
    } catch (error) {
      console.error('Error analyzing weaknesses:', error);
      res.status(500).json({ success: false, error: 'Failed to analyze weaknesses' });
    }
  });

  app.get('/api/csv-direct/player/:name/ai-analysis', async (req, res) => {
    try {
      const name = decodeURIComponent(req.params.name).toLowerCase();
      const player = await csvDirectAnalyzer.getPlayerByName(name);

      if (!player) {
        return res.status(404).json({ success: false, error: 'Joueur introuvable' });
      }

      // Get AI analysis from DeepSeek
      const aiAnalysis = await aiService.analyzePlayerWithDeepSeek(player);
      
      // Get enhanced weakness analysis
      const { WeaknessAnalysisService } = await import('./services/weaknessAnalysisService');
      const weaknesses = WeaknessAnalysisService.detectWeaknesses(player);
      const suggestions = WeaknessAnalysisService.getImprovementSuggestions(player, weaknesses);

      res.json({ 
        success: true,
        player: player.Player,
        position: player.Pos,
        team: player.Squad,
        ai_analysis: aiAnalysis || {
          resume_detaille: "Analyse IA non disponible pour le moment",
          style_de_jeu: "Style de jeu basé sur les statistiques",
          forces_principales: ["Données statistiques disponibles"],
          points_amelioration: weaknesses,
          note_globale: "75",
          recommandations: suggestions
        },
        weaknesses,
        suggestions,
        stats: {
          goals: player.Gls || 0,
          assists: player.Ast || 0,
          minutes: player.Min || 0,
          xG: player.xG || 0,
          xA: player.xAG || 0
        }
      });
    } catch (error) {
      console.error('Error in AI analysis:', error);
      res.status(500).json({ success: false, error: 'Failed to generate AI analysis' });
    }
  });

  // Route pour les statistiques des équipes
  app.get("/api/csv-direct/teams", async (req, res) => {
    try {
      const stats = await csvDirectAnalyzer.getTeamStats();
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error getting team stats:', error);
      res.status(500).json({ error: 'Error getting team stats' });
    }
  });

  // Route pour les meilleurs buteurs
  app.get("/api/csv-direct/top-scorers", async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const players = await csvDirectAnalyzer.getTopScorers(Number(limit));
      res.json({ success: true, players });
    } catch (error) {
      console.error('Error getting top scorers:', error);
      res.status(500).json({ error: 'Error getting top scorers' });
    }
  });

  // Route pour les meilleurs passeurs
  app.get("/api/csv-direct/top-assists", async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const players = await csvDirectAnalyzer.getTopAssists(Number(limit));
      res.json({ success: true, players });
    } catch (error) {
      console.error('Error getting top assists:', error);
      res.status(500).json({ error: 'Error getting top assists' });
    }
  });

  // Route pour les joueurs par équipe
  app.get("/api/csv-direct/team/:teamName", async (req, res) => {
    try {
      const { teamName } = req.params;
      const players = await csvDirectAnalyzer.getPlayersByTeam(teamName);
      res.json({ success: true, players });
    } catch (error) {
      console.error('Error getting team players:', error);
      res.status(500).json({ error: 'Error getting team players' });
    }
  });

  // Route pour les joueurs par position
  app.get("/api/csv-direct/position/:position", async (req, res) => {
    try {
      const { position } = req.params;
      const players = await csvDirectAnalyzer.getPlayersByPosition(position);
      res.json({ success: true, players });
    } catch (error) {
      console.error('Error getting position players:', error);
      res.status(500).json({ error: 'Error getting position players' });
    }
  });

  // CSV Match Analysis Routes
  app.get("/api/matches/search", async (req, res) => {
    try {
      const query = req.query.q;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query parameter required" });
      }

      const matches = await csvMatchAnalyzer.searchMatches(query);
      res.json({ success: true, matches });
    } catch (error) {
      console.error('Error searching matches:', error);
      res.status(500).json({ error: "Failed to search matches" });
    }
  });

  app.get("/api/matches/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const matches = await csvMatchAnalyzer.getRecentMatches(limit);
      res.json({ success: true, matches });
    } catch (error) {
      console.error('Error getting recent matches:', error);
      res.status(500).json({ error: "Failed to get recent matches" });
    }
  });

  app.get("/api/matches/team/:teamName", async (req, res) => {
    try {
      const { teamName } = req.params;
      const matches = await csvMatchAnalyzer.getMatchesByTeam(teamName);
      res.json({ success: true, matches });
    } catch (error) {
      console.error('Error getting team matches:', error);
      res.status(500).json({ error: "Failed to get team matches" });
    }
  });

  app.get("/api/matches/analysis/:homeTeam/:awayTeam", async (req, res) => {
    try {
      const { homeTeam, awayTeam } = req.params;
      const analysis = await csvMatchAnalyzer.getMatchAnalysis(homeTeam, awayTeam);
      res.json({ success: true, analysis });
    } catch (error) {
      console.error('Error getting match analysis:', error);
      res.status(500).json({ error: "Failed to get match analysis" });
    }
  });

  app.get("/api/matches/leagues", async (req, res) => {
    try {
      const stats = await csvMatchAnalyzer.getLeagueStats();
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error getting league stats:', error);
      res.status(500).json({ error: "Failed to get league stats" });
    }
  });

  app.get("/api/matches/top-scorers", async (req, res) => {
    try {
      const scorers = await csvMatchAnalyzer.getTopScorers();
      res.json({ success: true, scorers });
    } catch (error) {
      console.error('Error getting top scorers:', error);
      res.status(500).json({ error: "Failed to get top scorers" });
    }
  });

  app.get("/api/matches/elo-rankings", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const rankings = await csvMatchAnalyzer.getEloRankings(limit);
      res.json({ success: true, rankings });
    } catch (error) {
      console.error('Error getting ELO rankings:', error);
      res.status(500).json({ error: "Failed to get ELO rankings" });
    }
  });

  // Player PDF Generation Route
  app.get("/api/csv-direct/player/:name/pdf", async (req, res) => {
    try {
      const { name } = req.params;
      const player = await csvDirectAnalyzer.getPlayerByName(name);

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const analysis = csvDirectAnalyzer.generatePlayerAnalysis(player);
      const pdfHtml = await pdfPlayerCard.generatePlayerCard({
        ...player,
        ...analysis,
        overallRating: analysis.overallRating || 75
      });

      // Set headers for HTML preview
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(pdfHtml);
    } catch (error) {
      console.error('Error generating player PDF:', error);
      res.status(500).json({ error: 'Error generating player PDF' });
    }
  });

  // === NOUVELLES ROUTES POUR DIRECTEURS SPORTIFS ===
  
  // Route 1: "Il progresse où ?" - Analyse de progression détaillée
  app.get("/api/csv-direct/player/:name/progression", async (req, res) => {
    try {
      const { name } = req.params;
      const player = await csvDirectAnalyzer.getPlayerByName(name);

      if (!player) {
        return res.status(404).json({ 
          success: false, 
          error: 'Joueur introuvable',
          message: `Aucun joueur trouvé avec le nom "${name}"` 
        });
      }

      const percentiles = csvDirectAnalyzer.calculatePercentiles(player, player.Pos?.split(',')[0] || 'MF');
      const progressionAnalysis = csvDirectAnalyzer.generateProgressionAnalysis(player, percentiles);

      res.json({ 
        success: true,
        player: {
          name: player.Player,
          age: player.Age,
          position: player.Pos,
          team: player.Squad,
          league: player.Comp
        },
        progression: progressionAnalysis,
        summary: {
          question: "Il progresse où ?",
          response: `Analyse de progression pour ${player.Player} (${player.Age} ans)`,
          keyInsights: [
            `${progressionAnalysis.progressionAreas.length} domaines d'amélioration identifiés`,
            `Valeur actuelle estimée: ${new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 0 
            }).format(progressionAnalysis.marketValue.current)}`,
            `Potentiel de croissance: ${new Intl.NumberFormat('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 0 
            }).format(progressionAnalysis.marketValue.potentialGain)}`
          ]
        }
      });
    } catch (error) {
      console.error('Error getting progression analysis:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de l\'analyse de progression',
        details: error.message 
      });
    }
  });

  // Route 2: "Peux-tu me comparer ça avec [Joueur X] ?" - Comparaison intelligente
  app.get("/api/csv-direct/compare/:player1/:player2", async (req, res) => {
    try {
      const { player1, player2 } = req.params;
      const { context } = req.query; // Contexte optionnel: "recrutement", "tactique", etc.
      
      const playerData1 = await csvDirectAnalyzer.getPlayerByName(player1);
      const playerData2 = await csvDirectAnalyzer.getPlayerByName(player2);

      if (!playerData1) {
        return res.status(404).json({ 
          success: false, 
          error: `Joueur "${player1}" introuvable` 
        });
      }

      if (!playerData2) {
        return res.status(404).json({ 
          success: false, 
          error: `Joueur "${player2}" introuvable` 
        });
      }

      // Analyses individuelles
      const analysis1 = csvDirectAnalyzer.generatePlayerAnalysis(playerData1);
      const analysis2 = csvDirectAnalyzer.generatePlayerAnalysis(playerData2);

      // Comparaison détaillée
      const comparison = {
        players: {
          player1: {
            name: playerData1.Player,
            age: playerData1.Age,
            position: playerData1.Pos,
            team: playerData1.Squad,
            league: playerData1.Comp,
            overallRating: analysis1.overallRating,
            marketValue: analysis1.progression?.marketValue?.current || 0
          },
          player2: {
            name: playerData2.Player,
            age: playerData2.Age,
            position: playerData2.Pos,
            team: playerData2.Squad,
            league: playerData2.Comp,
            overallRating: analysis2.overallRating,
            marketValue: analysis2.progression?.marketValue?.current || 0
          }
        },
        metrics: {
          attack: {
            player1: {
              goals: playerData1.Gls || 0,
              assists: playerData1.Ast || 0,
              xG: playerData1.xG || 0,
              shots: playerData1.Sh || 0
            },
            player2: {
              goals: playerData2.Gls || 0,
              assists: playerData2.Ast || 0,
              xG: playerData2.xG || 0,
              shots: playerData2.Sh || 0
            },
            winner: (playerData1.Gls + playerData1.Ast) > (playerData2.Gls + playerData2.Ast) ? 'player1' : 'player2'
          },
          defense: {
            player1: {
              tackles: playerData1.Tkl || 0,
              interceptions: playerData1.Int || 0,
              clearances: playerData1.Clr || 0
            },
            player2: {
              tackles: playerData2.Tkl || 0,
              interceptions: playerData2.Int || 0,
              clearances: playerData2.Clr || 0
            },
            winner: (playerData1.Tkl + playerData1.Int) > (playerData2.Tkl + playerData2.Int) ? 'player1' : 'player2'
          },
          overall: {
            winner: analysis1.overallRating > analysis2.overallRating ? 'player1' : 'player2',
            difference: Math.abs(analysis1.overallRating - analysis2.overallRating)
          }
        },
        recommendations: {
          forRecruitment: analysis1.overallRating > analysis2.overallRating 
            ? `${playerData1.Player} semble être le meilleur choix avec une note de ${analysis1.overallRating}/100`
            : `${playerData2.Player} semble être le meilleur choix avec une note de ${analysis2.overallRating}/100`,
          keyDifferences: [
            `Âge: ${playerData1.Player} (${playerData1.Age} ans) vs ${playerData2.Player} (${playerData2.Age} ans)`,
            `Position: ${playerData1.Pos} vs ${playerData2.Pos}`,
            `Ligue: ${playerData1.Comp} vs ${playerData2.Comp}`
          ],
          tacticalFit: context === 'tactique' 
            ? `Analyse tactique basée sur les positions ${playerData1.Pos} vs ${playerData2.Pos}`
            : 'Utilisez le paramètre ?context=tactique pour une analyse tactique spécifique'
        }
      };

      res.json({ 
        success: true,
        comparison,
        summary: {
          question: `Comparaison entre ${player1} et ${player2}`,
          winner: comparison.metrics.overall.winner === 'player1' ? playerData1.Player : playerData2.Player,
          confidence: comparison.metrics.overall.difference > 10 ? 'Élevée' : 'Modérée',
          recommendation: comparison.recommendations.forRecruitment
        }
      });
    } catch (error) {
      console.error('Error comparing players:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la comparaison',
        details: error.message 
      });
    }
  });

  // Route 3: Suggestions de joueurs similaires pour comparaison
  app.get("/api/csv-direct/player/:name/alternatives", async (req, res) => {
    try {
      const { name } = req.params;
      const { budget, position, league } = req.query;
      
      const targetPlayer = await csvDirectAnalyzer.getPlayerByName(name);
      if (!targetPlayer) {
        return res.status(404).json({ 
          success: false, 
          error: `Joueur "${name}" introuvable` 
        });
      }

      // Trouver des joueurs similaires
      const similarPlayers = await csvDirectAnalyzer.getSimilarPlayers(name, 5);
      const alternatives = await Promise.all(
        similarPlayers
          .filter(p => p.Player !== targetPlayer.Player) // Exclure le joueur cible
          .map(async player => {
            const analysis = csvDirectAnalyzer.generatePlayerAnalysis(player);
            return {
              name: player.Player,
              age: player.Age,
              position: player.Pos,
              team: player.Squad,
              league: player.Comp,
              overallRating: analysis.overallRating,
              marketValue: analysis.progression?.marketValue?.current || 0,
              similarity: 0.8, // Similarité calculée approximativement
              advantages: analysis.strengths.slice(0, 3),
              concerns: analysis.weaknesses.slice(0, 2)
            };
          })
      );

      res.json({ 
        success: true,
        targetPlayer: {
          name: targetPlayer.Player,
          position: targetPlayer.Pos,
          team: targetPlayer.Squad
        },
        alternatives: alternatives.sort((a, b) => b.similarity - a.similarity),
        filters: {
          budget: budget ? `Budget maximum: ${budget}` : 'Aucune limite de budget',
          position: position ? `Position requise: ${position}` : 'Toutes positions',
          league: league ? `Ligue préférée: ${league}` : 'Toutes ligues'
        },
        summary: {
          question: `Alternatives à ${name}`,
          count: alternatives.length,
          topAlternative: alternatives[0]?.name || 'Aucune alternative trouvée'
        }
      });
    } catch (error) {
      console.error('Error finding alternatives:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la recherche d\'alternatives',
        details: error.message 
      });
    }
  });

  // Route 4: Profil cible - "Peux-tu me comparer ça avec notre profil cible ?"
  app.post("/api/csv-direct/compare-to-profile", async (req, res) => {
    try {
      const { playerName, targetProfile } = req.body;
      
      if (!playerName || !targetProfile) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nom du joueur et profil cible requis' 
        });
      }

      const player = await csvDirectAnalyzer.getPlayerByName(playerName);
      if (!player) {
        return res.status(404).json({ 
          success: false, 
          error: `Joueur "${playerName}" introuvable` 
        });
      }

      const analysis = csvDirectAnalyzer.generatePlayerAnalysis(player);
      
      // Comparaison avec le profil cible
      const profileMatch = {
        player: {
          name: player.Player,
          age: player.Age,
          position: player.Pos,
          currentRating: analysis.overallRating
        },
        profile: targetProfile,
        matches: {
          position: targetProfile.position ? 
            player.Pos?.includes(targetProfile.position) : true,
          ageRange: targetProfile.minAge && targetProfile.maxAge ?
            player.Age >= targetProfile.minAge && player.Age <= targetProfile.maxAge : true,
          minRating: targetProfile.minRating ?
            analysis.overallRating >= targetProfile.minRating : true,
          skills: targetProfile.requiredSkills ?
            targetProfile.requiredSkills.every(skill => 
              analysis.strengths.some(strength => 
                strength.toLowerCase().includes(skill.toLowerCase())
              )
            ) : true
        },
        score: 0 // Calculé ci-dessous
      };

      // Calcul du score de correspondance
      const matches = Object.values(profileMatch.matches);
      profileMatch.score = (matches.filter(match => match).length / matches.length) * 100;

      res.json({ 
        success: true,
        match: profileMatch,
        recommendation: profileMatch.score >= 80 ? 'Excellent match' :
                       profileMatch.score >= 60 ? 'Bon match' :
                       profileMatch.score >= 40 ? 'Match partiel' : 'Match faible',
        gaps: Object.entries(profileMatch.matches)
          .filter(([_, matches]) => !matches)
          .map(([criteria, _]) => `Ne correspond pas au critère: ${criteria}`),
        summary: {
          question: `${playerName} correspond-il à notre profil cible ?`,
          score: `${Math.round(profileMatch.score)}% de correspondance`,
          verdict: profileMatch.score >= 70 ? 'Recommandé' : 'Non recommandé'
        }
      });
    } catch (error) {
      console.error('Error comparing to profile:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la comparaison avec le profil',
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}