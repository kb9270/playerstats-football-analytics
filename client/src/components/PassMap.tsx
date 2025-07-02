import React from 'react';

interface PassMapData {
  from: { x: number; y: number };
  to: { x: number; y: number };
  frequency: number;
  success: boolean;
}

interface PassMapProps {
  data: PassMapData[];
  title: string;
  stats: {
    totalPasses: number;
    completedPasses: number;
    successRate: number;
    progressivePasses: number;
  };
}

const PassMap: React.FC<PassMapProps> = ({ data, title, stats }) => {
  const getPassWidth = (frequency: number) => {
    const maxFreq = Math.max(...data.map(p => p.frequency));
    return Math.max(2, Math.min(8, (frequency / maxFreq) * 8));
  };

  const getPassColor = (success: boolean, frequency: number) => {
    const alpha = Math.min(1, frequency / 100);
    return success ? `rgba(34, 197, 94, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4 text-center">{title}</h3>
      
      {/* Statistiques de passes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-400">{stats.totalPasses}</div>
          <div className="text-sm text-gray-300">Total Passes</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">{stats.completedPasses}</div>
          <div className="text-sm text-gray-300">Réussies</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-400">{stats.successRate}%</div>
          <div className="text-sm text-gray-300">Réussite</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-400">{stats.progressivePasses}</div>
          <div className="text-sm text-gray-300">Progressives</div>
        </div>
      </div>
      
      {/* Terrain de football avec passes */}
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
          
          {/* Lignes de passes */}
          {data.map((pass, index) => (
            <g key={index}>
              {/* Ligne de passe */}
              <line
                x1={pass.from.x}
                y1={pass.from.y}
                x2={pass.to.x}
                y2={pass.to.y}
                stroke={getPassColor(pass.success, pass.frequency)}
                strokeWidth={getPassWidth(pass.frequency)}
                opacity="0.7"
              />
              
              {/* Flèche pour indiquer la direction */}
              <defs>
                <marker
                  id={`arrow-${index}`}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="3"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill={getPassColor(pass.success, pass.frequency)} />
                </marker>
              </defs>
              
              <line
                x1={pass.from.x}
                y1={pass.from.y}
                x2={pass.to.x}
                y2={pass.to.y}
                stroke={getPassColor(pass.success, pass.frequency)}
                strokeWidth={getPassWidth(pass.frequency)}
                opacity="0.7"
                markerEnd={`url(#arrow-${index})`}
              />
            </g>
          ))}
          
          {/* Points de départ et d'arrivée */}
          {data.map((pass, index) => (
            <g key={`points-${index}`}>
              {/* Point de départ */}
              <circle
                cx={pass.from.x}
                cy={pass.from.y}
                r="1.5"
                fill="white"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth="0.3"
              />
              
              {/* Point d'arrivée */}
              <circle
                cx={pass.to.x}
                cy={pass.to.y}
                r="1"
                fill={pass.success ? "#22c55e" : "#ef4444"}
                stroke="white"
                strokeWidth="0.2"
              />
            </g>
          ))}
        </svg>
      </div>
      
      {/* Légende */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center space-x-6 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-green-500 rounded"></div>
            <span>Passes réussies</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-red-500 rounded"></div>
            <span>Passes échouées</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Point de départ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassMap;