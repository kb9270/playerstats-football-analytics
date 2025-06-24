import { useMemo } from "react";

interface HeatmapProps {
  data: Record<string, number>;
  title: string;
  playerColor?: string;
}

interface HeatmapCell {
  label: string;
  value: number;
  color: string;
  intensity: number;
}

export default function EnhancedHeatmap({ data, title, playerColor = "blue" }: HeatmapProps) {
  const heatmapData = useMemo(() => {
    const entries = Object.entries(data);
    if (entries.length === 0) return [];

    const maxValue = Math.max(...entries.map(([, value]) => value));
    const minValue = Math.min(...entries.map(([, value]) => value));
    const range = maxValue - minValue || 1;

    return entries.map(([key, value]) => {
      const intensity = (value - minValue) / range;
      
      // Color based on intensity level with multiple colors
      let color: string;
      let colorClass: string;
      
      if (intensity >= 0.8) {
        // Excellent - Bright Green
        color = '#22c55e';
        colorClass = 'text-green-100';
      } else if (intensity >= 0.6) {
        // Good - Blue
        color = '#3b82f6';
        colorClass = 'text-blue-100';
      } else if (intensity >= 0.4) {
        // Average - Yellow
        color = '#eab308';
        colorClass = 'text-yellow-100';
      } else if (intensity >= 0.2) {
        // Below Average - Orange
        color = '#f97316';
        colorClass = 'text-orange-100';
      } else {
        // Poor - Red
        color = '#ef4444';
        colorClass = 'text-red-100';
      }

      return {
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color,
        colorClass,
        intensity
      };
    }).sort((a, b) => b.value - a.value); // Sort by value descending
  }, [data]);

  if (heatmapData.length === 0) {
    return (
      <div className="stats-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
        <p className="text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="stats-card p-6">
      <h3 className="text-lg font-semibold mb-6 text-white">{title}</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {heatmapData.map((cell, index) => (
          <div
            key={cell.label}
            className="relative overflow-hidden rounded-xl border border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${cell.color}20, ${cell.color}40)`,
              borderColor: `${cell.color}60`,
            }}
          >
            {/* Background intensity indicator */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `linear-gradient(to right, transparent 0%, ${cell.color} ${cell.intensity * 100}%)`,
              }}
            />
            
            {/* Content */}
            <div className="relative p-4 text-center">
              {/* Value with dynamic color */}
              <div
                className={`text-2xl font-bold mb-2 ${cell.colorClass}`}
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
              >
                {typeof cell.value === 'number' ? cell.value.toFixed(1) : cell.value}
              </div>
              
              {/* Label */}
              <div className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                {cell.label}
              </div>
              
              {/* Intensity bar */}
              <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cell.intensity * 100}%`,
                    backgroundColor: cell.color,
                    boxShadow: `0 0 8px ${cell.color}80`,
                  }}
                />
              </div>
              
              {/* Percentile indicator */}
              <div className="mt-2 text-xs font-semibold" style={{ color: cell.color }}>
                {Math.round(cell.intensity * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-400">Faible (0-20%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-gray-400">Moyen- (20-40%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-400">Moyen (40-60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-400">Bon (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-400">Excellent (80-100%)</span>
        </div>
      </div>
    </div>
  );
}