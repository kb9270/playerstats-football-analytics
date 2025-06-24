import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";
import type { ScoutingReport } from "@shared/schema";

interface ScoutingReportProps {
  report: ScoutingReport;
}

export default function ScoutingReport({ report }: ScoutingReportProps) {
  const percentiles = report.percentiles as Record<string, number>;
  
  // Map of stat keys to display names
  const statDisplayNames: Record<string, string> = {
    goals: "Buts (sans les penaltys)",
    assists: "Passes décisives",
    keyPasses: "Occasions de marquer",
    progressivePasses: "Créer des occasions",
    dribblesCompleted: "Dribbles réussis",
    tacklesWon: "Actions défensives",
    interceptions: "Limiter le déchet",
    passCompletionRate: "Qualité dans la percussion",
    touches: "Influence avec le ballon",
    progressiveCarries: "Possessions progressives",
    finalThirdPasses: "Influence par la passe",
    aerialsWon: "Centres",
    blocks: "Actions défensives",
    clearances: "Limiter le déchet",
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return "bg-green-500";
    if (percentile >= 60) return "bg-yellow-500";
    if (percentile >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getPercentileGradient = (percentile: number) => {
    return `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`;
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="mb-6">
        <p className="text-gray-300 text-sm mb-2">
          EN COMPARAISON AUX JOUEURS ÉVOLUANT AU MÊME POSTE - SAISON {report.season?.toUpperCase()}
        </p>
        <p className="text-gray-400 text-xs">
          STATISTIQUES PAR 90' & CENTILE
        </p>
      </div>

      {/* Percentile Stats */}
      <div className="space-y-4">
        {Object.entries(percentiles).map(([statKey, percentile]) => {
          const displayName = statDisplayNames[statKey] || statKey;
          const numericPercentile = typeof percentile === 'number' ? percentile : 0;
          
          return (
            <div key={statKey} className="flex items-center justify-between py-3 border-b border-gray-700/50">
              <div className="flex-1">
                <div className="font-medium text-white">{displayName}</div>
              </div>
              <div className="flex-1 mx-8">
                <div className="relative h-6 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(Math.max(numericPercentile, 0), 100)}%`,
                      background: getPercentileGradient(numericPercentile),
                    }}
                  />
                </div>
              </div>
              <div className="w-16 text-right">
                <Badge
                  className={`${getPercentileColor(numericPercentile)} text-white font-bold`}
                  variant="secondary"
                >
                  {Math.round(numericPercentile)}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Rating */}
      {report.overallRating && (
        <Card className="bg-stats-accent/10 border-stats-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-stats-accent mb-1">Note Globale</h4>
                <div className="text-sm text-gray-400">Basée sur tous les percentiles</div>
              </div>
              <div className="text-3xl font-bold text-stats-accent">
                {Math.round(report.overallRating)}/100
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths and Weaknesses */}
      {(report.strengths || report.weaknesses) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.strengths && Array.isArray(report.strengths) && report.strengths.length > 0 && (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-green-400 mb-3">Points Forts</h4>
                <div className="space-y-2">
                  {report.strengths.map((strength, index) => (
                    <Badge key={index} variant="outline" className="border-green-500/50 text-green-400">
                      {strength as string}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {report.weaknesses && Array.isArray(report.weaknesses) && report.weaknesses.length > 0 && (
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-red-400 mb-3">Points Faibles</h4>
                <div className="space-y-2">
                  {report.weaknesses.map((weakness, index) => (
                    <Badge key={index} variant="outline" className="border-red-500/50 text-red-400">
                      {weakness as string}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Info Box */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <strong>Info:</strong> Un 95 signifie que le joueur est meilleur que 95% des joueurs dans cette catégorie. 
              Toutes les statistiques sont ramenées à 90 minutes.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
