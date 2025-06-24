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

export class MemStorage implements IStorage {
  private players: Map<number, Player>;
  private playerStats: Map<number, PlayerStats>;
  private comparisons: Map<number, Comparison>;
  private scoutingReports: Map<number, ScoutingReport>;
  private currentPlayerId: number;
  private currentStatsId: number;
  private currentComparisonId: number;
  private currentReportId: number;

  constructor() {
    this.players = new Map();
    this.playerStats = new Map();
    this.comparisons = new Map();
    this.scoutingReports = new Map();
    this.currentPlayerId = 1;
    this.currentStatsId = 1;
    this.currentComparisonId = 1;
    this.currentReportId = 1;
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayerByName(name: string): Promise<Player | undefined> {
    return Array.from(this.players.values()).find(
      (player) => player.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  async searchPlayers(query: string): Promise<Player[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.players.values()).filter(
      (player) => 
        player.name.toLowerCase().includes(searchTerm) ||
        player.team?.toLowerCase().includes(searchTerm) ||
        player.position?.toLowerCase().includes(searchTerm)
    );
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.currentPlayerId++;
    const player: Player = { 
      ...insertPlayer,
      id,
      lastUpdated: new Date(),
      // Ensure all nullable fields are properly typed
      fullName: insertPlayer.fullName ?? null,
      age: insertPlayer.age ?? null,
      nationality: insertPlayer.nationality ?? null,
      position: insertPlayer.position ?? null,
      team: insertPlayer.team ?? null,
      league: insertPlayer.league ?? null,
      marketValue: insertPlayer.marketValue ?? null,
      contractEnd: insertPlayer.contractEnd ?? null,
      height: insertPlayer.height ?? null,
      foot: insertPlayer.foot ?? null,
      photoUrl: insertPlayer.photoUrl ?? null,
      fbrefId: insertPlayer.fbrefId ?? null,
      transfermarktId: insertPlayer.transfermarktId ?? null,
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: number, updateData: Partial<InsertPlayer>): Promise<Player | undefined> {
    const player = this.players.get(id);
    if (!player) return undefined;
    
    const updatedPlayer: Player = { 
      ...player, 
      ...updateData,
      lastUpdated: new Date()
    };
    this.players.set(id, updatedPlayer);
    return updatedPlayer;
  }

  async getPlayerStats(playerId: number, season?: string): Promise<PlayerStats[]> {
    return Array.from(this.playerStats.values()).filter(
      (stats) => stats.playerId === playerId && (!season || stats.season === season)
    );
  }

  async getPlayerStatsBySeason(playerId: number, season: string, competition?: string): Promise<PlayerStats | undefined> {
    return Array.from(this.playerStats.values()).find(
      (stats) => 
        stats.playerId === playerId && 
        stats.season === season &&
        (!competition || stats.competition === competition)
    );
  }

  async createPlayerStats(insertStats: InsertPlayerStats): Promise<PlayerStats> {
    const id = this.currentStatsId++;
    const stats: PlayerStats = { 
      ...insertStats,
      id,
      lastUpdated: new Date(),
      playerId: insertStats.playerId ?? null,
      competition: insertStats.competition ?? null,
      matches: insertStats.matches ?? null,
      starts: insertStats.starts ?? null,
      minutes: insertStats.minutes ?? null,
      goals: insertStats.goals ?? null,
      assists: insertStats.assists ?? null,
      goalsNonPenalty: insertStats.goalsNonPenalty ?? null,
      penaltyGoals: insertStats.penaltyGoals ?? null,
      penaltyAttempts: insertStats.penaltyAttempts ?? null,
      yellowCards: insertStats.yellowCards ?? null,
      redCards: insertStats.redCards ?? null,
      xG: insertStats.xG ?? null,
      xA: insertStats.xA ?? null,
      progressivePasses: insertStats.progressivePasses ?? null,
      progressiveCarries: insertStats.progressiveCarries ?? null,
      progressivePassesReceived: insertStats.progressivePassesReceived ?? null,
      passesCompleted: insertStats.passesCompleted ?? null,
      passesAttempted: insertStats.passesAttempted ?? null,
      passCompletionRate: insertStats.passCompletionRate ?? null,
      keyPasses: insertStats.keyPasses ?? null,
      finalThirdPasses: insertStats.finalThirdPasses ?? null,
      penaltyAreaPasses: insertStats.penaltyAreaPasses ?? null,
      crosses: insertStats.crosses ?? null,
      tacklesWon: insertStats.tacklesWon ?? null,
      tacklesAttempted: insertStats.tacklesAttempted ?? null,
      interceptions: insertStats.interceptions ?? null,
      blocks: insertStats.blocks ?? null,
      clearances: insertStats.clearances ?? null,
      aerialsWon: insertStats.aerialsWon ?? null,
      aerialsAttempted: insertStats.aerialsAttempted ?? null,
      dribblesCompleted: insertStats.dribblesCompleted ?? null,
      dribblesAttempted: insertStats.dribblesAttempted ?? null,
      touches: insertStats.touches ?? null,
      touchesPenaltyArea: insertStats.touchesPenaltyArea ?? null,
      dispossessed: insertStats.dispossessed ?? null,
      miscontrols: insertStats.miscontrols ?? null,
      rating: insertStats.rating ?? null,
    };
    this.playerStats.set(id, stats);
    return stats;
  }

  async updatePlayerStats(id: number, updateData: Partial<InsertPlayerStats>): Promise<PlayerStats | undefined> {
    const stats = this.playerStats.get(id);
    if (!stats) return undefined;
    
    const updatedStats: PlayerStats = { 
      ...stats, 
      ...updateData,
      lastUpdated: new Date()
    };
    this.playerStats.set(id, updatedStats);
    return updatedStats;
  }

  async createComparison(insertComparison: InsertComparison): Promise<Comparison> {
    const id = this.currentComparisonId++;
    const comparison: Comparison = { 
      ...insertComparison,
      id,
      createdAt: new Date(),
      competition: insertComparison.competition ?? null,
    };
    this.comparisons.set(id, comparison);
    return comparison;
  }

  async getComparison(id: number): Promise<Comparison | undefined> {
    return this.comparisons.get(id);
  }

  async getScoutingReport(playerId: number, season: string): Promise<ScoutingReport | undefined> {
    return Array.from(this.scoutingReports.values()).find(
      (report) => report.playerId === playerId && report.season === season
    );
  }

  async createScoutingReport(insertReport: InsertScoutingReport): Promise<ScoutingReport> {
    const id = this.currentReportId++;
    const report: ScoutingReport = { 
      ...insertReport,
      id,
      lastUpdated: new Date(),
      playerId: insertReport.playerId ?? null,
      position: insertReport.position ?? null,
      competition: insertReport.competition ?? null,
      strengths: insertReport.strengths ?? null,
      weaknesses: insertReport.weaknesses ?? null,
      overallRating: insertReport.overallRating ?? null,
    };
    this.scoutingReports.set(id, report);
    return report;
  }

  async updateScoutingReport(id: number, updateData: Partial<InsertScoutingReport>): Promise<ScoutingReport | undefined> {
    const report = this.scoutingReports.get(id);
    if (!report) return undefined;
    
    const updatedReport: ScoutingReport = { 
      ...report, 
      ...updateData,
      lastUpdated: new Date()
    };
    this.scoutingReports.set(id, updatedReport);
    return updatedReport;
  }
}

export const storage = new MemStorage();
