import * as fs from 'fs';
import * as path from 'path';

interface MatchData {
  Division: string;
  MatchDate: string;
  MatchTime: string;
  HomeTeam: string;
  AwayTeam: string;
  HomeElo: number;
  AwayElo: number;
  Form3Home: number;
  Form5Home: number;
  Form3Away: number;
  Form5Away: number;
  FTHome: number;
  FTAway: number;
  FTResult: string;
  HTHome: number;
  HTAway: number;
  HTResult: string;
  HomeShots: number;
  AwayShots: number;
  HomeTarget: number;
  AwayTarget: number;
  HomeFouls: number;
  AwayFouls: number;
  HomeCorners: number;
  AwayCorners: number;
  HomeYellow: number;
  AwayYellow: number;
  HomeRed: number;
  AwayRed: number;
  OddHome: number;
  OddDraw: number;
  OddAway: number;
}

interface EloRating {
  date: string;
  club: string;
  country: string;
  elo: number;
}

export class CSVMatchAnalyzer {
  private matchesPath = path.join(process.cwd(), 'matches_data.csv');
  private eloPath = path.join(process.cwd(), 'elo_ratings.csv');
  private matchesData: MatchData[] = [];
  private eloData: EloRating[] = [];
  private loaded = false;

  private async loadData(): Promise<void> {
    if (this.loaded) return;

    try {
      // Load matches data
      const matchesContent = fs.readFileSync(this.matchesPath, 'utf-8');
      const matchesLines = matchesContent.split('\n').filter(line => line.trim());
      const matchesHeaders = matchesLines[0].split(',');

      for (let i = 1; i < matchesLines.length; i++) {
        const values = this.parseCSVLine(matchesLines[i]);
        if (values.length >= matchesHeaders.length) {
          const match: any = {};
          matchesHeaders.forEach((header, index) => {
            const value = values[index]?.trim();
            if (value && value !== '') {
              if (['HomeElo', 'AwayElo', 'Form3Home', 'Form5Home', 'Form3Away', 'Form5Away', 
                   'FTHome', 'FTAway', 'HTHome', 'HTAway', 'HomeShots', 'AwayShots', 
                   'HomeTarget', 'AwayTarget', 'HomeFouls', 'AwayFouls', 'HomeCorners', 
                   'AwayCorners', 'HomeYellow', 'AwayYellow', 'HomeRed', 'AwayRed',
                   'OddHome', 'OddDraw', 'OddAway'].includes(header)) {
                match[header] = parseFloat(value) || 0;
              } else {
                match[header] = value;
              }
            }
          });
          
          // Filter for last 3 years and top 5 European leagues + Champions League
          const matchDate = new Date(match.MatchDate);
          const currentDate = new Date();
          const threeYearsAgo = new Date(currentDate.getFullYear() - 3, currentDate.getMonth(), currentDate.getDate());
          
          if (matchDate >= threeYearsAgo && this.isTopLeague(match.Division)) {
            this.matchesData.push(match as MatchData);
          }
        }
      }

      // Load ELO ratings data
      const eloContent = fs.readFileSync(this.eloPath, 'utf-8');
      const eloLines = eloContent.split('\n').filter(line => line.trim());
      
      for (let i = 1; i < eloLines.length; i++) {
        const values = this.parseCSVLine(eloLines[i]);
        if (values.length >= 4) {
          const eloRating: EloRating = {
            date: values[0]?.replace(/"/g, '') || '',
            club: values[1]?.replace(/"/g, '') || '',
            country: values[2]?.replace(/"/g, '') || '',
            elo: parseFloat(values[3]?.replace(/"/g, '')) || 0
          };
          
          // Filter for recent data
          const ratingDate = new Date(eloRating.date);
          const currentDate = new Date();
          const threeYearsAgo = new Date(currentDate.getFullYear() - 3, currentDate.getMonth(), currentDate.getDate());
          
          if (ratingDate >= threeYearsAgo) {
            this.eloData.push(eloRating);
          }
        }
      }

      this.loaded = true;
      console.log(`Loaded ${this.matchesData.length} matches and ${this.eloData.length} ELO ratings`);
    } catch (error) {
      console.error('Error loading match data:', error);
      this.loaded = true; // Prevent infinite retry
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private isTopLeague(division: string): boolean {
    const topLeagues = [
      'E1', 'E2', // Premier League, Championship
      'D1', 'D2', // Bundesliga, 2. Bundesliga
      'F1', 'F2', // Ligue 1, Ligue 2
      'I1', 'I2', // Serie A, Serie B
      'S1', 'S2', // La Liga, Segunda Division
      'CL', 'EL', 'ECL' // Champions League, Europa League, Conference League
    ];
    return topLeagues.includes(division);
  }

  async getAllMatches(): Promise<MatchData[]> {
    await this.loadData();
    return this.matchesData;
  }

  async searchMatches(query: string): Promise<MatchData[]> {
    await this.loadData();
    const lowerQuery = query.toLowerCase();
    
    return this.matchesData.filter(match => 
      match.HomeTeam?.toLowerCase().includes(lowerQuery) ||
      match.AwayTeam?.toLowerCase().includes(lowerQuery) ||
      match.Division?.toLowerCase().includes(lowerQuery)
    ).slice(0, 50);
  }

  async getMatchesByTeam(teamName: string): Promise<MatchData[]> {
    await this.loadData();
    const lowerTeamName = teamName.toLowerCase();
    
    return this.matchesData.filter(match => 
      match.HomeTeam?.toLowerCase().includes(lowerTeamName) ||
      match.AwayTeam?.toLowerCase().includes(lowerTeamName)
    );
  }

  async getMatchesByDivision(division: string): Promise<MatchData[]> {
    await this.loadData();
    
    return this.matchesData.filter(match => 
      match.Division === division
    );
  }

  async getRecentMatches(limit: number = 20): Promise<MatchData[]> {
    await this.loadData();
    
    return this.matchesData
      .sort((a, b) => new Date(b.MatchDate).getTime() - new Date(a.MatchDate).getTime())
      .slice(0, limit);
  }

  async getMatchAnalysis(homeTeam: string, awayTeam: string): Promise<any> {
    await this.loadData();
    
    const homeMatches = await this.getMatchesByTeam(homeTeam);
    const awayMatches = await this.getMatchesByTeam(awayTeam);
    
    // Head to head
    const headToHead = this.matchesData.filter(match => 
      (match.HomeTeam === homeTeam && match.AwayTeam === awayTeam) ||
      (match.HomeTeam === awayTeam && match.AwayTeam === homeTeam)
    );

    // Recent form
    const homeRecentForm = homeMatches.slice(-5);
    const awayRecentForm = awayMatches.slice(-5);

    // Statistics
    const homeStats = this.calculateTeamStats(homeMatches, homeTeam);
    const awayStats = this.calculateTeamStats(awayMatches, awayTeam);

    return {
      homeTeam,
      awayTeam,
      headToHead,
      homeStats,
      awayStats,
      homeRecentForm,
      awayRecentForm,
      prediction: this.generateMatchPrediction(homeStats, awayStats)
    };
  }

  private calculateTeamStats(matches: MatchData[], teamName: string): any {
    const homeMatches = matches.filter(m => m.HomeTeam === teamName);
    const awayMatches = matches.filter(m => m.AwayTeam === teamName);
    
    const totalMatches = matches.length;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    let avgElo = 0;

    matches.forEach(match => {
      if (match.HomeTeam === teamName) {
        goalsFor += match.FTHome || 0;
        goalsAgainst += match.FTAway || 0;
        avgElo += match.HomeElo || 0;
        
        if (match.FTResult === 'H') wins++;
        else if (match.FTResult === 'D') draws++;
        else losses++;
      } else {
        goalsFor += match.FTAway || 0;
        goalsAgainst += match.FTHome || 0;
        avgElo += match.AwayElo || 0;
        
        if (match.FTResult === 'A') wins++;
        else if (match.FTResult === 'D') draws++;
        else losses++;
      }
    });

    return {
      totalMatches,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      avgGoalsFor: totalMatches > 0 ? (goalsFor / totalMatches).toFixed(2) : 0,
      avgGoalsAgainst: totalMatches > 0 ? (goalsAgainst / totalMatches).toFixed(2) : 0,
      winPercentage: totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0,
      avgElo: totalMatches > 0 ? (avgElo / totalMatches).toFixed(0) : 0,
      homeRecord: {
        matches: homeMatches.length,
        wins: homeMatches.filter(m => m.FTResult === 'H').length,
        draws: homeMatches.filter(m => m.FTResult === 'D').length,
        losses: homeMatches.filter(m => m.FTResult === 'A').length
      },
      awayRecord: {
        matches: awayMatches.length,
        wins: awayMatches.filter(m => m.FTResult === 'A').length,
        draws: awayMatches.filter(m => m.FTResult === 'D').length,
        losses: awayMatches.filter(m => m.FTResult === 'H').length
      }
    };
  }

  private generateMatchPrediction(homeStats: any, awayStats: any): any {
    const homeWinProb = (parseFloat(homeStats.winPercentage) + (parseFloat(homeStats.avgElo) / 20)) / 100;
    const awayWinProb = (parseFloat(awayStats.winPercentage) + (parseFloat(awayStats.avgElo) / 20)) / 100;
    const drawProb = 0.3; // Base draw probability

    const total = homeWinProb + awayWinProb + drawProb;
    
    return {
      homeWin: ((homeWinProb / total) * 100).toFixed(1),
      draw: ((drawProb / total) * 100).toFixed(1),
      awayWin: ((awayWinProb / total) * 100).toFixed(1),
      expectedGoals: {
        home: homeStats.avgGoalsFor,
        away: awayStats.avgGoalsFor
      }
    };
  }

  async getLeagueStats(): Promise<any> {
    await this.loadData();
    
    const leagues = new Map<string, any>();
    
    this.matchesData.forEach(match => {
      if (!leagues.has(match.Division)) {
        leagues.set(match.Division, {
          division: match.Division,
          matches: 0,
          totalGoals: 0,
          avgGoalsPerMatch: 0,
          teams: new Set()
        });
      }
      
      const league = leagues.get(match.Division)!;
      league.matches++;
      league.totalGoals += (match.FTHome || 0) + (match.FTAway || 0);
      league.teams.add(match.HomeTeam);
      league.teams.add(match.AwayTeam);
    });

    // Calculate averages
    leagues.forEach(league => {
      league.avgGoalsPerMatch = league.matches > 0 ? (league.totalGoals / league.matches).toFixed(2) : 0;
      league.totalTeams = league.teams.size;
      delete league.teams; // Remove Set for JSON serialization
    });

    return {
      totalLeagues: leagues.size,
      totalMatches: this.matchesData.length,
      leagues: Array.from(leagues.values()).sort((a, b) => b.matches - a.matches)
    };
  }

  async getTopScorers(): Promise<any[]> {
    await this.loadData();
    
    const scorers = new Map<string, number>();
    
    this.matchesData.forEach(match => {
      const homeGoals = match.FTHome || 0;
      const awayGoals = match.FTAway || 0;
      
      if (homeGoals > 0) {
        const current = scorers.get(match.HomeTeam) || 0;
        scorers.set(match.HomeTeam, current + homeGoals);
      }
      
      if (awayGoals > 0) {
        const current = scorers.get(match.AwayTeam) || 0;
        scorers.set(match.AwayTeam, current + awayGoals);
      }
    });

    return Array.from(scorers.entries())
      .map(([team, goals]) => ({ team, goals }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);
  }

  async getEloRankings(limit: number = 50): Promise<EloRating[]> {
    await this.loadData();
    
    // Get latest ELO for each team
    const latestElos = new Map<string, EloRating>();
    
    this.eloData.forEach(rating => {
      const current = latestElos.get(rating.club);
      if (!current || new Date(rating.date) > new Date(current.date)) {
        latestElos.set(rating.club, rating);
      }
    });

    return Array.from(latestElos.values())
      .sort((a, b) => b.elo - a.elo)
      .slice(0, limit);
  }
}

export const csvMatchAnalyzer = new CSVMatchAnalyzer();