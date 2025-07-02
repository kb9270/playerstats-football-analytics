import React from 'react';

interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  actions: number;
}

interface HeatmapProps {
  data: HeatmapPoint[];
  title: string;
  type?: 'general' | 'defensive' | 'offensive';
}

const Heatmap: React.FC<HeatmapProps> = ({ data, title, type = 'general' }) => {
  const getColorByType = (intensity: number, type: string) => {
    const alpha = intensity / 100;
    
    switch (type) {
      case 'defensive':
        return `rgba(220, 38, 127, ${alpha})`; // Rose défensif
      case 'offensive':
        return `rgba(34, 197, 94, ${alpha})`; // Vert offensif
      default:
        return `rgba(59, 130, 246, ${alpha})`; // Bleu général
    }
  };

  const getRadius = (actions: number) => {
    return Math.max(8, Math.min(25, actions / 10)); // Rayon entre 8 et 25px
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4 text-center">{title}</h3>
      
      {/* Terrain de football */}
      <div className="relative bg-green-700 rounded-lg overflow-hidden" style={{ aspectRatio: '1.5/1' }}>
        {/* Lignes du terrain */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 67"
          preserveAspectRatio="none"
        >
          {/* Contour du terrain */}
          <rect x="0" y="0" width="100" height="67" fill="none" stroke="white" strokeWidth="0.3" />
          
          {/* Ligne médiane */}
          <line x1="50" y1="0" x2="50" y2="67" stroke="white" strokeWidth="0.2" />
          
          {/* Cercle central */}
          <circle cx="50" cy="33.5" r="6" fill="none" stroke="white" strokeWidth="0.2" />
          
          {/* Surface de réparation gauche */}
          <rect x="0" y="13.5" width="16.5" height="40" fill="none" stroke="white" strokeWidth="0.2" />
          <rect x="0" y="24.5" width="5.5" height="18" fill="none" stroke="white" strokeWidth="0.2" />
          
          {/* Surface de réparation droite */}
          <rect x="83.5" y="13.5" width="16.5" height="40" fill="none" stroke="white" strokeWidth="0.2" />
          <rect x="94.5" y="24.5" width="5.5" height="18" fill="none" stroke="white" strokeWidth="0.2" />
          
          {/* Points de penalty */}
          <circle cx="11" cy="33.5" r="0.5" fill="white" />
          <circle cx="89" cy="33.5" r="0.5" fill="white" />
        </svg>
        
        {/* Points de heatmap */}
        {data.map((point, index) => (
          <div
            key={index}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: `${getRadius(point.actions)}px`,
              height: `${getRadius(point.actions)}px`,
              backgroundColor: getColorByType(point.intensity, type),
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
            title={`${point.actions} actions (${point.intensity}% intensité)`}
          >
            {point.actions > 30 ? point.actions : ''}
          </div>
        ))}
      </div>
      
      {/* Légende */}
      <div className="mt-3 flex justify-center">
        <div className="flex items-center space-x-4 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getColorByType(90, type) }}
            />
            <span>Très actif</span>
          </div>
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getColorByType(60, type) }}
            />
            <span>Actif</span>
          </div>
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: getColorByType(30, type) }}
            />
            <span>Peu actif</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;