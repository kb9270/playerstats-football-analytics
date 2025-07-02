
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
    const position = player.Pos || 'MF';
    const minutes = Number(player.Min || 0);
    const games = Number(player.MP || 1);

    // Universal weaknesses applicable to all players
    if (Number(player.xG || 0) < 0.2) out.push("Trop peu de tirs dangereux (xG bas)");
    if (Number(player.xAG || 0) < 0.15) out.push("Création limitée d'occasions");
    if (Number(player.Succ || 0) < 1.0) out.push("Manque de percussion balle au pied");
    if (Number(player.PrgP || 0) < 1.0) out.push("Peu de passes clés / décalages");
    if (Number(player.Tkl || 0) < 0.5) out.push("Implication défensive faible");

    // Position-specific weaknesses
    if (position.includes('FW')) {
      if (Number(player.Gls || 0) < 5) out.push("Efficacité devant le but à améliorer");
      if (Number(player['SoT%'] || 0) < 40) out.push("Précision des tirs insuffisante");
    }

    if (position.includes('MF')) {
      if (Number(player['Cmp%'] || 0) < 80) out.push("Précision des passes perfectible");
      if (Number(player.Ast || 0) < 2) out.push("Contribution en passes décisives limitée");
    }

    if (position.includes('DF')) {
      if (Number(player.Int || 0) < 10) out.push("Lecture du jeu défensive à développer");
      if (Number(player.Clr || 0) < 20) out.push("Interventions défensives insuffisantes");
    }

    // Playing time and consistency issues
    if (minutes / games < 60) out.push("Temps de jeu insuffisant - régularité à améliorer");
    if (Number(player.CrdY || 0) > 8) out.push("Discipline tactique à revoir (cartons jaunes)");

    // Physical and technical aspects
    if (Number(player['Won%'] || 0) < 50) out.push("Duels aériens à renforcer");
    if (Number(player.Touches || 0) / games < 30) out.push("Implication dans le jeu collectif limitée");

    return out.length > 0 ? out : ["Profil équilibré sans faiblesse majeure"];
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

    // Specific suggestions based on weaknesses
    weaknesses.forEach(weakness => {
      if (weakness.includes('but') || weakness.includes('tirs') || weakness.includes('finition')) {
        suggestions.push('Séances de finition intensive avec situations variées');
        suggestions.push('Travail du placement et timing dans la surface');
      } else if (weakness.includes('passe') || weakness.includes('créativité') || weakness.includes('précision')) {
        suggestions.push('Exercices de passes sous pression et vision périphérique');
        suggestions.push('Analyse vidéo des meilleurs passeurs du poste');
      } else if (weakness.includes('défensive') || weakness.includes('duels') || weakness.includes('pressing')) {
        suggestions.push('Renforcement physique et travail du timing défensif');
        suggestions.push('Positionnement tactique et lecture du jeu adverse');
      } else if (weakness.includes('temps de jeu') || weakness.includes('régularité')) {
        suggestions.push('Améliorer la condition physique et mentale');
        suggestions.push('Développer la polyvalence tactique');
      } else if (weakness.includes('percussion') || weakness.includes('dribbles')) {
        suggestions.push('Travail technique individuel et feintes');
        suggestions.push('Renforcement de la confiance en 1v1');
      } else if (weakness.includes('discipline') || weakness.includes('cartons')) {
        suggestions.push('Formation tactique sur le contrôle émotionnel');
        suggestions.push('Améliorer la lecture des phases de jeu dangereuses');
      }
    });

    // Position-specific comprehensive suggestions
    if (position.includes('FW')) {
      suggestions.push('Diversifier les types de courses et améliorer le jeu dos au but');
      suggestions.push('Développer le jeu de tête et les reprises de volée');
      suggestions.push('Travailler les combinaisons courtes avec les milieux');
    } else if (position.includes('MF')) {
      suggestions.push('Équilibrer contribution offensive et défensive');
      suggestions.push('Améliorer la circulation du ballon et les changements de rythme');
      suggestions.push('Développer le leadership et la communication');
    } else if (position.includes('DF')) {
      suggestions.push('Améliorer la relance longue et le jeu aérien');
      suggestions.push('Perfectionner les sorties de balle sous pression');
      suggestions.push('Renforcer l\'anticipation et la couverture');
    } else if (position.includes('GK')) {
      suggestions.push('Améliorer la distribution et le jeu au pied');
      suggestions.push('Travailler les sorties aériennes et le positionnement');
    }

    // General development suggestions
    suggestions.push('Analyse vidéo personnalisée des performances');
    suggestions.push('Préparation physique spécifique au poste');
    suggestions.push('Travail mental avec préparateur spécialisé');

    return [...new Set(suggestions)].slice(0, 6);
  }
}
