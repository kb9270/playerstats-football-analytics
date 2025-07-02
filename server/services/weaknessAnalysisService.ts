
import { PlayerData } from './csvDirectAnalyzer';

export class WeaknessAnalysisService {
  private static getPositionThresholds(position: string): Record<string, number> {
    const pos = position.split(',')[0]; // Take first position if multiple
    
    // Position-specific thresholds based on percentiles
    const thresholds: Record<string, Record<string, number>> = {
      'FW': {
        'Gls': 5,
        'xG': 3.0,
        'Sh': 30,
        'SoT': 15,
        'G/Sh': 0.1
      },
      'MF': {
        'Ast': 3,
        'xAG': 2.0,
        'PrgP': 20,
        'Cmp%': 80,
        'Tkl': 15
      },
      'DF': {
        'Tkl': 25,
        'Int': 20,
        'Clr': 30,
        'Cmp%': 85,
        'Won%': 60
      },
      'GK': {
        'Cmp%': 70,
        'TotDist': 1000
      }
    };

    return thresholds[pos] || thresholds['MF'];
  }

  static detectWeaknesses(player: PlayerData): string[] {
    const out: string[] = [];

    if (Number(player.xG || 0) < 0.2) out.push("Trop peu de tirs dangereux (xG bas)");
    if (Number(player.xAG || 0) < 0.15) out.push("Création limitée d'occasions");
    if (Number(player.Succ || 0) < 1.0) out.push("Manque de percussion balle au pied");
    if (Number(player.PrgP || 0) < 1.0) out.push("Peu de passes clés / décalages");
    if (Number(player.Tkl || 0) < 0.5) out.push("Implication défensive faible");

    return out;
  }

  static detectWeaknessesAdvanced(player: PlayerData): string[] {
    const weaknesses: string[] = [];
    const position = player.Pos || 'MF';
    const thresholds = this.getPositionThresholds(position);
    const minutes = player.Min || 0;

    if (minutes < 90) {
      weaknesses.push('Temps de jeu insuffisant');
      return weaknesses;
    }

    // Convert to per-90 stats for fair comparison
    const factor = 90 / minutes;

    // Check each threshold
    Object.entries(thresholds).forEach(([stat, threshold]) => {
      const value = player[stat as keyof PlayerData] as number || 0;
      const per90Value = stat.includes('%') ? value : value * factor;

      if (per90Value < threshold) {
        const weaknessMessages: Record<string, string> = {
          'Gls': 'Efficacité devant le but limitée',
          'xG': 'Peu de situations dangereuses créées',
          'Ast': 'Manque de créativité dans la dernière passe',
          'xAG': 'Contribution offensive limitée',
          'Sh': 'Volume de tirs insuffisant',
          'SoT': 'Précision des tirs à améliorer',
          'G/Sh': 'Efficacité des tirs faible',
          'PrgP': 'Manque de passes progressives',
          'Cmp%': 'Précision des passes à améliorer',
          'Tkl': 'Contribution défensive limitée',
          'Int': 'Lecture du jeu défensive faible',
          'Clr': 'Manque d\'interventions défensives',
          'Won%': 'Duels aériens insuffisants',
          'TotDist': 'Distribution limitée'
        };

        const message = weaknessMessages[stat] || `${stat} insuffisant`;
        weaknesses.push(message);
      }
    });

    // Additional contextual analysis
    if (position.includes('FW')) {
      const goalsPer90 = (player.Gls || 0) * factor;
      const xGPer90 = (player.xG || 0) * factor;
      
      if (goalsPer90 < xGPer90 * 0.8) {
        weaknesses.push('Finition en-dessous des attentes');
      }
    }

    if (position.includes('MF')) {
      const assists = (player.Ast || 0) * factor;
      const xAG = (player.xAG || 0) * factor;
      
      if (assists < xAG * 0.7) {
        weaknesses.push('Dernière passe perfectible');
      }
    }

    return weaknesses.length > 0 ? weaknesses.slice(0, 4) : ['Profil équilibré'];
  }

  static getImprovementSuggestions(player: PlayerData, weaknesses: string[]): string[] {
    const suggestions: string[] = [];
    const position = player.Pos || 'MF';

    weaknesses.forEach(weakness => {
      if (weakness.includes('but') || weakness.includes('tirs')) {
        suggestions.push('Travailler la finition et le placement dans la surface');
      } else if (weakness.includes('passe') || weakness.includes('créativité')) {
        suggestions.push('Améliorer la vision de jeu et la précision des passes');
      } else if (weakness.includes('défensive') || weakness.includes('duels')) {
        suggestions.push('Renforcer le pressing et les duels');
      } else if (weakness.includes('temps de jeu')) {
        suggestions.push('Gagner en régularité pour obtenir plus de temps de jeu');
      }
    });

    // Position-specific suggestions
    if (position.includes('FW')) {
      suggestions.push('Varier les types de courses et améliorer le jeu dos au but');
    } else if (position.includes('MF')) {
      suggestions.push('Equilibrer contribution offensive et défensive');
    } else if (position.includes('DF')) {
      suggestions.push('Améliorer la relance et le jeu aérien');
    }

    return [...new Set(suggestions)].slice(0, 3);
  }
}
