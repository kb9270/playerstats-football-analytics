import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scraper } from "./services/scraper";
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
      
      // If we have local results, return them
      if (localPlayers.length > 0) {
        return res.json(localPlayers);
      }
      
      // If no local results, scrape from external APIs
      try {
        const scrapedPlayer = await scraper.scrapeAndStorePlayer(q);
        return res.json([scrapedPlayer]);
      } catch (scrapeError) {
        console.error('Scraping error:', scrapeError);
        return res.status(404).json({ error: "No players found" });
      }
      
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
          const stats = await storage.getPlayerStatsBySeason(playerId, comparison.season, comparison.competition);
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
      
      await scraper.updatePlayerData(id);
      
      const updatedPlayer = await storage.getPlayer(id);
      res.json(updatedPlayer);
    } catch (error) {
      console.error('Update player error:', error);
      res.status(500).json({ error: "Failed to update player data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
