import axios from 'axios';
import * as cheerio from 'cheerio';

export class TransfermarktApi {
  private baseUrl = 'https://www.transfermarkt.com';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  private async makeRequest(url: string, retries = 3): Promise<cheerio.CheerioAPI> {
    for (let i = 0; i < retries; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const response = await axios.get(url, {
          headers: this.headers,
          timeout: 15000,
          maxRedirects: 5
        });

        return cheerio.load(response.data);
      } catch (error) {
        console.log(`Request attempt ${i + 1} failed for ${url}:`, error instanceof Error ? error.message : error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 3000 * (i + 1)));
      }
    }
    throw new Error('Max retries reached');
  }

  async searchPlayers(query: string): Promise<any[]> {
    try {
      const searchUrl = `${this.baseUrl}/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(query)}&Spieler_page=1`;
      const $ = await this.makeRequest(searchUrl);
      
      const players: any[] = [];
      
      // Search for player results in the page
      $('table.items tbody tr').each((index, element) => {
        const $row = $(element);
        const $nameCell = $row.find('td.hauptlink a');
        const $positionCell = $row.find('td').eq(1);
        const $ageCell = $row.find('td').eq(2);
        const $teamCell = $row.find('td img[alt]').parent();
        const $marketValueCell = $row.find('td.rechts.hauptlink');

        if ($nameCell.length > 0) {
          const name = $nameCell.text().trim();
          const profileUrl = $nameCell.attr('href');
          const position = $positionCell.text().trim();
          const age = $ageCell.text().trim();
          const team = $teamCell.find('a').text().trim() || $teamCell.text().trim();
          const marketValue = $marketValueCell.text().trim();

          if (profileUrl && name) {
            const transfermarktId = this.extractPlayerIdFromUrl(profileUrl);
            
            players.push({
              name,
              position: position || null,
              age: age ? parseInt(age) : null,
              team: team || null,
              marketValue: this.parseMarketValue(marketValue),
              transfermarktId,
              transfermarktUrl: `${this.baseUrl}${profileUrl}`,
              source: 'transfermarkt'
            });
          }
        }
      });

      return players.slice(0, 15); // Limit results
    } catch (error) {
      console.error('Error searching Transfermarkt:', error);
      return [];
    }
  }

  async getPlayerDetails(transfermarktId: string): Promise<any> {
    try {
      const playerUrl = `${this.baseUrl}/player/profil/spieler/${transfermarktId}`;
      const $ = await this.makeRequest(playerUrl);
      
      const name = $('h1.data-header__headline-wrapper').text().trim();
      const $infoTable = $('.info-table');
      
      const details: any = {
        name,
        transfermarktId,
        transfermarktUrl: playerUrl
      };

      // Extract basic info from the info table
      $infoTable.find('tr').each((index, row) => {
        const $row = $(row);
        const label = $row.find('th').text().trim().toLowerCase();
        const value = $row.find('td').text().trim();

        switch (label) {
          case 'date of birth:':
          case 'date de naissance:':
            const age = this.calculateAge(value);
            if (age) details.age = age;
            break;
          case 'place of birth:':
          case 'lieu de naissance:':
            const nationality = this.extractNationality(value);
            if (nationality) details.nationality = nationality;
            break;
          case 'height:':
          case 'taille:':
            const height = this.parseHeight(value);
            if (height) details.height = height;
            break;
          case 'position:':
            details.position = value;
            break;
          case 'foot:':
          case 'pied:':
            details.foot = value;
            break;
          case 'current club:':
          case 'club actuel:':
            details.team = value;
            break;
        }
      });

      // Extract market value
      const marketValueText = $('.market-value').text().trim();
      if (marketValueText) {
        details.marketValue = this.parseMarketValue(marketValueText);
      }

      // Extract photo URL
      const photoUrl = $('.data-header__profile-image img').attr('src');
      if (photoUrl) {
        details.photoUrl = photoUrl;
      }

      return details;
    } catch (error) {
      console.error(`Error getting player details for ${transfermarktId}:`, error);
      return null;
    }
  }

  private extractPlayerIdFromUrl(url: string): string {
    const match = url.match(/\/(\d+)$/);
    return match ? match[1] : '';
  }

  private parseMarketValue(value: string): number | null {
    if (!value || value === '-') return null;
    
    const cleanValue = value.replace(/[€$£,\s]/g, '');
    const numMatch = cleanValue.match(/(\d+(?:\.\d+)?)/);
    
    if (!numMatch) return null;
    
    const num = parseFloat(numMatch[1]);
    
    if (value.toLowerCase().includes('m')) {
      return num * 1000000;
    } else if (value.toLowerCase().includes('k')) {
      return num * 1000;
    }
    
    return num;
  }

  private calculateAge(birthDate: string): number | null {
    try {
      const match = birthDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (!match) return null;
      
      const [, month, day, year] = match;
      const birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const now = new Date();
      
      let age = now.getFullYear() - birth.getFullYear();
      const monthDiff = now.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch {
      return null;
    }
  }

  private extractNationality(birthPlace: string): string | null {
    // Extract country from birth place (last part after comma)
    const parts = birthPlace.split(',');
    return parts.length > 0 ? parts[parts.length - 1].trim() : null;
  }

  private parseHeight(height: string): number | null {
    const match = height.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const value = parseFloat(match[1]);
      // Convert cm to meters if needed
      return value > 10 ? value / 100 : value;
    }
    return null;
  }
}

export const transfermarktApi = new TransfermarktApi();