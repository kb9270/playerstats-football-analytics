import axios from 'axios';
import * as cheerio from 'cheerio';

export class TransfermarktApi {
  private baseUrl = 'https://transfermarkt-api.fly.dev';
  private headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  private async makeRequest(url: string, retries = 3): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const response = await axios.get(url, {
          headers: this.headers,
          timeout: 10000,
        });

        return response.data;
      } catch (error) {
        console.log(`Request attempt ${i + 1} failed for ${url}:`, error instanceof Error ? error.message : error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
    throw new Error('Max retries reached');
  }

  async searchPlayers(query: string): Promise<any[]> {
    try {
      const searchUrl = `${this.baseUrl}/players/search/${encodeURIComponent(query)}`;
      const data = await this.makeRequest(searchUrl);
      
      const players: any[] = [];
      
      if (data && Array.isArray(data.results)) {
        for (const result of data.results.slice(0, 15)) {
          players.push({
            name: result.name,
            position: result.position?.name || null,
            age: result.age || null,
            team: result.club?.name || null,
            nationality: result.nationality?.name || null,
            marketValue: result.marketValue || null,
            transfermarktId: result.id,
            photoUrl: result.image || null,
            source: 'transfermarkt'
          });
        }
      }

      return players;
    } catch (error) {
      console.error('Error searching Transfermarkt:', error);
      return [];
    }
  }

  async getPlayerDetails(transfermarktId: string): Promise<any> {
    try {
      const playerUrl = `${this.baseUrl}/players/${transfermarktId}/profile`;
      const data = await this.makeRequest(playerUrl);
      
      if (!data) return null;

      const details: any = {
        name: data.name,
        fullName: data.fullName,
        transfermarktId,
        age: data.age,
        nationality: data.nationality?.name,
        position: data.position?.name,
        team: data.club?.name,
        league: data.league?.name,
        marketValue: data.marketValue,
        height: data.height ? data.height / 100 : null, // Convert cm to meters
        foot: data.foot,
        photoUrl: data.image,
        contractEnd: data.contract?.expires
      };

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