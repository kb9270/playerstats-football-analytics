
import { PlayerData } from './csvDirectAnalyzer';

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

export class PlayerSimilarityService {
  static getSimilarPlayers(target: PlayerData, allPlayers: PlayerData[], k = 3): PlayerData[] {
    const metrics = ["Gls", "Ast", "xG", "xAG", "Succ", "Tkl"];
    
    // Filter players by position and age (within 3 years)
    const filtered = allPlayers.filter(p =>
      p.Player !== target.Player &&
      p.Pos === target.Pos &&
      Math.abs((p.Age || 0) - (target.Age || 0)) <= 3 &&
      (p.Min || 0) >= 90 // At least 90 minutes played
    );

    if (filtered.length === 0) return [];

    // Calculate ranges for normalization
    const ranges: Record<string, [number, number]> = {};
    metrics.forEach(metric => {
      const values = filtered.map(p => Number(p[metric as keyof PlayerData] || 0));
      ranges[metric] = [Math.min(...values), Math.max(...values)];
    });

    // Calculate distances
    const distances = filtered.map(p => {
      const distance = Math.sqrt(
        metrics.reduce((sum, m) => {
          const targetValue = Number(target[m as keyof PlayerData] || 0);
          const playerValue = Number(p[m as keyof PlayerData] || 0);
          const a = normalize(targetValue, ...ranges[m]);
          const b = normalize(playerValue, ...ranges[m]);
          return sum + Math.pow(a - b, 2);
        }, 0)
      );
      return { player: p, score: distance };
    });

    return distances
      .sort((a, b) => a.score - b.score)
      .slice(0, k)
      .map(d => d.player);
  }

  // Alternative method using your exact implementation
  static getSimilarPlayersV2(target: PlayerData, allPlayers: PlayerData[], k = 3): PlayerData[] {
    const metrics = ["Gls", "Ast", "xG", "xAG", "Succ", "Tkl"];
    const filtered = allPlayers.filter(p =>
      p.Player !== target.Player &&
      p.Pos === target.Pos &&
      Math.abs(Number(p.Age) - Number(target.Age)) <= 3
    );

    const ranges: Record<string, [number, number]> = {};
    metrics.forEach(metric => {
      const values = filtered.map(p => Number(p[metric as keyof PlayerData] || 0));
      ranges[metric] = [Math.min(...values), Math.max(...values)];
    });

    const distances = filtered.map(p => {
      const distance = Math.sqrt(
        metrics.reduce((sum, m) => {
          const a = normalize(Number(target[m as keyof PlayerData] || 0), ...ranges[m]);
          const b = normalize(Number(p[m as keyof PlayerData] || 0), ...ranges[m]);
          return sum + Math.pow(a - b, 2);
        }, 0)
      );
      return { player: p, score: distance };
    });

    return distances.sort((a, b) => a.score - b.score).slice(0, k).map(d => d.player);
  }
}
