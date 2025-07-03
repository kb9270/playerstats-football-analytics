import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users, Trophy, Target } from 'lucide-react';

interface AutoComparisonData {
  success: boolean;
  targetPlayer: {
    name: string;
    age: number;
    position: string;
    team: string;
    league: string;
  };
  comparisons: Array<{
    targetPlayer: {
      name: string;
      age: number;
      position: string;
      team: string;
      league: string;
      marketValue: string;
    };
    similarPlayer: {
      name: string;
      age: number;
      position: string;
      team: string;
      league: string;
      marketValue: string;
      similarity: number;
    };
    metrics: Array<{
      name: string;
      displayName: string;
      player1Value: number;
      player2Value: number;
      player1Percentile: number;
      player2Percentile: number;
      unit?: string;
      format?: 'decimal' | 'percentage' | 'integer';
    }>;
    summary: {
      player1Advantages: string[];
      player2Advantages: string[];
      overallWinner: 'player1' | 'player2' | 'tied';
    };
    marketValues: {
      target: { formatted: string; trend: string };
      similar: { formatted: string; trend: string };
    };
  }>;
  message: string;
}

interface AutoPlayerComparisonProps {
  data: AutoComparisonData;
}

export default function AutoPlayerComparison({ data }: AutoPlayerComparisonProps) {
  if (!data.success || !data.comparisons || data.comparisons.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune comparaison disponible</h3>
        <p className="text-muted-foreground">
          {data.message || 'Aucun joueur similaire trouvé pour cette comparaison.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Comparaison Automatique
        </h2>
        <p className="text-muted-foreground">
          {data.message}
        </p>
      </div>

      {data.comparisons.map((comparison, index) => (
        <Card key={index} className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span>{comparison.targetPlayer.name}</span>
                <span className="text-muted-foreground">vs</span>
                <span>{comparison.similarPlayer.name}</span>
              </div>
              <Badge variant="secondary" className="ml-2">
                {Math.round(comparison.similarPlayer.similarity * 100)}% de similarité
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Infos des joueurs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                  {comparison.targetPlayer.name}
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Âge:</span> {comparison.targetPlayer.age} ans</p>
                  <p><span className="font-medium">Poste:</span> {comparison.targetPlayer.position}</p>
                  <p><span className="font-medium">Équipe:</span> {comparison.targetPlayer.team}</p>
                  <p><span className="font-medium">Championnat:</span> {comparison.targetPlayer.league}</p>
                  <p><span className="font-medium">Valeur:</span> {comparison.targetPlayer.marketValue}</p>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                  {comparison.similarPlayer.name}
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Âge:</span> {comparison.similarPlayer.age} ans</p>
                  <p><span className="font-medium">Poste:</span> {comparison.similarPlayer.position}</p>
                  <p><span className="font-medium">Équipe:</span> {comparison.similarPlayer.team}</p>
                  <p><span className="font-medium">Championnat:</span> {comparison.similarPlayer.league}</p>
                  <p><span className="font-medium">Valeur:</span> {comparison.similarPlayer.marketValue}</p>
                </div>
              </div>
            </div>

            {/* Métrics comparison */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg mb-3">Comparaison des statistiques</h4>
              <div className="grid gap-3">
                {comparison.metrics.slice(0, 8).map((metric, metricIndex) => (
                  <div key={metricIndex} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{metric.displayName}</span>
                      <div className="flex gap-4 text-sm">
                        <span className={`${
                          metric.player1Value > metric.player2Value 
                            ? 'text-blue-600 font-semibold' 
                            : 'text-muted-foreground'
                        }`}>
                          {metric.format === 'percentage' 
                            ? `${metric.player1Value.toFixed(1)}%` 
                            : metric.player1Value.toFixed(metric.format === 'integer' ? 0 : 1)
                          }{metric.unit || ''}
                        </span>
                        <span className={`${
                          metric.player2Value > metric.player1Value 
                            ? 'text-green-600 font-semibold' 
                            : 'text-muted-foreground'
                        }`}>
                          {metric.format === 'percentage' 
                            ? `${metric.player2Value.toFixed(1)}%` 
                            : metric.player2Value.toFixed(metric.format === 'integer' ? 0 : 1)
                          }{metric.unit || ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Progress 
                          value={metric.player1Percentile} 
                          className="h-2 bg-blue-100 dark:bg-blue-950"
                        />
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {metric.player1Percentile}e percentile
                        </span>
                      </div>
                      <div className="flex-1">
                        <Progress 
                          value={metric.player2Percentile} 
                          className="h-2 bg-green-100 dark:bg-green-950"
                        />
                        <span className="text-xs text-green-600 dark:text-green-400">
                          {metric.player2Percentile}e percentile
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Forces de {comparison.targetPlayer.name}
                </h5>
                <ul className="space-y-1 text-sm">
                  {comparison.summary.player1Advantages.slice(0, 5).map((advantage, i) => (
                    <li key={i} className="text-blue-600 dark:text-blue-400">• {advantage}</li>
                  ))}
                  {comparison.summary.player1Advantages.length === 0 && (
                    <li className="text-muted-foreground italic">Aucun avantage significatif</li>
                  )}
                </ul>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <h5 className="font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Forces de {comparison.similarPlayer.name}
                </h5>
                <ul className="space-y-1 text-sm">
                  {comparison.summary.player2Advantages.slice(0, 5).map((advantage, i) => (
                    <li key={i} className="text-green-600 dark:text-green-400">• {advantage}</li>
                  ))}
                  {comparison.summary.player2Advantages.length === 0 && (
                    <li className="text-muted-foreground italic">Aucun avantage significatif</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Winner badge */}
            <div className="text-center">
              <Badge 
                variant={comparison.summary.overallWinner === 'tied' ? 'secondary' : 'default'}
                className={`text-lg py-2 px-4 ${
                  comparison.summary.overallWinner === 'player1' 
                    ? 'bg-blue-600 text-white' 
                    : comparison.summary.overallWinner === 'player2'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-white'
                }`}
              >
                {comparison.summary.overallWinner === 'tied' 
                  ? 'Match nul' 
                  : comparison.summary.overallWinner === 'player1'
                  ? `${comparison.targetPlayer.name} domine`
                  : `${comparison.similarPlayer.name} domine`
                }
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}