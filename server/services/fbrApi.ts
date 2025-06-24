import axios from 'axios';

export class FBRApi {
  private baseUrl = 'https://fbrapi.com';
  private apiKey: string | null = null;

  constructor() {
    this.initializeApiKey();
  }

  private async initializeApiKey(): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/generate_api_key`);
      this.apiKey = response.data.api_key;
      console.log('FBR API Key generated successfully');
    } catch (error) {
      console.error('Failed to generate FBR API key:', error);
    }
  }

  private async makeRequest(endpoint: string, params: any = {}): Promise<any> {
    if (!this.apiKey) {
      await this.initializeApiKey();
    }

    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: {
          ...params,
          api_key: this.apiKey
        },
        timeout: 15000,
      });

      return response.data;
    } catch (error) {
      console.error(`FBR API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async searchPlayer(playerName: string): Promise<any[]> {
    try {
      const data = await this.makeRequest('/search_player', {
        player_name: playerName
      });

      return data.players || [];
    } catch (error) {
      console.error('Error searching player with FBR API:', error);
      return [];
    }
  }

  async getPlayerStats(playerId: string, season: string = '2024-25'): Promise<any> {
    try {
      const data = await this.makeRequest('/player_stats', {
        player_id: playerId,
        season: season
      });

      return data;
    } catch (error) {
      console.error('Error getting player stats from FBR API:', error);
      return null;
    }
  }

  async getPlayerProfile(playerId: string): Promise<any> {
    try {
      const data = await this.makeRequest('/player_profile', {
        player_id: playerId
      });

      return data;
    } catch (error) {
      console.error('Error getting player profile from FBR API:', error);
      return null;
    }
  }

  async getTeamStats(teamName: string, season: string = '2024-25'): Promise<any> {
    try {
      const data = await this.makeRequest('/team_stats', {
        team_name: teamName,
        season: season
      });

      return data;
    } catch (error) {
      console.error('Error getting team stats from FBR API:', error);
      return null;
    }
  }

  async getPlayerComparison(playerIds: string[], season: string = '2024-25'): Promise<any> {
    try {
      const data = await this.makeRequest('/compare_players', {
        player_ids: playerIds.join(','),
        season: season
      });

      return data;
    } catch (error) {
      console.error('Error comparing players with FBR API:', error);
      return null;
    }
  }
}

export const fbrApi = new FBRApi();