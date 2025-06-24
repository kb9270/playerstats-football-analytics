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
    
    // Initialize with real player data for demonstration
    this.initializeRealData();
  }

  private initializeRealData() {
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

    // Store all the data
    this.players.set(1, mosesSimon);
    this.players.set(2, mbappe);
    this.players.set(3, cho);
    this.players.set(4, zuriko);
    this.players.set(5, bakwa);
    
    this.playerStats.set(1, mosesStats);
    this.playerStats.set(2, mbappeStats);
    this.playerStats.set(3, choStats);
    this.playerStats.set(4, zurikoStats);
    this.playerStats.set(5, bakwaStats);
    
    this.scoutingReports.set(1, mosesReport);
    this.scoutingReports.set(2, mbappeReport);
    this.scoutingReports.set(3, choReport);
    this.scoutingReports.set(4, zurikoReport);
    this.scoutingReports.set(5, bakwaReport);

    this.currentPlayerId = 6;
    this.currentStatsId = 6;
    this.currentReportId = 6;
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
