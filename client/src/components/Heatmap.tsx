import { Card, CardContent } from "@/components/ui/card";

interface HeatmapProps {
  playerId: number;
}

export default function Heatmap({ playerId }: HeatmapProps) {
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
