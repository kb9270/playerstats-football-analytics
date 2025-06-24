import { useQuery } from "@tanstack/react-query";
import type { Player, PlayerStats, ScoutingReport } from "@shared/schema";

export function usePlayerStats(playerId: number) {
  const { data: player, isLoading: playerLoading, error: playerError } = useQuery({
    queryKey: [`/api/players/${playerId}`],
    enabled: !isNaN(playerId),
  });

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: [`/api/players/${playerId}/stats`],
    enabled: !isNaN(playerId),
  });

  const { data: scoutingReport, isLoading: scoutingLoading, error: scoutingError } = useQuery({
    queryKey: [`/api/players/${playerId}/scouting`],
    enabled: !isNaN(playerId),
  });

  return {
    player: player as Player | undefined,
    stats: stats as PlayerStats[] | undefined,
    scoutingReport: scoutingReport as ScoutingReport | undefined,
    isLoading: playerLoading || statsLoading || scoutingLoading,
    error: playerError || statsError || scoutingError,
  };
}
