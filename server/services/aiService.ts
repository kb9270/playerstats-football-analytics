import axios from 'axios';

export class AIAnalysisService {
  private openaiApiKey = process.env.OPENAI_API_KEY;
  private baseUrl = 'https://api.openai.com/v1';

  async analyzePlayerData(playerData: any): Promise<any> {
    if (!this.openaiApiKey) {
      console.warn('OpenAI API key not configured');
      return null;
    }

    try {
      const prompt = `Analyze this football player's performance data and provide insights:
      
Player: ${playerData.name}
Position: ${playerData.position}
Age: ${playerData.age}
Team: ${playerData.team}
Season Stats: ${JSON.stringify(playerData.stats, null, 2)}

Please provide:
1. Key strengths and weaknesses
2. Performance analysis
3. Comparison to players in similar position
4. Areas for improvement
5. Overall rating (1-100)

Format as JSON with clear categories.`;

      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional football analyst with deep knowledge of player performance metrics and tactical analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error in AI analysis:', error.response?.data || error.message);
      return null;
    }
  }

  async generatePlayerComparison(player1: any, player2: any): Promise<any> {
    if (!this.openaiApiKey) {
      return null;
    }

    try {
      const prompt = `Compare these two football players and provide detailed analysis:

Player 1: ${player1.name} (${player1.position}, ${player1.team})
Stats: ${JSON.stringify(player1.stats, null, 2)}

Player 2: ${player2.name} (${player2.position}, ${player2.team})
Stats: ${JSON.stringify(player2.stats, null, 2)}

Provide comparison in key areas:
1. Attacking performance
2. Defensive contribution
3. Passing and creativity
4. Physical attributes
5. Overall assessment
6. Who would be better for different tactical systems

Format as detailed JSON analysis.`;

      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional football scout and analyst specializing in player comparisons and tactical analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error in AI comparison:', error.response?.data || error.message);
      return null;
    }
  }
}

export const aiService = new AIAnalysisService();