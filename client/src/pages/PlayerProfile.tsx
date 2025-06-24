import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlayerCard from "@/components/PlayerCard";
import StatsTable from "@/components/StatsTable";
import ScoutingReport from "@/components/ScoutingReport";
import Heatmap from "@/components/Heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, User, BarChart3, Target } from "lucide-react";

export default function PlayerProfile() {
  const { id } = useParams();
  const playerId = parseInt(id as string);

  const { data: player, isLoading: playerLoading, error: playerError } = useQuery({
    queryKey: [`/api/players/${playerId}`],
    enabled: !isNaN(playerId),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/players/${playerId}/stats`],
    enabled: !isNaN(playerId),
  });

  const { data: scoutingReport, isLoading: scoutingLoading } = useQuery({
    queryKey: [`/api/players/${playerId}/scouting`],
    enabled: !isNaN(playerId),
  });

  if (isNaN(playerId)) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="stats-card p-8 text-center">
            <CardContent className="pt-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">ID de joueur invalide</h1>
              <p className="text-gray-400">Veuillez vérifier l'URL et réessayer.</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (playerError) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="stats-card p-8 text-center">
            <CardContent className="pt-6">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Joueur non trouvé</h1>
              <p className="text-gray-400">Le joueur demandé n'existe pas ou n'a pas pu être chargé.</p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          {playerLoading ? (
            <div className="flex items-center space-x-4">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-stats-accent mb-2">
                  {player?.name}
                </h1>
                <div className="flex items-center space-x-4 text-gray-300">
                  <span>{player?.team}</span>
                  <span>•</span>
                  <span>{player?.position}</span>
                  <span>•</span>
                  <span>{player?.age} ans</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-8">
            {/* Player Profile Card */}
            <Card className="stats-card">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <User className="w-6 h-6 text-stats-accent mr-3" />
                  PROFIL
                </CardTitle>
              </CardHeader>
              <CardContent>
                {playerLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <PlayerCard player={player} />
                )}
              </CardContent>
            </Card>

            {/* Basic Statistics */}
            <Card className="stats-card">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <BarChart3 className="w-6 h-6 text-stats-accent mr-3" />
                  STATISTIQUES
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="grid grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="text-center">
                        <Skeleton className="h-8 w-16 mx-auto mb-2" />
                        <Skeleton className="h-4 w-20 mx-auto" />
                      </div>
                    ))}
                  </div>
                ) : stats && stats.length > 0 ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-stats-green mb-1">
                        {stats[0].rating?.toFixed(2) || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-400">NOTE MOYENNE</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white mb-1">
                        {stats[0].matches || 0}
                      </div>
                      <div className="text-sm text-gray-400">MATCHS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-stats-accent mb-1">
                        {stats[0].goals || 0}
                      </div>
                      <div className="text-sm text-gray-400">BUTS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-stats-blue mb-1">
                        {stats[0].assists || 0}
                      </div>
                      <div className="text-sm text-gray-400">PASSES DÉCISIVES</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-stats-yellow mb-1">
                        {stats[0].minutes || 0}
                      </div>
                      <div className="text-sm text-gray-400">MINUTES</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-stats-green mb-1">
                        {((stats[0].goals || 0) + (stats[0].assists || 0)).toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-400">G+A</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Aucune statistique disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Heatmap */}
            <Card className="stats-card">
              <CardHeader>
                <CardTitle className="text-xl font-bold">HEATMAP</CardTitle>
              </CardHeader>
              <CardContent>
                <Heatmap playerId={playerId} />
              </CardContent>
            </Card>

            {/* Scouting Report */}
            <Card className="stats-card">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Target className="w-6 h-6 text-stats-accent mr-3" />
                  RAPPORT DE SCOUTING
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scoutingLoading ? (
                  <div className="space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-3">
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <div className="flex-1 mx-8">
                          <Skeleton className="h-6 w-full rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-12 rounded" />
                      </div>
                    ))}
                  </div>
                ) : scoutingReport ? (
                  <ScoutingReport report={scoutingReport} />
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Rapport de scouting non disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
