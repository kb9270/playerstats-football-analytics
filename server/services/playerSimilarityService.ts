
import { PlayerData } from './csvDirectAnalyzer';

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

export class PlayerSimilarityService {
  static getSimilarPlayers(target: PlayerData, allPlayers: PlayerData[], k = 3): PlayerData[] {
    const metrics = ['xG', 'xAG', 'Gls', 'Ast', 'Succ', 'Tkl'];
    
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
      const dist = Math.sqrt(
        metrics.reduce((sum, key) => {
          const targetValue = Number(target[key as keyof PlayerData] || 0);
          const playerValue = Number(p[key as keyof PlayerData] || 0);
          const a = normalize(targetValue, ...ranges[key]);
          const b = normalize(playerValue, ...ranges[key]);
          return sum + Math.pow(a - b, 2);
        }, 0)
      );
      return { player: p, distance: dist };
    });

    return distances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k)
      .map(d => d.player);
  }
}
