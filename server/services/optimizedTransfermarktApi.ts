import axios from 'axios';

export class OptimizedTransfermarktApi {
  private baseUrl = 'https://transfermarkt-api.fly.dev';
  private cache = new Map();
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
  };

  private async makeRequest(url: string, retries = 3): Promise<any> {
    // Check cache first
    if (this.cache.has(url)) {
      console.log(`Cache hit for: ${url}`);
      return this.cache.get(url);
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Transfermarkt API request attempt ${attempt}: ${url}`);
        
        const response = await axios.get(url, {
          headers: this.headers,
          timeout: 15000,
        });

        // Cache successful responses
        this.cache.set(url, response.data);
        
        return response.data;
      } catch (error) {
        console.log(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  async searchPlayersOptimized(query: string): Promise<any[]> {
    try {
      const searchUrl = `${this.baseUrl}/players/search/${encodeURIComponent(query)}`;
      const data = await this.makeRequest(searchUrl);
      
      if (data && data.results) {
        console.log(`Found ${data.results.length} players for "${query}"`);
        
        // Process and enrich the results
        return data.results.map((player: any) => ({
          id: this.generateUniqueId(player),
          name: player.name || player.playerName,
          fullName: player.fullName,
          age: this.calculateAge(player.dateOfBirth),
          nationality: player.nationality?.name || player.citizenship,
          team: player.club?.name || player.currentClub,
          position: player.position?.name || player.mainPosition,
          marketValue: this.parseMarketValue(player.marketValue),
          height: this.parseHeight(player.height),
          foot: player.foot,
          league: player.club?.league || player.league,
          transfermarktId: player.id,
          profileUrl: player.profileURL,
          imageUrl: player.image,
          dateOfBirth: player.dateOfBirth,
          contract: player.contract,
          source: 'transfermarkt'
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Optimized Transfermarkt search error:', error);
      return [];
    }
  }

  async getPlayerDetailsOptimized(transfermarktId: string): Promise<any> {
    try {
      const detailUrl = `${this.baseUrl}/players/${transfermarktId}`;
      const data = await this.makeRequest(detailUrl);
      
      if (data) {
        // Get additional stats if available
        const statsUrl = `${this.baseUrl}/players/${transfermarktId}/stats`;
        let statsData = null;
        try {
          statsData = await this.makeRequest(statsUrl);
        } catch (statsError) {
          console.log('No stats available from Transfermarkt for this player');
        }

        // Get transfer history
        const transfersUrl = `${this.baseUrl}/players/${transfermarktId}/transfers`;
        let transfersData = null;
        try {
          transfersData = await this.makeRequest(transfersUrl);
        } catch (transferError) {
          console.log('No transfer history available');
        }

        return {
          ...data,
          stats: statsData,
          transfers: transfersData,
          lastUpdated: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting optimized player details:', error);
      return null;
    }
  }

  async getPlayerStatsBySeasons(transfermarktId: string): Promise<any[]> {
    try {
      const statsUrl = `${this.baseUrl}/players/${transfermarktId}/stats`;
      const data = await this.makeRequest(statsUrl);
      
      if (data && data.stats) {
        return data.stats.map((season: any) => ({
          season: season.season,
          competition: season.competition,
          appearances: season.appearances,
          goals: season.goals,
          assists: season.assists,
          yellowCards: season.yellowCards,
          redCards: season.redCards,
          minutes: season.minutesPlayed,
          club: season.club
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting player stats by seasons:', error);
      return [];
    }
  }

  async searchByMultipleCriteria(playerName: string, teamName?: string, nationality?: string): Promise<any[]> {
    const searchQueries = [
      playerName,
      `${playerName} ${teamName || ''}`.trim(),
      `${playerName} ${nationality || ''}`.trim(),
      playerName.split(' ').slice(-1)[0], // Last name only
      playerName.split(' ')[0], // First name only
    ];

    const allResults: any[] = [];
    const seenIds = new Set();

    for (const query of searchQueries) {
      if (query.length < 2) continue;
      
      try {
        const results = await this.searchPlayersOptimized(query);
        
        for (const player of results) {
          const uniqueKey = `${player.name}-${player.team}`;
          if (!seenIds.has(uniqueKey)) {
            seenIds.add(uniqueKey);
            
            // Score the match quality
            let matchScore = 0;
            
            if (this.nameMatches(playerName, player.name)) matchScore += 40;
            if (teamName && player.team && player.team.toLowerCase().includes(teamName.toLowerCase())) matchScore += 30;
            if (nationality && player.nationality && player.nationality.toLowerCase().includes(nationality.toLowerCase())) matchScore += 20;
            
            player.matchScore = matchScore;
            allResults.push(player);
          }
        }
      } catch (error) {
        console.log(`Search failed for query: ${query}`);
        continue;
      }
    }

    // Sort by match score and return best matches
    return allResults
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 10);
  }

  private generateUniqueId(player: any): number {
    // Generate a consistent ID based on player data
    const str = `${player.name}-${player.club?.name || ''}-${player.dateOfBirth || ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private calculateAge(birthDate: string): number | null {
    if (!birthDate) return null;
    
    try {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return null;
    }
  }

  private parseMarketValue(value: string): number | null {
    if (!value) return null;
    
    try {
      const numStr = value.replace(/[^0-9.]/g, '');
      const num = parseFloat(numStr);
      
      if (value.includes('m') || value.includes('M')) {
        return num * 1000000;
      } else if (value.includes('k') || value.includes('K')) {
        return num * 1000;
      }
      
      return num;
    } catch (error) {
      return null;
    }
  }

  private parseHeight(height: string): number | null {
    if (!height) return null;
    
    try {
      const match = height.match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : null;
    } catch (error) {
      return null;
    }
  }

  private nameMatches(searchName: string, resultName: string): boolean {
    const search = searchName.toLowerCase();
    const result = resultName.toLowerCase();
    
    // Exact match
    if (search === result) return true;
    
    // Check if all words from search are in result
    const searchWords = search.split(' ');
    const resultWords = result.split(' ');
    
    return searchWords.every(word => 
      resultWords.some(rWord => rWord.includes(word) || word.includes(rWord))
    );
  }

  clearCache(): void {
    this.cache.clear();
    console.log('Transfermarkt cache cleared');
  }
}

export const optimizedTransfermarktApi = new OptimizedTransfermarktApi();