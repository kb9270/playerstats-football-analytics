import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class CSVPlayerAnalyzer {
  private pythonScriptPath = path.join(__dirname, '../python/enhanced_player_analyzer.py');
  private csvDataPath = path.join(process.cwd(), 'players_data-2024_2025_1751387048911.csv');

  async searchPlayer(playerName: string, team?: string): Promise<any> {
    try {
      const args = ['search_player', playerName];
      if (team) args.push(team);
      
      const result = await this.runPythonScript(args);
      return result;
    } catch (error) {
      console.error('Error searching player:', error);
      return { found: false, error: error.message };
    }
  }

  async getCompletePlayerProfile(playerName: string, team?: string): Promise<any> {
    try {
      const args = ['get_complete_profile', playerName];
      if (team) args.push(team);
      
      const result = await this.runPythonScript(args);
      return result;
    } catch (error) {
      console.error('Error getting player profile:', error);
      return { error: error.message };
    }
  }

  async generateHeatmap(playerName: string): Promise<any> {
    try {
      const result = await this.runPythonScript(['generate_heatmap', playerName]);
      return result;
    } catch (error) {
      console.error('Error generating heatmap:', error);
      return { error: error.message };
    }
  }

  private async runPythonScript(args: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [this.pythonScriptPath, ...args]);
      
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error.message}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python script: ${error.message}`));
      });
    });
  }

  async ensureCSVDataExists(): Promise<boolean> {
    try {
      return fs.existsSync(this.csvDataPath);
    } catch (error) {
      console.error('Error checking CSV data:', error);
      return false;
    }
  }

  async getAvailablePlayersList(limit: number = 100): Promise<string[]> {
    try {
      // Lire le CSV et extraire les noms de joueurs
      const csvContent = fs.readFileSync(this.csvDataPath, 'utf8');
      const lines = csvContent.split('\n');
      
      if (lines.length < 2) return [];
      
      const players: string[] = [];
      for (let i = 1; i < Math.min(lines.length, limit + 1); i++) {
        const line = lines[i];
        if (line.trim()) {
          const columns = line.split(',');
          if (columns.length > 1) {
            const playerName = columns[1].replace(/"/g, '').trim();
            if (playerName && !players.includes(playerName)) {
              players.push(playerName);
            }
          }
        }
      }
      
      return players.sort();
    } catch (error) {
      console.error('Error reading CSV file:', error);
      return [];
    }
  }

  async getPlayersByTeam(teamName: string): Promise<string[]> {
    try {
      const csvContent = fs.readFileSync(this.csvDataPath, 'utf8');
      const lines = csvContent.split('\n');
      
      if (lines.length < 2) return [];
      
      const players: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim()) {
          const columns = line.split(',');
          if (columns.length > 4) {
            const playerName = columns[1].replace(/"/g, '').trim();
            const squad = columns[4].replace(/"/g, '').trim();
            
            if (squad.toLowerCase().includes(teamName.toLowerCase()) && playerName) {
              players.push(playerName);
            }
          }
        }
      }
      
      return players.sort();
    } catch (error) {
      console.error('Error reading CSV file:', error);
      return [];
    }
  }

  async getLeagueStats(): Promise<any> {
    try {
      const csvContent = fs.readFileSync(this.csvDataPath, 'utf8');
      const lines = csvContent.split('\n');
      
      if (lines.length < 2) return {};
      
      const leagues: { [key: string]: number } = {};
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim()) {
          const columns = line.split(',');
          if (columns.length > 5) {
            const comp = columns[5].replace(/"/g, '').trim();
            if (comp) {
              leagues[comp] = (leagues[comp] || 0) + 1;
            }
          }
        }
      }
      
      return leagues;
    } catch (error) {
      console.error('Error reading CSV file:', error);
      return {};
    }
  }
}

export const csvPlayerAnalyzer = new CSVPlayerAnalyzer();