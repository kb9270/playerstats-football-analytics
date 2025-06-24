import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Calendar, MapPin, Ruler, Flag } from "lucide-react";
import type { Player } from "@shared/schema";

interface PlayerCardProps {
  player: Player;
}

export default function PlayerCard({ player }: PlayerCardProps) {
  const formatMarketValue = (value: number | null) => {
    if (!value) return "N/A";
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K€`;
    }
    
    return `${value}€`;
  };

  return (
    <div className="space-y-6 player-card p-6 rounded-2xl">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <MapPin className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-blue-300">Club:</span>
            <span className="ml-2 font-medium text-blue-100">{player.team || "N/A"}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline">{player.league || "N/A"}</Badge>
        </div>
        
        <div className="flex items-center space-x-3">
          <Calendar className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-blue-300">Âge:</span>
            <span className="ml-2 font-medium text-blue-200">
              {player.age ? `${player.age} ANS` : "N/A"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Flag className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-blue-300">Nationalité:</span>
            <span className="ml-2 font-medium text-blue-100">{player.nationality || "N/A"}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <User className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-blue-300">Poste:</span>
            <span className="ml-2 font-medium text-blue-200">
              {player.position || "N/A"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Ruler className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-blue-300">Taille:</span>
            <span className="ml-2 font-medium text-blue-100">
              {player.height ? `${player.height}M` : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Market Value */}
      {player.marketValue && (
        <Card className="bg-blue-400/10 border-blue-400/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-300 mb-1">Valeur Marchande</h4>
                <div className="text-2xl font-bold text-blue-200">
                  {formatMarketValue(player.marketValue)}
                </div>
              </div>
              {player.contractEnd && (
                <div className="text-right">
                  <div className="text-sm text-blue-400">Fin de contrat</div>
                  <div className="font-medium text-blue-200">
                    {player.contractEnd}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Physical Attributes */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-stats-dark/30 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-white mb-1">
              {player.foot || "N/A"}
            </div>
            <div className="text-sm text-gray-400">Pied Fort</div>
          </CardContent>
        </Card>
        
        <Card className="bg-stats-dark/30 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-white mb-1">
              {player.height ? `${player.height}m` : "N/A"}
            </div>
            <div className="text-sm text-gray-400">Taille</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
