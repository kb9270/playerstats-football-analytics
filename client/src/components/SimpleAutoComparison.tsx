import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Target } from 'lucide-react';

interface SimpleAutoComparisonProps {
  data: any;
}

export default function SimpleAutoComparison({ data }: SimpleAutoComparisonProps) {
  if (!data || !data.success || !data.comparisons || data.comparisons.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune comparaison disponible</h3>
        <p className="text-gray-400">
          {data?.message || 'Aucun joueur similaire trouvé pour cette comparaison.'}
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
        <p className="text-gray-400">
          {data.message}
        </p>
      </div>

      {data.comparisons.map((comparison: any, index: number) => (
        <Card key={`comparison-${index}-${comparison.similarPlayer?.name || 'unknown'}`} className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span className="text-white">{comparison.targetPlayer.name}</span>
                <span className="text-gray-400">vs</span>
                <span className="text-white">{comparison.similarPlayer.name}</span>
              </div>
              <Badge variant="secondary" className="ml-2">
                {Math.round((comparison.similarPlayer.similarity || 0.5) * 100)}% de similarité
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Infos des joueurs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-300 mb-2">
                  {comparison.targetPlayer.name}
                </h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <p><span className="font-medium">Âge:</span> {comparison.targetPlayer.age} ans</p>
                  <p><span className="font-medium">Poste:</span> {comparison.targetPlayer.position}</p>
                  <p><span className="font-medium">Équipe:</span> {comparison.targetPlayer.team}</p>
                  <p><span className="font-medium">Championnat:</span> {comparison.targetPlayer.league}</p>
                  <p><span className="font-medium">Valeur:</span> {comparison.targetPlayer.marketValue}</p>
                </div>
              </div>
              
              <div className="bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-green-300 mb-2">
                  {comparison.similarPlayer.name}
                </h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <p><span className="font-medium">Âge:</span> {comparison.similarPlayer.age} ans</p>
                  <p><span className="font-medium">Poste:</span> {comparison.similarPlayer.position}</p>
                  <p><span className="font-medium">Équipe:</span> {comparison.similarPlayer.team}</p>
                  <p><span className="font-medium">Championnat:</span> {comparison.similarPlayer.league}</p>
                  <p><span className="font-medium">Valeur:</span> {comparison.similarPlayer.marketValue}</p>
                </div>
              </div>
            </div>

            {/* Métriques principales */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg mb-3 text-white">Comparaison des statistiques</h4>
              <div className="grid gap-3">
                {comparison.metrics && comparison.metrics.slice(0, 6).map((metric: any, metricIndex: number) => (
                  <div key={`metric-${metricIndex}-${metric.name || metricIndex}`} className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
                    <span className="font-medium text-sm text-gray-300">{metric.displayName || 'Statistique'}</span>
                    <div className="flex gap-4 text-sm">
                      <span className={`${
                        (metric.player1Value || 0) > (metric.player2Value || 0)
                          ? 'text-blue-400 font-semibold' 
                          : 'text-gray-300'
                      }`}>
                        {metric.format === 'percentage' 
                          ? `${(metric.player1Value || 0).toFixed(1)}%` 
                          : (metric.player1Value || 0).toFixed(metric.format === 'integer' ? 0 : 1)
                        }{metric.unit || ''}
                      </span>
                      <span className={`${
                        (metric.player2Value || 0) > (metric.player1Value || 0)
                          ? 'text-green-400 font-semibold' 
                          : 'text-gray-300'
                      }`}>
                        {metric.format === 'percentage' 
                          ? `${(metric.player2Value || 0).toFixed(1)}%` 
                          : (metric.player2Value || 0).toFixed(metric.format === 'integer' ? 0 : 1)
                        }{metric.unit || ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Résumé */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-900/20 p-4 rounded-lg">
                <h5 className="font-semibold text-blue-300 mb-2">
                  Forces de {comparison.targetPlayer.name}
                </h5>
                <ul className="space-y-1 text-sm">
                  {comparison.summary?.player1Advantages?.slice(0, 4).map((advantage: string, i: number) => (
                    <li key={`p1-adv-${i}-${advantage.substring(0, 10)}`} className="text-blue-400">• {advantage}</li>
                  ))}
                  {(!comparison.summary?.player1Advantages || comparison.summary.player1Advantages.length === 0) && (
                    <li key="p1-no-adv" className="text-gray-400 italic">Aucun avantage significatif</li>
                  )}
                </ul>
              </div>
              
              <div className="bg-green-900/20 p-4 rounded-lg">
                <h5 className="font-semibold text-green-300 mb-2">
                  Forces de {comparison.similarPlayer.name}
                </h5>
                <ul className="space-y-1 text-sm">
                  {comparison.summary?.player2Advantages?.slice(0, 4).map((advantage: string, i: number) => (
                    <li key={`p2-adv-${i}-${advantage.substring(0, 10)}`} className="text-green-400">• {advantage}</li>
                  ))}
                  {(!comparison.summary?.player2Advantages || comparison.summary.player2Advantages.length === 0) && (
                    <li key="p2-no-adv" className="text-gray-400 italic">Aucun avantage significatif</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Verdict */}
            <div className="text-center">
              <Badge 
                variant={comparison.summary?.overallWinner === 'tied' ? 'secondary' : 'default'}
                className={`text-lg py-2 px-4 ${
                  comparison.summary?.overallWinner === 'player1' 
                    ? 'bg-blue-600 text-white' 
                    : comparison.summary?.overallWinner === 'player2'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-white'
                }`}
              >
                {comparison.summary?.overallWinner === 'tied' 
                  ? 'Match nul' 
                  : comparison.summary?.overallWinner === 'player1'
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