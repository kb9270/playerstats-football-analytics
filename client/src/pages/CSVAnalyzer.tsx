import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, User, Activity, BarChart3, Zap } from "lucide-react";

export default function CSVAnalyzer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  // Récupération de la liste des ligues
  const { data: leagueStats } = useQuery({
    queryKey: ['/api/csv/leagues/stats'],
    enabled: true
  });

  // Recherche de joueur
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['/api/csv/players/search', searchQuery],
    enabled: searchQuery.length > 2
  });

  // Profil complet du joueur sélectionné
  const { data: playerProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/csv/players/profile', selectedPlayer],
    enabled: !!selectedPlayer
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // La recherche se fait automatiquement via useQuery
    }
  };

  const formatPercentile = (value: number) => {
    if (value >= 80) return "text-green-600 dark:text-green-400";
    if (value >= 60) return "text-blue-600 dark:text-blue-400";
    if (value >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Analyseur CSV de Joueurs
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explorez les données complètes de 2800+ joueurs européens avec analyses avancées, percentiles et visualisations
        </p>
      </div>

      {/* Statistiques des ligues */}
      {leagueStats?.success && (
        <Card>
          <CardHeader>
            <CardTitle>Ligues Disponibles</CardTitle>
            <CardDescription>Répartition des joueurs par championnat</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(leagueStats.leagues).map(([league, count]) => (
                <div key={league} className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{count}</div>
                  <div className="text-sm text-muted-foreground">{league}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barre de recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche de Joueur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Nom du joueur (ex: Messi, Mbappé, Haaland...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Recherche..." : "Rechercher"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Résultats de recherche */}
      {searchResults?.success && (
        <Card>
          <CardHeader>
            <CardTitle>Joueur Trouvé</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
              onClick={() => setSelectedPlayer(searchResults.player.Player)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{searchResults.player.Player}</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchResults.player.Squad} • {searchResults.player.Pos} • {searchResults.player.Age} ans
                  </p>
                </div>
                <Badge variant="outline">{searchResults.player.Comp}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profil complet du joueur */}
      {isLoadingProfile && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">Chargement du profil complet...</div>
          </CardContent>
        </Card>
      )}

      {playerProfile?.success && (
        <div className="space-y-6">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {playerProfile.profile.informations_personnelles.nom}
              </CardTitle>
              <CardDescription>
                {playerProfile.profile.informations_personnelles.position} • {playerProfile.profile.informations_personnelles.equipe}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.profile.informations_personnelles.age}</div>
                  <div className="text-sm text-muted-foreground">Âge</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.profile.informations_personnelles.nationalite}</div>
                  <div className="text-sm text-muted-foreground">Nationalité</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.profile.informations_personnelles.championnat}</div>
                  <div className="text-sm text-muted-foreground">Championnat</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.profile.note_globale}/100</div>
                  <div className="text-sm text-muted-foreground">Note Globale</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques de base */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistiques de Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.profile.statistiques_base.matchs_joues}</div>
                  <div className="text-sm text-muted-foreground">Matchs</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.profile.statistiques_base.buts}</div>
                  <div className="text-sm text-muted-foreground">Buts</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.profile.statistiques_base.passes_d}</div>
                  <div className="text-sm text-muted-foreground">Passes D.</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.profile.statistiques_base.minutes}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Percentiles */}
          {playerProfile.profile.percentiles && Object.keys(playerProfile.profile.percentiles).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Percentiles vs Position
                </CardTitle>
                <CardDescription>Performance comparée aux joueurs du même poste</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(playerProfile.profile.percentiles).map(([stat, value]) => (
                    <div key={stat} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{stat}</span>
                        <span className={`text-sm font-medium ${formatPercentile(value as number)}`}>
                          {value}e percentile
                        </span>
                      </div>
                      <Progress value={value as number} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Style de jeu et analyse */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Style de Jeu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-lg p-2">
                  {playerProfile.profile.style_jeu}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forces & Faiblesses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">Forces</h4>
                  <div className="flex flex-wrap gap-2">
                    {playerProfile.profile.forces.map((force: string, index: number) => (
                      <Badge key={index} variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                        {force}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Faiblesses</h4>
                  <div className="flex flex-wrap gap-2">
                    {playerProfile.profile.faiblesses.map((faiblesse: string, index: number) => (
                      <Badge key={index} variant="outline" className="border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
                        {faiblesse}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zones d'activité */}
          {playerProfile.profile.zones_activite && (
            <Card>
              <CardHeader>
                <CardTitle>Zones d'Activité sur le Terrain</CardTitle>
                <CardDescription>Répartition de l'activité du joueur par zone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                  {Object.entries(playerProfile.profile.zones_activite).map(([zone, percentage]) => (
                    <div key={zone} className="text-center p-2 bg-muted rounded">
                      <div className="font-semibold text-sm">{percentage}%</div>
                      <div className="text-xs text-muted-foreground">{zone.replace('_', ' ')}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}