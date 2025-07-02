import axios from 'axios';

export class AIAnalysisService {
  private openaiApiKey = process.env.OPENAI_API_KEY;
  private deepseekApiKey = process.env.DEEPSEEK_API_KEY || 'sk-ee7e82da6ed44598ae402d25997c8837';
  private baseUrl = 'https://api.openai.com/v1';
  private deepseekUrl = 'https://api.deepseek.com/v1';

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

  async analyzePlayerWithDeepSeek(playerData: any): Promise<any> {
    if (!this.deepseekApiKey) {
      console.warn('DeepSeek API key not configured');
      return null;
    }

    try {
      const prompt = `Analyze this football player in detail and provide a comprehensive professional scouting report:

Player: ${playerData.Player || playerData.name}
Position: ${playerData.Pos || playerData.position}
Age: ${playerData.Age}
Team: ${playerData.Squad || playerData.team}
League: ${playerData.Comp || playerData.league}

Season Statistics:
- Goals: ${playerData.Gls || 0}
- Assists: ${playerData.Ast || 0}
- xG: ${playerData.xG || 0}
- xA: ${playerData.xAG || 0}
- Minutes: ${playerData.Min || 0}
- Pass Completion: ${playerData['Cmp%'] || 0}%
- Progressive Passes: ${playerData.PrgP || 0}
- Tackles: ${playerData.Tkl || 0}
- Interceptions: ${playerData.Int || 0}
- Dribbles: ${playerData.Succ || 0}
- Shot Accuracy: ${playerData['SoT%'] || 0}%

Provide a detailed analysis in the following format:
{
  "resume_detaille": "Detailed 3-4 sentence summary of the player's profile, style, and current level",
  "style_de_jeu": "Detailed description of playing style and tactical role",
  "forces_principales": ["List of 3-4 main strengths"],
  "points_amelioration": ["List of 4-5 specific areas for improvement"],
  "potentiel": "Assessment of potential and development trajectory",
  "comparaison_position": "How they compare to others in their position",
  "valeur_tactique": "Tactical value and versatility",
  "note_globale": "Overall rating out of 100",
  "recommandations": ["3-4 specific recommendations for improvement"]
}

Be specific, professional, and provide actionable insights based on the statistics and position.`;

      const response = await axios.post(`${this.deepseekUrl}/chat/completions`, {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional football scout and analyst with extensive experience in player evaluation and development. Provide detailed, actionable insights based on statistical analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.deepseekApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      console.error('Error in DeepSeek analysis:', error.response?.data || error.message);
      return null;
    }
  }
}

export const aiService = new AIAnalysisService();