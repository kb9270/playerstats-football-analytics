import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HeatmapProps {
  playerId: number;
}

export default function Heatmap({ playerId }: HeatmapProps) {
  const { data: player } = useQuery({
    queryKey: ['/api/players', playerId],
    enabled: !!playerId,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/players', playerId, 'stats'],
    enabled: !!playerId,
  });

  if (!player || !stats || stats.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Aucune donnée de heatmap disponible
        </div>
      </Card>
    );
  }

  const playerStats = stats[0];

  // Generate realistic heatmap data based on player stats and position
  const generateHeatmapData = () => {
    const data = [];
    const fieldWidth = 16;
    const fieldHeight = 10;
    
    // Determine position-based heat zones
    const position = player.position?.toLowerCase() || '';
    const isAttacker = position.includes('attaquant') || position.includes('ailier') || position.includes('avant');
    const isMidfielder = position.includes('milieu') || position.includes('centre');
    const isDefender = position.includes('défenseur') || position.includes('arrière');
    const isWinger = position.includes('ailier') || position.includes('droit') || position.includes('gauche');
    
    for (let x = 0; x < fieldWidth; x++) {
      for (let y = 0; y < fieldHeight; y++) {
        let intensity = 0;
        const centerDistance = Math.abs(x - fieldWidth/2);
        
        // Calculate base intensity based on field position
        if (y >= fieldHeight * 0.75) { // Attacking third
          if (isAttacker) {
            intensity = 0.6 + Math.random() * 0.4;
            if (x >= fieldWidth * 0.25 && x <= fieldWidth * 0.75) intensity += 0.2; // Central attacking areas
          } else if (isMidfielder) {
            intensity = 0.2 + Math.random() * 0.3;
          } else {
            intensity = Math.random() * 0.1;
          }
        } else if (y >= fieldHeight * 0.4) { // Middle third
          if (isMidfielder) {
            intensity = 0.7 + Math.random() * 0.3;
            if (centerDistance <= 2) intensity += 0.2; // Central midfield
          } else if (isWinger && (x <= 2 || x >= fieldWidth - 3)) {
            intensity = 0.5 + Math.random() * 0.4; // Wing areas
          } else if (isDefender || isAttacker) {
            intensity = 0.3 + Math.random() * 0.4;
          } else {
            intensity = 0.2 + Math.random() * 0.3;
          }
        } else { // Defensive third
          if (isDefender) {
            intensity = 0.6 + Math.random() * 0.4;
            if (x >= fieldWidth * 0.25 && x <= fieldWidth * 0.75) intensity += 0.2; // Central defense
          } else if (isMidfielder) {
            intensity = 0.2 + Math.random() * 0.3;
          } else {
            intensity = Math.random() * 0.1;
          }
        }
        
        // Adjust for wingers on flanks
        if (isWinger) {
          if (x <= 2 || x >= fieldWidth - 3) {
            intensity = Math.min(1, intensity + 0.3);
          }
        }
        
        // Smooth out the intensity
        intensity = Math.max(0, Math.min(1, intensity));
        
        data.push({ x, y, intensity });
      }
    }
    
    return data;
  };

  const heatmapData = generateHeatmapData();

  // Get color based on intensity
  const getHeatColor = (intensity: number) => {
    if (intensity < 0.2) return 'rgba(59, 130, 246, 0.3)'; // Blue - low activity
    if (intensity < 0.5) return 'rgba(34, 197, 94, 0.5)'; // Green - moderate
    if (intensity < 0.7) return 'rgba(251, 191, 36, 0.7)'; // Yellow - high
    return 'rgba(239, 68, 68, 0.9)'; // Red - very high
  };

  const getShadow = (intensity: number) => {
    if (intensity > 0.7) return '0 0 15px rgba(239, 68, 68, 0.6)';
    if (intensity > 0.5) return '0 0 10px rgba(251, 191, 36, 0.4)';
    if (intensity > 0.3) return '0 0 8px rgba(34, 197, 94, 0.3)';
    return 'none';
  };

  return (
    <Card className="bg-card/90 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="w-5 h-5 text-stats-accent" />
          Carte de Chaleur - {player.name}
          <Badge variant="secondary" className="ml-auto text-xs bg-stats-accent/20 text-stats-accent">
            {player.position}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gradient-to-b from-green-700 to-green-800 rounded-lg p-6 shadow-lg" style={{ aspectRatio: '8/5' }}>
          {/* Enhanced field markings */}
          <div className="absolute inset-0 border-2 border-white/40 rounded-lg overflow-hidden">
            {/* Center line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40 transform -translate-y-0.5"></div>
            
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/40 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Penalty areas */}
            <div className="absolute top-1/4 left-0 w-12 h-1/2 border-2 border-white/40 border-l-0"></div>
            <div className="absolute top-1/4 right-0 w-12 h-1/2 border-2 border-white/40 border-r-0"></div>
            
            {/* Goal areas */}
            <div className="absolute top-3/8 left-0 w-6 h-1/4 border-2 border-white/40 border-l-0"></div>
            <div className="absolute top-3/8 right-0 w-6 h-1/4 border-2 border-white/40 border-r-0"></div>
            
            {/* Corner arcs */}
            <div className="absolute top-0 left-0 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-full"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-b-2 border-l-2 border-white/40 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-t-2 border-r-2 border-white/40 rounded-tr-full"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-full"></div>
          </div>
          
          {/* Enhanced heatmap visualization */}
          <div className="absolute inset-0 pointer-events-none">
            {heatmapData.map((point, index) => (
              <div
                key={index}
                className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                style={{
                  left: `${(point.x / 15) * 100}%`,
                  top: `${((9 - point.y) / 9) * 100}%`,
                  width: `${8 + point.intensity * 12}px`,
                  height: `${8 + point.intensity * 12}px`,
                  backgroundColor: getHeatColor(point.intensity),
                  boxShadow: getShadow(point.intensity),
                  opacity: point.intensity > 0.1 ? 1 : 0,
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Enhanced legend */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.6)' }}></div>
              <span className="text-muted-foreground">Faible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(34, 197, 94, 0.6)' }}></div>
              <span className="text-muted-foreground">Modéré</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(251, 191, 36, 0.8)' }}></div>
              <span className="text-muted-foreground">Élevé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)' }}></div>
              <span className="text-muted-foreground">Très élevé</span>
            </div>
          </div>
          
          {/* Enhanced stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card/60 border border-border/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-stats-accent">
                {playerStats.touches || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Touches totales</div>
            </div>
            <div className="bg-card/60 border border-border/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-stats-accent">
                {playerStats.minutes || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Minutes jouées</div>
            </div>
            <div className="bg-card/60 border border-border/50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-stats-accent">
                {Math.round((playerStats.touches || 0) / ((playerStats.minutes || 90) / 90))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Touches/90min</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  // This is a placeholder for the heatmap visualization
  // In a real implementation, you would fetch positioning data
  // and render an actual heatmap using a library like D3.js or canvas
  
  return (
    <div className="aspect-[4/3] bg-stats-dark/50 rounded-lg relative overflow-hidden">
      {/* Football pitch outline */}
      <div className="absolute inset-4 border-2 border-gray-600 rounded relative">
        {/* Center line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-600"></div>
        
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-gray-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Goal areas */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-16 border border-gray-600 border-l-0"></div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-16 border border-gray-600 border-r-0"></div>
        
        {/* Penalty areas */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-16 h-32 border border-gray-600 border-l-0"></div>
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-16 h-32 border border-gray-600 border-r-0"></div>
        
        {/* Heat zones - placeholder */}
        <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-red-500/30 rounded-full blur-sm"></div>
        <div className="absolute top-1/3 left-1/3 w-12 h-12 bg-yellow-500/40 rounded-full blur-sm"></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-green-500/50 rounded-full blur-sm transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-2/3 left-2/3 w-10 h-10 bg-orange-500/35 rounded-full blur-sm"></div>
        
        {/* Placeholder text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400 bg-stats-dark/80 px-4 py-2 rounded-lg">
            <div className="text-sm font-medium">Zone d'activité du joueur</div>
            <div className="text-xs mt-1">Données de positionnement</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex items-center space-x-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500/50 rounded-full"></div>
          <span className="text-gray-400">Haute activité</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-yellow-500/40 rounded-full"></div>
          <span className="text-gray-400">Activité modérée</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500/30 rounded-full"></div>
          <span className="text-gray-400">Faible activité</span>
        </div>
      </div>
    </div>
  );
}
