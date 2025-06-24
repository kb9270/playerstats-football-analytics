import axios from 'axios';
import * as cheerio from 'cheerio';

export class FBrefScraper {
  private baseUrl = 'https://fbref.com';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  private async makeRequest(url: string, retries = 3): Promise<cheerio.CheerioAPI> {
    for (let i = 0; i < retries; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        
        const response = await axios.get(url, {
          headers: this.headers,
          timeout: 15000,
        });

        return cheerio.load(response.data);
      } catch (error) {
        console.log(`Request attempt ${i + 1} failed for ${url}:`, error instanceof Error ? error.message : error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 5000 * (i + 1)));
      }
    }
    throw new Error('Max retries reached');
  }

  async searchPlayer(playerName: string): Promise<any[]> {
    try {
      const searchUrl = `${this.baseUrl}/search/search.fcgi?search=${encodeURIComponent(playerName)}`;
      const $ = await this.makeRequest(searchUrl);
      
      const players: any[] = [];
      
      $('div.search-item').each((index, element) => {
        const $element = $(element);
        const name = $element.find('a').first().text().trim();
        const href = $element.find('a').first().attr('href');
        const description = $element.find('div').text().trim();
        
        if (href && name && description.includes('Player')) {
          const fbrefId = href.split('/')[3];
          players.push({
            name,
            fbrefId,
            url: `${this.baseUrl}${href}`,
            description
          });
        }
      });
      
      return players.slice(0, 10);
    } catch (error) {
      console.error('Error searching FBref:', error);
      return [];
    }
  }

  async getPlayerProfile(fbrefId: string): Promise<any> {
    try {
      const playerUrl = `${this.baseUrl}/en/players/${fbrefId}/${fbrefId}`;
      const $ = await this.makeRequest(playerUrl);
      
      const profile: any = {
        fbrefId,
        name: $('h1 span').first().text().trim()
      };

      // Extract basic info
      const $infoDiv = $('div.info');
      $infoDiv.find('p').each((index, p) => {
        const text = $(p).text().trim();
        
        if (text.includes('Position:')) {
          profile.position = text.replace('Position:', '').trim().split('▪')[0].trim();
        }
        if (text.includes('Footed:')) {
          profile.foot = text.replace('Footed:', '').trim().split('▪')[0].trim();
        }
        if (text.includes('Club:')) {
          profile.team = text.replace('Club:', '').trim().split('▪')[0].trim();
        }
        if (text.includes('Born:')) {
          const birthInfo = text.replace('Born:', '').trim();
          const ageMatch = birthInfo.match(/age (\d+)/);
          if (ageMatch) {
            profile.age = parseInt(ageMatch[1]);
          }
          
          const nationalityMatch = birthInfo.match(/in (.+?)(?:\s|$)/);
          if (nationalityMatch) {
            profile.nationality = nationalityMatch[1].trim();
          }
        }
      });

      // Extract photo
      const photoUrl = $('div.media-item img').attr('src');
      if (photoUrl) {
        profile.photoUrl = photoUrl.startsWith('http') ? photoUrl : `${this.baseUrl}${photoUrl}`;
      }

      return profile;
    } catch (error) {
      console.error(`Error getting player profile for ${fbrefId}:`, error);
      return null;
    }
  }

  async getPlayerStats(fbrefId: string, season: string = '2024-2025'): Promise<any[]> {
    try {
      const playerUrl = `${this.baseUrl}/en/players/${fbrefId}/${fbrefId}`;
      const $ = await this.makeRequest(playerUrl);
      
      const stats: any[] = [];
      
      // Extract stats from the standard stats table
      $('#stats_standard tbody tr').each((index, row) => {
        const $row = $(row);
        const seasonText = $row.find('th a').text().trim();
        
        if (seasonText.includes('2024-25') || seasonText.includes('2023-24')) {
          const competition = $row.find('td').eq(1).text().trim();
          const team = $row.find('td').eq(2).text().trim();
          
          const statRecord: any = {
            season: seasonText,
            competition,
            team,
            matches: parseInt($row.find('td').eq(3).text().trim()) || 0,
            starts: parseInt($row.find('td').eq(4).text().trim()) || 0,
            minutes: parseInt($row.find('td').eq(5).text().trim()) || 0,
            goals: parseFloat($row.find('td').eq(6).text().trim()) || 0,
            assists: parseFloat($row.find('td').eq(7).text().trim()) || 0,
            goalsNonPenalty: parseFloat($row.find('td').eq(8).text().trim()) || 0,
            penaltyGoals: parseFloat($row.find('td').eq(9).text().trim()) || 0,
            penaltyAttempts: parseFloat($row.find('td').eq(10).text().trim()) || 0,
            yellowCards: parseInt($row.find('td').eq(11).text().trim()) || 0,
            redCards: parseInt($row.find('td').eq(12).text().trim()) || 0,
            xG: parseFloat($row.find('td').eq(13).text().trim()) || 0,
            xA: parseFloat($row.find('td').eq(14).text().trim()) || 0
          };
          
          stats.push(statRecord);
        }
      });

      return stats;
    } catch (error) {
      console.error(`Error getting player stats for ${fbrefId}:`, error);
      return [];
    }
  }

  async getDetailedStats(fbrefId: string): Promise<any> {
    try {
      const playerUrl = `${this.baseUrl}/en/players/${fbrefId}/${fbrefId}`;
      const $ = await this.makeRequest(playerUrl);
      
      const detailedStats: any = {};
      
      // Extract shooting stats
      $('#stats_shooting tbody tr').each((index, row) => {
        const $row = $(row);
        const seasonText = $row.find('th a').text().trim();
        
        if (seasonText.includes('2024-25')) {
          detailedStats.shooting = {
            shots: parseInt($row.find('td').eq(3).text().trim()) || 0,
            shotsOnTarget: parseInt($row.find('td').eq(4).text().trim()) || 0,
            shotAccuracy: parseFloat($row.find('td').eq(5).text().trim()) || 0,
            goalsPerShot: parseFloat($row.find('td').eq(6).text().trim()) || 0,
            goalsPerShotOnTarget: parseFloat($row.find('td').eq(7).text().trim()) || 0
          };
        }
      });

      // Extract passing stats
      $('#stats_passing tbody tr').each((index, row) => {
        const $row = $(row);
        const seasonText = $row.find('th a').text().trim();
        
        if (seasonText.includes('2024-25')) {
          detailedStats.passing = {
            passesCompleted: parseInt($row.find('td').eq(3).text().trim()) || 0,
            passesAttempted: parseInt($row.find('td').eq(4).text().trim()) || 0,
            passCompletionRate: parseFloat($row.find('td').eq(5).text().trim()) || 0,
            totalPassDistance: parseInt($row.find('td').eq(6).text().trim()) || 0,
            progressivePasses: parseInt($row.find('td').eq(7).text().trim()) || 0,
            keyPasses: parseInt($row.find('td').eq(10).text().trim()) || 0,
            finalThirdPasses: parseInt($row.find('td').eq(11).text().trim()) || 0,
            penaltyAreaPasses: parseInt($row.find('td').eq(12).text().trim()) || 0,
            crosses: parseInt($row.find('td').eq(13).text().trim()) || 0
          };
        }
      });

      // Extract defensive stats
      $('#stats_defense tbody tr').each((index, row) => {
        const $row = $(row);
        const seasonText = $row.find('th a').text().trim();
        
        if (seasonText.includes('2024-25')) {
          detailedStats.defense = {
            tackles: parseInt($row.find('td').eq(3).text().trim()) || 0,
            tacklesWon: parseInt($row.find('td').eq(4).text().trim()) || 0,
            tackleSuccess: parseFloat($row.find('td').eq(5).text().trim()) || 0,
            interceptions: parseInt($row.find('td').eq(6).text().trim()) || 0,
            blocks: parseInt($row.find('td').eq(7).text().trim()) || 0,
            clearances: parseInt($row.find('td').eq(8).text().trim()) || 0,
            errors: parseInt($row.find('td').eq(9).text().trim()) || 0
          };
        }
      });

      return detailedStats;
    } catch (error) {
      console.error(`Error getting detailed stats for ${fbrefId}:`, error);
      return {};
    }
  }

  async getPlayerPercentiles(fbrefId: string, position: string): Promise<any> {
    try {
      const playerUrl = `${this.baseUrl}/en/players/${fbrefId}/scout/365_m1/${fbrefId}-Scouting-Report`;
      const $ = await this.makeRequest(playerUrl);
      
      const percentiles: any = {};
      
      // Extract percentile data from scout report
      $('div.percentile').each((index, element) => {
        const $element = $(element);
        const statName = $element.find('.percentile-label').text().trim();
        const percentileValue = parseFloat($element.find('.percentile-value').text().trim());
        
        if (statName && !isNaN(percentileValue)) {
          percentiles[statName.toLowerCase().replace(/\s+/g, '_')] = percentileValue;
        }
      });

      return {
        percentiles,
        position,
        season: '2024-2025'
      };
    } catch (error) {
      console.error(`Error getting percentiles for ${fbrefId}:`, error);
      return { percentiles: {}, position, season: '2024-2025' };
    }
  }
}

export const fbrefScraper = new FBrefScraper();