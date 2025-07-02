import { PlayerData } from './csvDirectAnalyzer';

interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  actions: number;
}

interface PassMapData {
  from: { x: number; y: number };
  to: { x: number; y: number };
  frequency: number;
  success: boolean;
}

export class HeatmapService {
  // Générer une heatmap basée sur la position et les statistiques du joueur
  generateHeatmap(player: PlayerData): HeatmapPoint[] {
    const position = player.Pos;
    const touches = player.Touches || 0;
    const carries = player.Carries || 0;
    const progressivePasses = player.PrgP || 0;
    const tackles = player.Tkl || 0;
    
    const heatmapData: HeatmapPoint[] = [];
    
    // Zones basées sur la position
    if (position.includes('GK')) {
      // Gardien - concentré dans la surface
      heatmapData.push(
        { x: 10, y: 50, intensity: 90, actions: Math.floor(touches * 0.4) },
        { x: 15, y: 45, intensity: 70, actions: Math.floor(touches * 0.2) },
        { x: 15, y: 55, intensity: 70, actions: Math.floor(touches * 0.2) },
        { x: 20, y: 50, intensity: 50, actions: Math.floor(touches * 0.1) }
      );
    } else if (position.includes('DF')) {
      // Défenseur
      const centralIntensity = tackles > 20 ? 85 : 70;
      heatmapData.push(
        { x: 25, y: 50, intensity: centralIntensity, actions: Math.floor(touches * 0.3) },
        { x: 30, y: 40, intensity: 75, actions: Math.floor(touches * 0.25) },
        { x: 30, y: 60, intensity: 75, actions: Math.floor(touches * 0.25) },
        { x: 35, y: 50, intensity: 60, actions: Math.floor(touches * 0.15) },
        { x: 45, y: 50, intensity: 40, actions: Math.floor(touches * 0.05) }
      );
    } else if (position.includes('MF')) {
      // Milieu de terrain
      const passIntensity = progressivePasses > 50 ? 90 : 75;
      heatmapData.push(
        { x: 50, y: 50, intensity: passIntensity, actions: Math.floor(touches * 0.4) },
        { x: 45, y: 40, intensity: 70, actions: Math.floor(touches * 0.2) },
        { x: 45, y: 60, intensity: 70, actions: Math.floor(touches * 0.2) },
        { x: 60, y: 50, intensity: 65, actions: Math.floor(touches * 0.15) },
        { x: 35, y: 50, intensity: 50, actions: Math.floor(touches * 0.05) }
      );
    } else if (position.includes('FW')) {
      // Attaquant
      const goalIntensity = (player.Gls || 0) > 10 ? 95 : 80;
      heatmapData.push(
        { x: 75, y: 50, intensity: goalIntensity, actions: Math.floor(touches * 0.35) },
        { x: 70, y: 40, intensity: 75, actions: Math.floor(touches * 0.25) },
        { x: 70, y: 60, intensity: 75, actions: Math.floor(touches * 0.25) },
        { x: 85, y: 50, intensity: 85, actions: Math.floor(touches * 0.1) },
        { x: 60, y: 50, intensity: 55, actions: Math.floor(touches * 0.05) }
      );
    }
    
    return heatmapData;
  }

  // Générer une pass map basée sur les statistiques de passe
  generatePassMap(player: PlayerData): PassMapData[] {
    const position = player.Pos;
    const totalPasses = player.Att || 0;
    const completedPasses = player.Cmp || 0;
    const progressivePasses = player.PrgP || 0;
    const successRate = totalPasses > 0 ? (completedPasses / totalPasses) * 100 : 0;
    
    const passMapData: PassMapData[] = [];
    
    if (position.includes('GK')) {
      // Gardien - passes longues vers les défenseurs
      passMapData.push(
        { from: { x: 10, y: 50 }, to: { x: 25, y: 40 }, frequency: Math.floor(totalPasses * 0.3), success: successRate > 70 },
        { from: { x: 10, y: 50 }, to: { x: 25, y: 60 }, frequency: Math.floor(totalPasses * 0.3), success: successRate > 70 },
        { from: { x: 10, y: 50 }, to: { x: 45, y: 50 }, frequency: Math.floor(totalPasses * 0.4), success: successRate > 70 }
      );
    } else if (position.includes('DF')) {
      // Défenseur - passes vers le milieu et latérales
      passMapData.push(
        { from: { x: 25, y: 50 }, to: { x: 45, y: 50 }, frequency: Math.floor(totalPasses * 0.4), success: successRate > 80 },
        { from: { x: 25, y: 50 }, to: { x: 35, y: 30 }, frequency: Math.floor(totalPasses * 0.2), success: successRate > 75 },
        { from: { x: 25, y: 50 }, to: { x: 35, y: 70 }, frequency: Math.floor(totalPasses * 0.2), success: successRate > 75 },
        { from: { x: 25, y: 50 }, to: { x: 60, y: 50 }, frequency: Math.floor(progressivePasses * 0.6), success: successRate > 70 }
      );
    } else if (position.includes('MF')) {
      // Milieu - passes dans toutes les directions
      passMapData.push(
        { from: { x: 50, y: 50 }, to: { x: 70, y: 40 }, frequency: Math.floor(totalPasses * 0.25), success: successRate > 80 },
        { from: { x: 50, y: 50 }, to: { x: 70, y: 60 }, frequency: Math.floor(totalPasses * 0.25), success: successRate > 80 },
        { from: { x: 50, y: 50 }, to: { x: 30, y: 50 }, frequency: Math.floor(totalPasses * 0.2), success: successRate > 85 },
        { from: { x: 50, y: 50 }, to: { x: 75, y: 50 }, frequency: Math.floor(progressivePasses * 0.8), success: successRate > 75 },
        { from: { x: 50, y: 50 }, to: { x: 85, y: 50 }, frequency: Math.floor(progressivePasses * 0.3), success: successRate > 60 }
      );
    } else if (position.includes('FW')) {
      // Attaquant - passes courtes et centres
      passMapData.push(
        { from: { x: 75, y: 50 }, to: { x: 85, y: 45 }, frequency: Math.floor(totalPasses * 0.3), success: successRate > 70 },
        { from: { x: 75, y: 50 }, to: { x: 85, y: 55 }, frequency: Math.floor(totalPasses * 0.3), success: successRate > 70 },
        { from: { x: 75, y: 50 }, to: { x: 60, y: 50 }, frequency: Math.floor(totalPasses * 0.25), success: successRate > 80 },
        { from: { x: 75, y: 50 }, to: { x: 70, y: 30 }, frequency: Math.floor(totalPasses * 0.15), success: successRate > 65 }
      );
    }
    
    return passMapData;
  }

  // Générer les zones d'activité défensive
  generateDefensiveZones(player: PlayerData): HeatmapPoint[] {
    const tackles = player.Tkl || 0;
    const interceptions = player.Int || 0;
    const clearances = player.Clr || 0;
    
    const defensiveZones: HeatmapPoint[] = [];
    
    if (tackles > 15) {
      defensiveZones.push(
        { x: 40, y: 50, intensity: 80, actions: tackles },
        { x: 35, y: 40, intensity: 60, actions: Math.floor(tackles * 0.4) },
        { x: 35, y: 60, intensity: 60, actions: Math.floor(tackles * 0.4) }
      );
    }
    
    if (interceptions > 10) {
      defensiveZones.push(
        { x: 45, y: 50, intensity: 70, actions: interceptions },
        { x: 50, y: 45, intensity: 50, actions: Math.floor(interceptions * 0.5) },
        { x: 50, y: 55, intensity: 50, actions: Math.floor(interceptions * 0.5) }
      );
    }
    
    return defensiveZones;
  }

  // Générer les zones d'activité offensive
  generateOffensiveZones(player: PlayerData): HeatmapPoint[] {
    const shots = player.Sh || 0;
    const goals = player.Gls || 0;
    const assists = player.Ast || 0;
    const progressivePasses = player.PrgP || 0;
    
    const offensiveZones: HeatmapPoint[] = [];
    
    if (shots > 20) {
      offensiveZones.push(
        { x: 80, y: 50, intensity: 90, actions: shots },
        { x: 75, y: 45, intensity: 70, actions: Math.floor(shots * 0.4) },
        { x: 75, y: 55, intensity: 70, actions: Math.floor(shots * 0.4) }
      );
    }
    
    if (goals > 5) {
      offensiveZones.push(
        { x: 85, y: 50, intensity: 95, actions: goals * 5 }, // Multiplier pour l'impact visuel
        { x: 82, y: 48, intensity: 80, actions: goals * 3 },
        { x: 82, y: 52, intensity: 80, actions: goals * 3 }
      );
    }
    
    if (progressivePasses > 30) {
      offensiveZones.push(
        { x: 70, y: 40, intensity: 75, actions: progressivePasses },
        { x: 70, y: 60, intensity: 75, actions: progressivePasses },
        { x: 65, y: 50, intensity: 65, actions: Math.floor(progressivePasses * 0.6) }
      );
    }
    
    return offensiveZones;
  }
}

export const heatmapService = new HeatmapService();