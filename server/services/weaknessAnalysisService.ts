import { PlayerData } from "./csvDirectAnalyzer";

export class WeaknessAnalysisService {
  private static thresholds: Record<string, number> = {
    "xG": 0.2,
    "xAG": 0.15,
    "Dribbles_per90": 1.0,
    "KeyPasses_per90": 1.0,
    "Tackles_per90": 0.5,
    "Pass_Completion": 75.0,
    "Shot_Accuracy": 30.0,
    "Goals_per90": 0.3,
    "Assists_per90": 0.2
  };

  static detectWeaknesses(player: PlayerData): string[] {
    const weaknesses: string[] = [];

    // Calcul des statistiques par 90 minutes
    const minutes = Number(player.Min || 0);
    const matchesPlayed = Number(player.MP || 1);
    const goals_per90 = minutes > 0 ? (Number(player.Gls || 0) / minutes) * 90 : 0;
    const assists_per90 = minutes > 0 ? (Number(player.Ast || 0) / minutes) * 90 : 0;

    // Analyse des faiblesses offensives
    if (Number(player.xG || 0) < this.thresholds.xG) {
      weaknesses.push("Trop peu de tirs dangereux (xG bas)");
    }

    if (Number(player.xAG || 0) < this.thresholds.xAG) {
      weaknesses.push("Création limitée d'occasions");
    }

    if (goals_per90 < this.thresholds.Goals_per90 && player.Pos && !player.Pos.includes('DF') && !player.Pos.includes('GK')) {
      weaknesses.push("Production de buts insuffisante");
    }

    if (assists_per90 < this.thresholds.Assists_per90 && player.Pos && (player.Pos.includes('MF') || player.Pos.includes('FW'))) {
      weaknesses.push("Peu de passes décisives");
    }

    // Analyse technique
    if (Number(player.Succ || 0) < this.thresholds.Dribbles_per90) {
      weaknesses.push("Manque de percussion balle au pied");
    }

    if (Number(player['Cmp%'] || 0) < this.thresholds.Pass_Completion) {
      weaknesses.push("Précision de passe à améliorer");
    }

    if (Number(player['SoT%'] || 0) < this.thresholds.Shot_Accuracy && Number(player.Shots || 0) > 10) {
      weaknesses.push("Précision des tirs à améliorer");
    }

    // Analyse défensive
    if (Number(player.Tkl || 0) < this.thresholds.Tackles_per90 && player.Pos && (player.Pos.includes('DF') || player.Pos.includes('MF'))) {
      weaknesses.push("Implication défensive faible");
    }

    // Analyse physique
    if (Number(player.Fls || 0) > 2.0) {
      weaknesses.push("Trop de fautes commises - discipline à améliorer");
    }

    if (Number(player.CrdY || 0) > 5) {
      weaknesses.push("Trop de cartons jaunes");
    }

    return weaknesses.length > 0 ? weaknesses : ["Aucun point faible majeur détecté"];
  }

  static getImprovementSuggestions(player: PlayerData, weaknesses: string[]): string[] {
    const suggestions: string[] = [];

    weaknesses.forEach(weakness => {
      switch (true) {
        case weakness.includes("xG bas"):
          suggestions.push("Travailler le placement dans la surface et la finition");
          break;
        case weakness.includes("Création limitée"):
          suggestions.push("Améliorer la vision de jeu et les passes entre les lignes");
          break;
        case weakness.includes("percussion"):
          suggestions.push("Développer les techniques de dribble et la conduite de balle");
          break;
        case weakness.includes("Précision de passe"):
          suggestions.push("Renforcer la technique de passe courte et longue");
          break;
        case weakness.includes("défensive"):
          suggestions.push("Améliorer le timing des tacles et le positionnement défensif");
          break;
        case weakness.includes("discipline"):
          suggestions.push("Travailler la maîtrise de soi et éviter les fautes inutiles");
          break;
        case weakness.includes("Production de buts"):
          suggestions.push("Améliorer les mouvements dans la surface et la finition");
          break;
        case weakness.includes("passes décisives"):
          suggestions.push("Développer la créativité et la vision de la dernière passe");
          break;
        default:
          suggestions.push("Maintenir l'entraînement spécifique à cette lacune");
      }
    });

    return suggestions.length > 0 ? suggestions : ["Continuer le développement global"];
  }

  static analyzePlayerPosition(player: PlayerData): {
    expectedStrengths: string[];
    criticalAreas: string[];
  } {
    const position = player.Pos || "";
    const expectedStrengths: string[] = [];
    const criticalAreas: string[] = [];

    if (position.includes("GK")) {
      expectedStrengths.push("Arrêts", "Distribution", "Jeu au pied");
      criticalAreas.push("Concentration", "Communication");
    } else if (position.includes("DF")) {
      expectedStrengths.push("Défense", "Duels aériens", "Interceptions");
      criticalAreas.push("Relance", "Vitesse");
    } else if (position.includes("MF")) {
      expectedStrengths.push("Passes", "Vision de jeu", "Récupération");
      criticalAreas.push("Technique", "Endurance");
    } else if (position.includes("FW")) {
      expectedStrengths.push("Finition", "Vitesse", "Dribbles");
      criticalAreas.push("Placement", "Jeu dos au but");
    }

    return { expectedStrengths, criticalAreas };
  }
}

// Export par défaut pour la compatibilité
export const detectWeaknesses = WeaknessAnalysisService.detectWeaknesses.bind(WeaknessAnalysisService);
export const getImprovementSuggestions = WeaknessAnalysisService.getImprovementSuggestions.bind(WeaknessAnalysisService);