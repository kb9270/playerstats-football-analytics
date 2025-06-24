import { 
  players, 
  playerStats, 
  comparisons, 
  scoutingReports,
  type Player, 
  type InsertPlayer,
  type PlayerStats,
  type InsertPlayerStats,
  type Comparison,
  type InsertComparison,
  type ScoutingReport,
  type InsertScoutingReport
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and } from "drizzle-orm";

export interface IStorage {
  // Player methods
  getPlayer(id: number): Promise<Player | undefined>;
  getPlayerByName(name: string): Promise<Player | undefined>;
  searchPlayers(query: string): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined>;
  
  // Player stats methods
  getPlayerStats(playerId: number, season?: string): Promise<PlayerStats[]>;
  getPlayerStatsBySeason(playerId: number, season: string, competition?: string): Promise<PlayerStats | undefined>;
  createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats>;
  updatePlayerStats(id: number, stats: Partial<InsertPlayerStats>): Promise<PlayerStats | undefined>;
  
  // Comparison methods
  createComparison(comparison: InsertComparison): Promise<Comparison>;
  getComparison(id: number): Promise<Comparison | undefined>;
  
  // Scouting report methods
  getScoutingReport(playerId: number, season: string): Promise<ScoutingReport | undefined>;
  createScoutingReport(report: InsertScoutingReport): Promise<ScoutingReport>;
  updateScoutingReport(id: number, report: Partial<InsertScoutingReport>): Promise<ScoutingReport | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Database storage - no internal state needed

  constructor() {
    // Initialize database with real data on first run
    this.initializeRealData();
  }

  private async initializeRealData() {
    try {
      // Check if data already exists
      const existingPlayers = await db.select().from(players).limit(1);
      if (existingPlayers.length > 0) {
        return; // Data already exists
      }
    } catch (error) {
      console.log('Initializing database with real player data...');
    }

    // Initialize with real data for demonstration
    // Moses Simon - FC Nantes
    const mosesSimon: Player = {
      id: 1,
      name: "Moses Simon",
      fullName: "Moses Daddy-Ajala Simon",
      age: 29,
      nationality: "Nigerian",
      position: "AILIER GAUCHE",
      team: "FC NANTES",
      league: "Ligue 1",
      marketValue: 12000000,
      contractEnd: "JUIN 2026",
      height: 1.68,
      foot: "DROIT",
      photoUrl: null,
      fbrefId: "moses-simon",
      transfermarktId: null,
      lastUpdated: new Date(),
    };

    const mosesStats: PlayerStats = {
      id: 1,
      playerId: 1,
      season: "2024-2025",
      competition: "Ligue 1",
      matches: 33,
      starts: null,
      minutes: 2677,
      goals: 8.0,
      assists: 10.0,
      goalsNonPenalty: 8.0,
      penaltyGoals: 0.0,
      penaltyAttempts: 0.0,
      yellowCards: 2,
      redCards: 0,
      xG: null,
      xA: null,
      progressivePasses: 5.07,
      progressiveCarries: null,
      progressivePassesReceived: null,
      passesCompleted: null,
      passesAttempted: null,
      passCompletionRate: null,
      keyPasses: 10.0,
      finalThirdPasses: null,
      penaltyAreaPasses: null,
      crosses: 7.66,
      tacklesWon: null,
      tacklesAttempted: null,
      interceptions: null,
      blocks: null,
      clearances: null,
      aerialsWon: null,
      aerialsAttempted: null,
      dribblesCompleted: 2.24,
      dribblesAttempted: null,
      touches: null,
      touchesPenaltyArea: null,
      dispossessed: null,
      miscontrols: null,
      rating: 7.24,
      lastUpdated: new Date(),
    };

    const mosesReport: ScoutingReport = {
      id: 1,
      playerId: 1,
      season: "2024-2025",
      competition: "Ligue 1",
      position: "AILIER GAUCHE",
      percentiles: {
        "goals": 26,
        "assists": 88,
        "keyPasses": 66,
        "progressivePasses": 93,
        "dribblesCompleted": 93,
        "crosses": 94,
        "passCompletionRate": 91,
        "tacklesWon": 32,
        "interceptions": 24
      },
      strengths: ["Passes décisives", "Dribbles réussis", "Centres", "Possessions progressives"],
      weaknesses: ["Actions défensives", "Limiter le déchet"],
      overallRating: 73,
      lastUpdated: new Date(),
    };

    // Kylian Mbappé
    const mbappe: Player = {
      id: 2,
      name: "Kylian Mbappé",
      fullName: "Kylian Mbappé Lottin",
      age: 26,
      nationality: "French",
      position: "ATTAQUANT",
      team: "Real Madrid",
      league: "La Liga",
      marketValue: 180000000,
      contractEnd: "JUIN 2029",
      height: 1.78,
      foot: "DROIT",
      photoUrl: null,
      fbrefId: "kylian-mbappe",
      transfermarktId: null,
      lastUpdated: new Date(),
    };

    const mbappeStats: PlayerStats = {
      id: 2,
      playerId: 2,
      season: "2024-2025",
      competition: "La Liga",
      matches: 28,
      starts: null,
      minutes: 2456,
      goals: 18.0,
      assists: 5.0,
      goalsNonPenalty: 15.0,
      penaltyGoals: 3.0,
      penaltyAttempts: 4.0,
      yellowCards: 3,
      redCards: 0,
      xG: null,
      xA: null,
      progressivePasses: 2.1,
      progressiveCarries: null,
      progressivePassesReceived: null,
      passesCompleted: null,
      passesAttempted: null,
      passCompletionRate: null,
      keyPasses: 2.8,
      finalThirdPasses: null,
      penaltyAreaPasses: null,
      crosses: 1.2,
      tacklesWon: null,
      tacklesAttempted: null,
      interceptions: null,
      blocks: null,
      clearances: null,
      aerialsWon: null,
      aerialsAttempted: null,
      dribblesCompleted: 3.4,
      dribblesAttempted: null,
      touches: null,
      touchesPenaltyArea: null,
      dispossessed: null,
      miscontrols: null,
      rating: 8.2,
      lastUpdated: new Date(),
    };

    const mbappeReport: ScoutingReport = {
      id: 2,
      playerId: 2,
      season: "2024-2025",
      competition: "La Liga",
      position: "ATTAQUANT",
      percentiles: {
        "goals": 95,
        "assists": 78,
        "keyPasses": 85,
        "progressivePasses": 72,
        "dribblesCompleted": 88,
        "crosses": 45,
        "passCompletionRate": 82,
        "tacklesWon": 15,
        "interceptions": 12
      },
      strengths: ["Buts", "Vitesse", "Dribbles", "Finition"],
      weaknesses: ["Jeu défensif", "Jeu aérien"],
      overallRating: 92,
      lastUpdated: new Date(),
    };

    // Mohamed-Ali Cho
    const cho: Player = {
      id: 3,
      name: "Mohamed-Ali Cho",
      fullName: "Mohamed-Ali Cho",
      age: 21,
      nationality: "French",
      position: "AILIER DROIT",
      team: "OGC Nice",
      league: "Ligue 1",
      marketValue: 25000000,
      contractEnd: "JUIN 2027",
      height: 1.75,
      foot: "GAUCHE",
      photoUrl: null,
      fbrefId: "mohamed-ali-cho",
      transfermarktId: null,
      lastUpdated: new Date(),
    };

    const choStats: PlayerStats = {
      id: 3,
      playerId: 3,
      season: "2024-2025",
      competition: "Ligue 1",
      matches: 25,
      starts: null,
      minutes: 1890,
      goals: 5.0,
      assists: 3.0,
      goalsNonPenalty: 5.0,
      penaltyGoals: 0.0,
      penaltyAttempts: 0.0,
      yellowCards: 1,
      redCards: 0,
      xG: null,
      xA: null,
      progressivePasses: 4.50,
      progressiveCarries: null,
      progressivePassesReceived: null,
      passesCompleted: null,
      passesAttempted: null,
      passCompletionRate: null,
      keyPasses: 2.83,
      finalThirdPasses: null,
      penaltyAreaPasses: null,
      crosses: 2.83,
      tacklesWon: null,
      tacklesAttempted: null,
      interceptions: null,
      blocks: null,
      clearances: null,
      aerialsWon: null,
      aerialsAttempted: null,
      dribblesCompleted: 1.11,
      dribblesAttempted: null,
      touches: null,
      touchesPenaltyArea: null,
      dispossessed: null,
      miscontrols: null,
      rating: 6.8,
      lastUpdated: new Date(),
    };

    const choReport: ScoutingReport = {
      id: 3,
      playerId: 3,
      season: "2024-2025",
      competition: "Ligue 1",
      position: "AILIER DROIT",
      percentiles: {
        "goals": 59,
        "assists": 22,
        "keyPasses": 59,
        "progressivePasses": 66,
        "dribblesCompleted": 71,
        "crosses": 47,
        "passCompletionRate": 65,
        "tacklesWon": 35,
        "interceptions": 30
      },
      strengths: ["Vitesse", "Dribbles", "Progression"],
      weaknesses: ["Passes décisives", "Régularité"],
      overallRating: 65,
      lastUpdated: new Date(),
    };

    // Zuriko Davitashvili
    const zuriko: Player = {
      id: 4,
      name: "Zuriko Davitashvili",
      fullName: "Zuriko Davitashvili",
      age: 24,
      nationality: "Georgian",
      position: "AILIER GAUCHE",
      team: "AS Saint-Étienne",
      league: "Ligue 1",
      marketValue: 8000000,
      contractEnd: "JUIN 2027",
      height: 1.73,
      foot: "GAUCHE",
      photoUrl: null,
      fbrefId: "zuriko-davitashvili",
      transfermarktId: null,
      lastUpdated: new Date(),
    };

    const zurikoStats: PlayerStats = {
      id: 4,
      playerId: 4,
      season: "2024-2025",
      competition: "Ligue 1",
      matches: 28,
      starts: null,
      minutes: 2145,
      goals: 6.0,
      assists: 4.0,
      goalsNonPenalty: 6.0,
      penaltyGoals: 0.0,
      penaltyAttempts: 0.0,
      yellowCards: 4,
      redCards: 0,
      xG: null,
      xA: null,
      progressivePasses: 3.18,
      progressiveCarries: null,
      progressivePassesReceived: null,
      passesCompleted: null,
      passesAttempted: null,
      passCompletionRate: null,
      keyPasses: 2.81,
      finalThirdPasses: null,
      penaltyAreaPasses: null,
      crosses: 2.81,
      tacklesWon: null,
      tacklesAttempted: null,
      interceptions: null,
      blocks: null,
      clearances: null,
      aerialsWon: null,
      aerialsAttempted: null,
      dribblesCompleted: 1.54,
      dribblesAttempted: null,
      touches: null,
      touchesPenaltyArea: null,
      dispossessed: null,
      miscontrols: null,
      rating: 6.9,
      lastUpdated: new Date(),
    };

    const zurikoReport: ScoutingReport = {
      id: 4,
      playerId: 4,
      season: "2024-2025",
      competition: "Ligue 1",
      position: "AILIER GAUCHE",
      percentiles: {
        "goals": 66,
        "assists": 23,
        "keyPasses": 60,
        "progressivePasses": 60,
        "dribblesCompleted": 59,
        "crosses": 40,
        "passCompletionRate": 61,
        "tacklesWon": 34,
        "interceptions": 42
      },
      strengths: ["Buts", "Technique", "Créativité"],
      weaknesses: ["Passes décisives", "Défense"],
      overallRating: 68,
      lastUpdated: new Date(),
    };

    // Dilane Bakwa
    const bakwa: Player = {
      id: 5,
      name: "Dilane Bakwa",
      fullName: "Dilane Bakwa",
      age: 22,
      nationality: "French",
      position: "AILIER DROIT",
      team: "RC Strasbourg",
      league: "Ligue 1",
      marketValue: 15000000,
      contractEnd: "JUIN 2026",
      height: 1.80,
      foot: "GAUCHE",
      photoUrl: null,
      fbrefId: "dilane-bakwa",
      transfermarktId: null,
      lastUpdated: new Date(),
    };

    const bakwaStats: PlayerStats = {
      id: 5,
      playerId: 5,
      season: "2024-2025",
      competition: "Ligue 1",
      matches: 31,
      starts: null,
      minutes: 2387,
      goals: 7.0,
      assists: 8.0,
      goalsNonPenalty: 7.0,
      penaltyGoals: 0.0,
      penaltyAttempts: 0.0,
      yellowCards: 3,
      redCards: 0,
      xG: null,
      xA: null,
      progressivePasses: 3.86,
      progressiveCarries: null,
      progressivePassesReceived: null,
      passesCompleted: null,
      passesAttempted: null,
      passCompletionRate: null,
      keyPasses: 5.51,
      finalThirdPasses: null,
      penaltyAreaPasses: null,
      crosses: 5.51,
      tacklesWon: null,
      tacklesAttempted: null,
      interceptions: null,
      blocks: null,
      clearances: null,
      aerialsWon: null,
      aerialsAttempted: null,
      dribblesCompleted: 1.80,
      dribblesAttempted: null,
      touches: null,
      touchesPenaltyArea: null,
      dispossessed: null,
      miscontrols: null,
      rating: 7.1,
      lastUpdated: new Date(),
    };

    const bakwaReport: ScoutingReport = {
      id: 5,
      playerId: 5,
      season: "2024-2025",
      competition: "Ligue 1",
      position: "AILIER DROIT",
      percentiles: {
        "goals": 74,
        "assists": 29,
        "keyPasses": 74,
        "progressivePasses": 74,
        "dribblesCompleted": 77,
        "crosses": 66,
        "passCompletionRate": 78,
        "tacklesWon": 41,
        "interceptions": 53
      },
      strengths: ["Buts", "Centres", "Dribbles", "Polyvalence"],
      weaknesses: ["Défense", "Constance"],
      overallRating: 75,
      lastUpdated: new Date(),
    };

    try {
      // Insert players
      await db.insert(players).values([
        { ...mosesSimon, id: undefined },
        { ...mbappe, id: undefined },
        { ...cho, id: undefined },
        { ...zuriko, id: undefined },
        { ...bakwa, id: undefined }
      ]);

      // Get inserted players to get their IDs
      const insertedPlayers = await db.select().from(players);
      const playerMap = new Map(insertedPlayers.map(p => [p.name, p.id]));

      // Insert stats with correct player IDs
      await db.insert(playerStats).values([
        { ...mosesStats, id: undefined, playerId: playerMap.get("Moses Simon") },
        { ...mbappeStats, id: undefined, playerId: playerMap.get("Kylian Mbappé") },
        { ...choStats, id: undefined, playerId: playerMap.get("Mohamed-Ali Cho") },
        { ...zurikoStats, id: undefined, playerId: playerMap.get("Zuriko Davitashvili") },
        { ...bakwaStats, id: undefined, playerId: playerMap.get("Dilane Bakwa") }
      ]);

      // Insert scouting reports with correct player IDs
      await db.insert(scoutingReports).values([
        { ...mosesReport, id: undefined, playerId: playerMap.get("Moses Simon") },
        { ...mbappeReport, id: undefined, playerId: playerMap.get("Kylian Mbappé") },
        { ...choReport, id: undefined, playerId: playerMap.get("Mohamed-Ali Cho") },
        { ...zurikoReport, id: undefined, playerId: playerMap.get("Zuriko Davitashvili") },
        { ...bakwaReport, id: undefined, playerId: playerMap.get("Dilane Bakwa") }
      ]);

      console.log('Database initialized with real player data');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getPlayerByName(name: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(ilike(players.name, `%${name}%`));
    return player || undefined;
  }

  async searchPlayers(query: string): Promise<Player[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(players).where(
      or(
        ilike(players.name, searchTerm),
        ilike(players.team, searchTerm),
        ilike(players.position, searchTerm)
      )
    );
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db.insert(players).values(insertPlayer).returning();
    return player;
  }

  async updatePlayer(id: number, updateData: Partial<InsertPlayer>): Promise<Player | undefined> {
    const [player] = await db.update(players)
      .set({ ...updateData, lastUpdated: new Date() })
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
  }

  async getPlayerStats(playerId: number, season?: string): Promise<PlayerStats[]> {
    if (season) {
      return await db.select().from(playerStats)
        .where(and(eq(playerStats.playerId, playerId), eq(playerStats.season, season)));
    }
    return await db.select().from(playerStats).where(eq(playerStats.playerId, playerId));
  }

  async getPlayerStatsBySeason(playerId: number, season: string, competition?: string): Promise<PlayerStats | undefined> {
    let conditions = [eq(playerStats.playerId, playerId), eq(playerStats.season, season)];
    
    if (competition) {
      conditions.push(eq(playerStats.competition, competition));
    }
    
    const [stats] = await db.select().from(playerStats).where(and(...conditions));
    return stats || undefined;
  }

  async createPlayerStats(insertStats: InsertPlayerStats): Promise<PlayerStats> {
    const [stats] = await db.insert(playerStats).values(insertStats).returning();
    return stats;
  }

  async updatePlayerStats(id: number, updateData: Partial<InsertPlayerStats>): Promise<PlayerStats | undefined> {
    const [stats] = await db.update(playerStats)
      .set({ ...updateData, lastUpdated: new Date() })
      .where(eq(playerStats.id, id))
      .returning();
    return stats || undefined;
  }

  async createComparison(insertComparison: InsertComparison): Promise<Comparison> {
    const [comparison] = await db.insert(comparisons).values(insertComparison).returning();
    return comparison;
  }

  async getComparison(id: number): Promise<Comparison | undefined> {
    const [comparison] = await db.select().from(comparisons).where(eq(comparisons.id, id));
    return comparison || undefined;
  }

  async getScoutingReport(playerId: number, season: string): Promise<ScoutingReport | undefined> {
    const [report] = await db.select().from(scoutingReports)
      .where(and(eq(scoutingReports.playerId, playerId), eq(scoutingReports.season, season)));
    return report || undefined;
  }

  async createScoutingReport(insertReport: InsertScoutingReport): Promise<ScoutingReport> {
    const [report] = await db.insert(scoutingReports).values(insertReport).returning();
    return report;
  }

  async updateScoutingReport(id: number, updateData: Partial<InsertScoutingReport>): Promise<ScoutingReport | undefined> {
    const [report] = await db.update(scoutingReports)
      .set({ ...updateData, lastUpdated: new Date() })
      .where(eq(scoutingReports.id, id))
      .returning();
    return report || undefined;
  }
}

export const storage = new DatabaseStorage();
