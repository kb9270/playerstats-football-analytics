import axios from 'axios';
import * as cheerio from 'cheerio';
import type { InsertPlayer, InsertPlayerStats } from '@shared/schema';

export interface FootballApiService {
  searchPlayers(query: string): Promise<any[]>;
  getPlayerProfile(playerId: string): Promise<any>;
  getPlayerStats(playerId: string, season: string): Promise<any>;
  getPlayerPercentiles(playerId: string, position: string): Promise<any>;
}

export class FBrefApiService implements FootballApiService {
  private baseUrl = 'https://fbref.com';
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  private async makeRequest(url: string): Promise<cheerio.CheerioAPI> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000,
      });
      return cheerio.load(response.data);
    } catch (error) {
      console.error('Error making request to FBref:', error);
      throw new Error('Failed to fetch data from FBref');
    }
  }

  async searchPlayers(query: string): Promise<any[]> {
    try {
      const searchUrl = `${this.baseUrl}/search/search.fcgi?search=${encodeURIComponent(query)}`;
      const $ = await this.makeRequest(searchUrl);
      
      const players: any[] = [];
      
      $('div.search-item').each((index, element) => {
        const $element = $(element);
        const name = $element.find('a').first().text().trim();
        const href = $element.find('a').first().attr('href');
        const description = $element.find('p').text().trim();
        
        if (href && name && description.includes('Player')) {
          players.push({
            name,
            fbrefId: href.split('/')[3],
            url: `${this.baseUrl}${href}`,
            description
          });
        }
      });
      
      return players.slice(0, 10); // Limit to 10 results
    } catch (error) {
      console.error('Error searching players:', error);
      return [];
    }
  }

  async getPlayerProfile(playerId: string): Promise<any> {
    try {
      const playerUrl = `${this.baseUrl}/en/players/${playerId}`;
      const $ = await this.makeRequest(playerUrl);
      
      const name = $('h1[data-template="Infobox"] span').first().text().trim();
      const metaInfo = $('div[data-template="Infobox"] p').text();
      
      // Extract basic info
      const profile: any = {
        name,
        fbrefId: playerId,
      };
      
      // Parse meta information
      const metaLines = metaInfo.split('\n').map(line => line.trim()).filter(line => line);
      
      metaLines.forEach(line => {
        if (line.includes('Position:')) {
          profile.position = line.split('Position:')[1].trim();
        }
        if (line.includes('Footed:')) {
          profile.foot = line.split('Footed:')[1].trim();
        }
        if (line.includes('Club:')) {
          profile.team = line.split('Club:')[1].trim();
        }
        if (line.includes('Born:')) {
          const birthInfo = line.split('Born:')[1].trim();
          // Extract age if available
          const ageMatch = birthInfo.match(/age (\d+)/);
          if (ageMatch) {
            profile.age = parseInt(ageMatch[1]);
          }
        }
      });
      
      return profile;
    } catch (error) {
      console.error('Error getting player profile:', error);
      throw new Error('Failed to fetch player profile');
    }
  }

  async getPlayerStats(playerId: string, season: string = '2024-2025'): Promise<any> {
    try {
      const playerUrl = `${this.baseUrl}/en/players/${playerId}`;
      const $ = await this.makeRequest(playerUrl);
      
      const stats: any = {
        season,
        matches: 0,
        goals: 0,
        assists: 0,
        rating: 0,
      };
      
      // Look for standard stats table
      const statsTable = $('table#stats_standard');
      if (statsTable.length) {
        const currentSeasonRow = statsTable.find('tbody tr').first();
        
        if (currentSeasonRow.length) {
          const cells = currentSeasonRow.find('td');
          
          // Extract basic stats (positions may vary)
          cells.each((index, cell) => {
            const $cell = $(cell);
            const value = $cell.text().trim();
            const header = statsTable.find('thead th').eq(index).text().trim();
            
            switch (header) {
              case 'MP':
                stats.matches = parseInt(value) || 0;
                break;
              case 'Gls':
                stats.goals = parseFloat(value) || 0;
                break;
              case 'Ast':
                stats.assists = parseFloat(value) || 0;
                break;
              case 'Min':
                stats.minutes = parseInt(value) || 0;
                break;
            }
          });
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting player stats:', error);
      throw new Error('Failed to fetch player stats');
    }
  }

  async getPlayerPercentiles(playerId: string, position: string): Promise<any> {
    try {
      const scoutingUrl = `${this.baseUrl}/en/players/${playerId}/scout/365_m1`;
      const $ = await this.makeRequest(scoutingUrl);
      
      const percentiles: Record<string, number> = {};
      
      // Look for scout table
      $('table.stats_table tbody tr').each((index, row) => {
        const $row = $(row);
        const statName = $row.find('th').text().trim();
        const percentileCell = $row.find('td').last();
        const percentileValue = parseInt(percentileCell.text().trim());
        
        if (statName && !isNaN(percentileValue)) {
          percentiles[statName] = percentileValue;
        }
      });
      
      return {
        position,
        percentiles,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting player percentiles:', error);
      return { percentiles: {} };
    }
  }
}

export class TransfermarktApiService {
  private baseUrl = 'https://www.transfermarkt.com';
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  private async makeRequest(url: string): Promise<cheerio.CheerioAPI> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 10000,
      });
      return cheerio.load(response.data);
    } catch (error) {
      console.error('Error making request to Transfermarkt:', error);
      throw new Error('Failed to fetch data from Transfermarkt');
    }
  }

  async getPlayerMarketValue(playerName: string): Promise<any> {
    try {
      const searchUrl = `${this.baseUrl}/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(playerName)}`;
      const $ = await this.makeRequest(searchUrl);
      
      // Find player in search results
      const playerLink = $('table.items tbody tr').first().find('td.hauptlink a').attr('href');
      
      if (playerLink) {
        const playerUrl = `${this.baseUrl}${playerLink}`;
        const playerPage = await this.makeRequest(playerUrl);
        
        const marketValue = playerPage('.right-td .redtext').text().trim();
        const contractEnd = playerPage('span[title*="Contract expires"]').text().trim();
        
        return {
          marketValue,
          contractEnd,
          transfermarktId: playerLink.split('/')[4],
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting market value:', error);
      return null;
    }
  }
}

// Export singleton instances
export const fbrefApi = new FBrefApiService();
export const transfermarktApi = new TransfermarktApiService();
