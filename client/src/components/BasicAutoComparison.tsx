import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Trophy, Target } from 'lucide-react';

interface BasicAutoComparisonProps {
  data: any;
}

export default function BasicAutoComparison({ data }: BasicAutoComparisonProps) {
  if (!data || !data.success || !data.comparisons) {
    return (
      <div className="text-center py-8">
        <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune comparaison disponible</h3>
        <p className="text-gray-400">
          Données de comparaison non disponibles
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
          {data.message || 'Joueurs similaires trouvés'}
        </p>
      </div>

      {data.comparisons.length > 0 && data.comparisons.map((comparison: any, index: number) => (
        <Card key={index} className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span className="text-white">
                  {comparison.targetPlayer?.name || 'Joueur 1'}
                </span>
                <span className="text-gray-400">vs</span>
                <span className="text-white">
                  {comparison.similarPlayer?.name || 'Joueur 2'}
                </span>
              </div>
              <Badge variant="secondary" className="ml-2">
                {Math.round(((comparison.similarPlayer?.similarity || 0.5) * 100))}% similaire
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-300 mb-2">
                  {comparison.targetPlayer?.name || 'Joueur cible'}
                </h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <p><span className="font-medium">Âge:</span> {comparison.targetPlayer?.age || 'N/A'} ans</p>
                  <p><span className="font-medium">Poste:</span> {comparison.targetPlayer?.position || 'N/A'}</p>
                  <p><span className="font-medium">Équipe:</span> {comparison.targetPlayer?.team || 'N/A'}</p>
                  <p><span className="font-medium">Championnat:</span> {comparison.targetPlayer?.league || 'N/A'}</p>
                </div>
              </div>
              
              <div className="bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-green-300 mb-2">
                  {comparison.similarPlayer?.name || 'Joueur similaire'}
                </h4>
                <div className="space-y-1 text-sm text-gray-300">
                  <p><span className="font-medium">Âge:</span> {comparison.similarPlayer?.age || 'N/A'} ans</p>
                  <p><span className="font-medium">Poste:</span> {comparison.similarPlayer?.position || 'N/A'}</p>
                  <p><span className="font-medium">Équipe:</span> {comparison.similarPlayer?.team || 'N/A'}</p>
                  <p><span className="font-medium">Championnat:</span> {comparison.similarPlayer?.league || 'N/A'}</p>
                </div>
              </div>
            </div>

            {comparison.metrics && comparison.metrics.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-3 text-white">Comparaison statistiques</h4>
                <div className="grid gap-3">
                  {comparison.metrics.slice(0, 5).map((metric: any, metricIndex: number) => (
                    <div key={metricIndex} className="flex justify-between items-center bg-gray-700/50 p-3 rounded">
                      <span className="font-medium text-sm text-gray-300">
                        {metric.displayName || 'Statistique'}
                      </span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-blue-400">
                          {(metric.player1Value || 0).toFixed(1)}
                        </span>
                        <span className="text-green-400">
                          {(metric.player2Value || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <Badge 
                variant="default"
                className="text-lg py-2 px-4 bg-blue-600 text-white"
              >
                Analyse terminée
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}