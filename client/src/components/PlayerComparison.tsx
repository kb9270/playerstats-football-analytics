import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonMetric {
  name: string;
  displayName: string;
  player1Value: number;
  player2Value: number;
  player1Percentile: number;
  player2Percentile: number;
  unit?: string;
  format?: 'decimal' | 'percentage' | 'integer';
}

interface MarketValue {
  value: number;
  currency: string;
  trend: 'rising' | 'stable' | 'falling';
  lastUpdate: string;
  formatted: string;
}

interface PlayerInfo {
  name: string;
  age: number;
  position: string;
  team: string;
  league: string;
}

interface ComparisonData {
  player1: any;
  player2: any;
  metrics: ComparisonMetric[];
  summary: {
    player1Advantages: string[];
    player2Advantages: string[];
    overallWinner: 'player1' | 'player2' | 'tied';
  };
  marketValues: {
    player1: MarketValue;
    player2: MarketValue;
  };
}

interface PlayerComparisonProps {
  data: ComparisonData;
}

const PlayerComparison: React.FC<PlayerComparisonProps> = ({ data }) => {
  const formatValue = (value: number, format?: string, unit?: string) => {
    let formatted = '';
    switch (format) {
      case 'decimal':
        formatted = value.toFixed(1);
        break;
      case 'percentage':
        formatted = value.toFixed(1);
        break;
      case 'integer':
        formatted = value.toString();
        break;
      default:
        formatted = value.toString();
    }
    return unit ? `${formatted}${unit}` : formatted;
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return 'text-green-400';
    if (percentile >= 60) return 'text-yellow-400';
    if (percentile >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPercentileBarColor = (percentile: number) => {
    if (percentile >= 80) return 'bg-green-500';
    if (percentile >= 60) return 'bg-yellow-500';
    if (percentile >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'falling':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getWinnerStyle = (winner: string) => {
    switch (winner) {
      case 'player1':
        return 'border-l-4 border-blue-500 bg-blue-900/20';
      case 'player2':
        return 'border-r-4 border-purple-500 bg-purple-900/20';
      default:
        return 'bg-gray-800/50';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Comparaison de Joueurs</h2>
        <div className="flex justify-center items-center space-x-4">
          <div className="text-blue-400 font-semibold">{data.player1.Player}</div>
          <div className="text-gray-400">VS</div>
          <div className="text-purple-400 font-semibold">{data.player2.Player}</div>
        </div>
      </div>

      {/* Informations générales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Joueur 1 */}
        <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
          <h3 className="text-xl font-bold text-blue-400 mb-3">{data.player1.Player}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Âge:</span>
              <span className="text-white">{data.player1.Age} ans</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Position:</span>
              <span className="text-white">{data.player1.Pos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Équipe:</span>
              <span className="text-white">{data.player1.Squad}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Ligue:</span>
              <span className="text-white">{data.player1.Comp}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="text-gray-300">Valeur marchande:</span>
              <div className="flex items-center space-x-1">
                <span className="text-green-400 font-bold">{data.marketValues.player1.formatted}</span>
                {getTrendIcon(data.marketValues.player1.trend)}
              </div>
            </div>
          </div>
        </div>

        {/* Joueur 2 */}
        <div className="bg-gray-800 rounded-lg p-4 border-r-4 border-purple-500">
          <h3 className="text-xl font-bold text-purple-400 mb-3">{data.player2.Player}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Âge:</span>
              <span className="text-white">{data.player2.Age} ans</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Position:</span>
              <span className="text-white">{data.player2.Pos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Équipe:</span>
              <span className="text-white">{data.player2.Squad}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Ligue:</span>
              <span className="text-white">{data.player2.Comp}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="text-gray-300">Valeur marchande:</span>
              <div className="flex items-center space-x-1">
                <span className="text-green-400 font-bold">{data.marketValues.player2.formatted}</span>
                {getTrendIcon(data.marketValues.player2.trend)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Résultat de la comparaison */}
      <div className={`rounded-lg p-4 mb-6 text-center ${getWinnerStyle(data.summary.overallWinner)}`}>
        <h3 className="text-lg font-semibold text-white mb-2">
          {data.summary.overallWinner === 'player1' 
            ? `${data.player1.Player} domine globalement`
            : data.summary.overallWinner === 'player2'
            ? `${data.player2.Player} domine globalement`
            : 'Match nul - Joueurs équivalents'
          }
        </h3>
      </div>

      {/* Métriques détaillées */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Statistiques détaillées</h3>
        
        {data.metrics.map((metric, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-white">{metric.displayName}</h4>
              <div className="text-sm text-gray-400">
                {metric.unit && `Unité: ${metric.unit}`}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Joueur 1 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-blue-400 font-medium">{data.player1.Player}</span>
                  <span className="text-white font-bold">
                    {formatValue(metric.player1Value, metric.format, metric.unit)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getPercentileBarColor(metric.player1Percentile)}`}
                      style={{ width: `${metric.player1Percentile}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${getPercentileColor(metric.player1Percentile)}`}>
                    {metric.player1Percentile}%
                  </span>
                </div>
              </div>
              
              {/* Joueur 2 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-purple-400 font-medium">{data.player2.Player}</span>
                  <span className="text-white font-bold">
                    {formatValue(metric.player2Value, metric.format, metric.unit)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getPercentileBarColor(metric.player2Percentile)}`}
                      style={{ width: `${metric.player2Percentile}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${getPercentileColor(metric.player2Percentile)}`}>
                    {metric.player2Percentile}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Points forts et faibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-400 mb-3">
            Avantages de {data.player1.Player}
          </h4>
          <ul className="space-y-1">
            {data.summary.player1Advantages.map((advantage, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"/>
                {advantage}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="font-semibold text-purple-400 mb-3">
            Avantages de {data.player2.Player}
          </h4>
          <ul className="space-y-1">
            {data.summary.player2Advantages.map((advantage, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"/>
                {advantage}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlayerComparison;