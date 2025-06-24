import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface StatsTableProps {
  playerIds: number[];
}

const statCategories = [
  { key: "goals", label: "Buts (sans les penaltys)", per90: true },
  { key: "assists", label: "Passes décisives", per90: true },
  { key: "goalsNonPenalty", label: "Buts non-penalty", per90: true },
  { key: "keyPasses", label: "Passes clés", per90: true },
  { key: "dribblesCompleted", label: "Dribbles réussis", per90: true },
  { key: "tacklesWon", label: "Tacles réussis", per90: true },
  { key: "interceptions", label: "Interceptions", per90: true },
  { key: "passCompletionRate", label: "% Passes réussies", per90: false },
  { key: "rating", label: "Note moyenne", per90: false },
];

const playerColors = [
  "rotating-color-1", // Violet
  "rotating-color-2", // Jaune  
  "rotating-color-3", // Rouge
  "rotating-color-4", // Bleu
  "rotating-color-5"  // Vert
];

export default function StatsTable({ playerIds }: StatsTableProps) {
  // Ensure stable order and consistent queries
  const sortedPlayerIds = [...playerIds].sort((a, b) => a - b);
  
  const playerQueries = sortedPlayerIds.map(id => {
    const playerQuery = useQuery({
      queryKey: [`/api/players/${id}`],
      enabled: !!id && id > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
    
    const statsQuery = useQuery({
      queryKey: [`/api/players/${id}/stats`],
      enabled: !!id && id > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
    
    return { playerQuery, statsQuery, id };
  });

  // Check if we have valid data
  const hasValidData = playerQueries.some(({ playerQuery }) => 
    playerQuery.data && !playerQuery.isError
  );

  const isLoading = playerQueries.some(({ playerQuery, statsQuery }) => 
    playerQuery.isLoading || statsQuery.isLoading
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <Skeleton className="h-4 w-48" />
            {playerIds.map((_, j) => (
              <Skeleton key={j} className="h-4 w-16" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!hasValidData && !isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Aucune donnée disponible pour la comparaison</p>
      </div>
    );
  }

  const calculatePer90 = (value: number | null, minutes: number | null) => {
    if (!value || !minutes || minutes === 0) return 0;
    return (value / minutes) * 90;
  };

  const formatStatValue = (value: number | null, per90: boolean, minutes: number | null) => {
    if (value === null || value === undefined) return "0";
    
    if (per90 && minutes) {
      const per90Value = calculatePer90(value, minutes);
      return per90Value.toFixed(2);
    }
    
    if (typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(2);
    }
    
    return value.toString();
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-700">
            <TableHead className="text-left py-4 px-2 font-medium text-gray-300">
              Statistique
            </TableHead>
            {playerQueries.map(({ playerQuery }, index) => (
              <TableHead key={index} className={`text-center py-4 px-2 font-medium ${playerColors[index]}`}>
                {playerQuery.data?.name || `Joueur ${index + 1}`}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {statCategories.map((stat) => (
            <TableRow key={stat.key} className="hover:bg-stats-dark/30 border-b border-gray-700/50">
              <TableCell className="py-4 px-2 font-medium text-white">
                {stat.label}
                {stat.per90 && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    /90'
                  </Badge>
                )}
              </TableCell>
              {playerQueries.map(({ statsQuery }, index) => {
                const statsData = statsQuery.data?.[0]; // Get most recent stats
                const statValue = statsData?.[stat.key as keyof typeof statsData] as number;
                const minutes = statsData?.minutes;
                
                return (
                  <TableCell
                    key={index}
                    className={`text-center py-4 px-2 font-bold ${playerColors[index]}`}
                  >
                    {formatStatValue(statValue, stat.per90, minutes)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
