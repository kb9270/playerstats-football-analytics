import { fbrefScraper } from './fbrefScraper';
import { transfermarktApi } from './transfermarktApi';
import * as cheerio from 'cheerio';
import axios from 'axios';

export class AggressiveFbrefMatcher {
  private baseUrl = 'https://fbref.com';
  
  async findPlayerByMultipleStrategies(playerName: string, team?: string, nationality?: string, age?: number): Promise<string | null> {
    console.log(`Aggressive search for: ${playerName}, team: ${team}, nationality: ${nationality}, age: ${age}`);
    
    // Strategy 1: Direct name search
    let fbrefId = await this.tryDirectSearch(playerName);
    if (fbrefId) return fbrefId;
    
    // Strategy 2: Name variations
    fbrefId = await this.tryNameVariations(playerName);
    if (fbrefId) return fbrefId;
    
    // Strategy 3: Team-based search
    if (team) {
      fbrefId = await this.tryTeamBasedSearch(playerName, team);
      if (fbrefId) return fbrefId;
    }
    
    // Strategy 4: League-based search
    if (team) {
      fbrefId = await this.tryLeagueBasedSearch(playerName, team);
      if (fbrefId) return fbrefId;
    }
    
    // Strategy 5: Google-style search on FBref
    fbrefId = await this.tryGoogleStyleSearch(playerName, team);
    if (fbrefId) return fbrefId;
    
    // Strategy 6: Browse team pages directly
    if (team) {
      fbrefId = await this.browseTeamPages(playerName, team);
      if (fbrefId) return fbrefId;
    }
    
    console.log(`Could not find FBref ID for ${playerName} using any strategy`);
    return null;
  }
  
  private async tryDirectSearch(playerName: string): Promise<string | null> {
    try {
      console.log(`Direct search: ${playerName}`);
      const results = await fbrefScraper.searchPlayer(playerName);
      if (results.length > 0) {
        console.log(`Direct search success: ${results[0].name}`);
        return results[0].fbrefId;
      }
    } catch (error) {
      console.log('Direct search failed');
    }
    return null;
  }
  
  private async tryNameVariations(playerName: string): Promise<string | null> {
    const variations = [
      playerName.split(' ').slice(-1)[0], // Last name only
      playerName.split(' ')[0], // First name only
      playerName.replace(/[^\w\s]/g, ''), // Remove special chars
      playerName.replace(/\s+/g, '-'), // Replace spaces with hyphens
      playerName.toLowerCase(),
      playerName.split(' ').reverse().join(' '), // Reverse name order
    ];
    
    for (const variation of variations) {
      try {
        console.log(`Trying variation: ${variation}`);
        const results = await fbrefScraper.searchPlayer(variation);
        if (results.length > 0) {
          // Check if it's a good match
          const result = results[0];
          if (this.isGoodNameMatch(playerName, result.name)) {
            console.log(`Name variation success: ${result.name}`);
            return result.fbrefId;
          }
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }
  
  private async tryTeamBasedSearch(playerName: string, team: string): Promise<string | null> {
    const teamVariations = [
      `${playerName} ${team}`,
      `${team} ${playerName}`,
      `${playerName.split(' ')[0]} ${team}`,
      `${playerName.split(' ').slice(-1)[0]} ${team}`,
    ];
    
    for (const searchTerm of teamVariations) {
      try {
        console.log(`Team-based search: ${searchTerm}`);
        const results = await fbrefScraper.searchPlayer(searchTerm);
        for (const result of results) {
          if (this.isGoodNameMatch(playerName, result.name) && 
              result.description?.toLowerCase().includes(team.toLowerCase())) {
            console.log(`Team-based success: ${result.name}`);
            return result.fbrefId;
          }
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }
  
  private async tryLeagueBasedSearch(playerName: string, team: string): Promise<string | null> {
    const leagues = ['Premier League', 'LaLiga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League'];
    
    for (const league of leagues) {
      try {
        console.log(`League search: ${playerName} ${league}`);
        const results = await fbrefScraper.searchPlayer(`${playerName} ${league}`);
        for (const result of results) {
          if (this.isGoodNameMatch(playerName, result.name)) {
            console.log(`League-based success: ${result.name}`);
            return result.fbrefId;
          }
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }
  
  private async tryGoogleStyleSearch(playerName: string, team?: string): Promise<string | null> {
    try {
      // Use FBref's internal search with broader terms
      const searchTerms = [
        `site:fbref.com ${playerName}`,
        `${playerName} fbref`,
        team ? `${playerName} ${team} fbref` : `${playerName} football statistics`,
      ];
      
      for (const term of searchTerms) {
        console.log(`Google-style search: ${term}`);
        const results = await fbrefScraper.searchPlayer(term);
        if (results.length > 0) {
          for (const result of results) {
            if (this.isGoodNameMatch(playerName, result.name)) {
              console.log(`Google-style success: ${result.name}`);
              return result.fbrefId;
            }
          }
        }
      }
    } catch (error) {
      console.log('Google-style search failed');
    }
    return null;
  }
  
  private async browseTeamPages(playerName: string, team: string): Promise<string | null> {
    try {
      console.log(`Browsing team pages for: ${playerName} in ${team}`);
      
      // Search for the team first
      const teamResults = await fbrefScraper.searchPlayer(team);
      for (const teamResult of teamResults) {
        if (teamResult.description?.toLowerCase().includes('squad') || 
            teamResult.description?.toLowerCase().includes('team')) {
          
          // Try to get team page and look for player
          try {
            const response = await axios.get(teamResult.url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              },
              timeout: 10000
            });
            
            const $ = cheerio.load(response.data);
            
            // Look for player links on team page
            $('a[href*="/players/"]').each((index, element) => {
              const playerLink = $(element);
              const linkText = playerLink.text().trim();
              
              if (this.isGoodNameMatch(playerName, linkText)) {
                const href = playerLink.attr('href');
                if (href) {
                  const fbrefId = href.split('/')[3];
                  console.log(`Found on team page: ${linkText} -> ${fbrefId}`);
                  return fbrefId;
                }
              }
            });
          } catch (pageError) {
            continue;
          }
        }
      }
    } catch (error) {
      console.log('Team page browsing failed');
    }
    return null;
  }
  
  private isGoodNameMatch(searchName: string, resultName: string): boolean {
    const searchLower = searchName.toLowerCase();
    const resultLower = resultName.toLowerCase();
    
    // Exact match
    if (searchLower === resultLower) return true;
    
    // Last name match
    const searchLastName = searchName.split(' ').slice(-1)[0].toLowerCase();
    const resultLastName = resultName.split(' ').slice(-1)[0].toLowerCase();
    if (searchLastName === resultLastName && searchLastName.length > 3) return true;
    
    // First + Last name match
    const searchParts = searchName.toLowerCase().split(' ');
    const resultParts = resultName.toLowerCase().split(' ');
    
    if (searchParts.length >= 2 && resultParts.length >= 2) {
      const firstMatch = searchParts[0] === resultParts[0];
      const lastMatch = searchParts[searchParts.length - 1] === resultParts[resultParts.length - 1];
      if (firstMatch && lastMatch) return true;
    }
    
    // Partial match (>70% similarity)
    const similarity = this.calculateSimilarity(searchLower, resultLower);
    return similarity > 0.7;
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export const aggressiveFbrefMatcher = new AggressiveFbrefMatcher();