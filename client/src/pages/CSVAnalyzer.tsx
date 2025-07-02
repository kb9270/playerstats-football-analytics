import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, User, Activity, BarChart3, Zap, Map, Route, TrendingUp, Users } from "lucide-react";
import Heatmap from "@/components/Heatmap";
import PassMap from "@/components/PassMap";
import PlayerComparison from "@/components/PlayerComparison";

interface PlayerData {
  Rk: number;
  Player: string;
  Nation: string;
  Pos: string;
  Squad: string;
  Comp: string;
  Age: number;
  MP: number;
  Gls: number;
  Ast: number;
  Min: number;
  xG: number;
  xAG: number;
  Tkl: number;
  Int: number;
  Touches: number;
}

interface ApiResponse {
  success: boolean;
  players?: PlayerData[];
  player?: PlayerData;
  analysis?: any;
  stats?: {
    totalPlayers: number;
    totalLeagues: number;
    avgAge: number;
    avgGoals: number;
  };
}

export default function CSVAnalyzer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'heatmap' | 'passmap' | 'compare'>('profile');
  const [comparePlayer, setComparePlayer] = useState<string | null>(null);

  // Récupération des statistiques générales
  const { data: leagueStats } = useQuery<ApiResponse>({
    queryKey: ['/api/csv-direct/leagues'],
    enabled: true
  });

  // Recherche de joueur
  const { data: searchResults, isLoading: isSearching } = useQuery<ApiResponse>({
    queryKey: ['/api/csv-direct/search', { q: searchQuery }],
    enabled: searchQuery.length > 2
  });

  // Profil complet du joueur sélectionné
  const { data: playerProfile, isLoading: isLoadingProfile } = useQuery<ApiResponse>({
    queryKey: ['/api/csv-direct/player', selectedPlayer, 'analysis'],
    enabled: !!selectedPlayer
  });

  // Heatmap du joueur sélectionné
  const { data: heatmapData } = useQuery<ApiResponse>({
    queryKey: ['/api/csv-direct/player', selectedPlayer, 'heatmap'],
    enabled: !!selectedPlayer && activeTab === 'heatmap'
  });

  // Pass map du joueur sélectionné
  const { data: passmapData } = useQuery<ApiResponse>({
    queryKey: ['/api/csv-direct/player', selectedPlayer, 'passmap'],
    enabled: !!selectedPlayer && activeTab === 'passmap'
  });

  // Valeur marchande du joueur sélectionné
  const { data: marketValue } = useQuery<ApiResponse>({
    queryKey: ['/api/csv-direct/player', selectedPlayer, 'market-value'],
    enabled: !!selectedPlayer
  });

  // Comparaison de joueurs
  const { data: comparisonData } = useQuery<ApiResponse>({
    queryKey: ['/api/csv-direct/compare', selectedPlayer, comparePlayer],
    enabled: !!selectedPlayer && !!comparePlayer && activeTab === 'compare'
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
          Explorez les données complètes de 2800+ joueurs européens avec analyses avancées et statistiques détaillées
        </p>
      </div>

      {/* Statistiques générales */}
      {leagueStats?.success && leagueStats.stats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques Générales</CardTitle>
            <CardDescription>Vue d'ensemble des données disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-semibold">{leagueStats.stats.totalPlayers}</div>
                <div className="text-sm text-muted-foreground">Joueurs</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-semibold">{leagueStats.stats.totalLeagues}</div>
                <div className="text-sm text-muted-foreground">Ligues</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-semibold">{leagueStats.stats.avgAge?.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Âge Moyen</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-semibold">{leagueStats.stats.avgGoals?.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Buts/Joueur</div>
              </div>
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
              placeholder="Nom du joueur (ex: Saka, Mbappé, Haaland...)"
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
      {searchResults?.success && searchResults.players && searchResults.players.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Joueurs Trouvés ({searchResults.players.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchResults.players.slice(0, 5).map((player: PlayerData) => (
                <div 
                  key={player.Rk}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setSelectedPlayer(player.Player)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{player.Player}</h3>
                      <p className="text-sm text-muted-foreground">
                        {player.Squad} • {player.Pos} • {player.Age} ans
                      </p>
                    </div>
                    <Badge variant="outline">{player.Comp}</Badge>
                  </div>
                </div>
              ))}
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

      {playerProfile?.success && playerProfile.player && (
        <div className="space-y-6">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {playerProfile.player.Player}
              </CardTitle>
              <CardDescription>
                {playerProfile.player.Pos} • {playerProfile.player.Squad} • {playerProfile.player.Comp}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.player.Age}</div>
                  <div className="text-sm text-muted-foreground">Âge</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.player.Nation}</div>
                  <div className="text-sm text-muted-foreground">Nationalité</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.player.Min}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.analysis?.overallRating || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Note /100</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-green-600">
                    {marketValue?.success ? (marketValue as any).marketValue.formatted : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Valeur
                  </div>
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
                  <div className="font-semibold">{playerProfile.player.MP}</div>
                  <div className="text-sm text-muted-foreground">Matchs</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.player.Gls}</div>
                  <div className="text-sm text-muted-foreground">Buts</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.player.Ast}</div>
                  <div className="text-sm text-muted-foreground">Passes D.</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.player.xG?.toFixed(1) || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">xG</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques détaillées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Statistiques Détaillées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.player.xAG?.toFixed(1) || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">xAG</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.player.Tkl || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Tacles</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.player.Int || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Interceptions</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold">{playerProfile.player.Touches || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Touches</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Percentiles si disponibles */}
          {playerProfile.analysis?.percentiles && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Percentiles vs Position
                </CardTitle>
                <CardDescription>Performance comparée aux joueurs du même poste</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(playerProfile.analysis.percentiles).map(([stat, value]: [string, any]) => (
                    <div key={stat} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{stat}</span>
                        <span className={`text-sm font-medium ${formatPercentile(value)}`}>
                          {value}e percentile
                        </span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Onglets pour les visualisations avancées */}
          <Card>
            <CardHeader>
              <CardTitle>Visualisations Avancées</CardTitle>
              <CardDescription>Heatmaps, pass maps et comparaisons de joueurs</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Navigation des onglets */}
              <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
                <Button
                  variant={activeTab === 'profile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Profil
                </Button>
                <Button
                  variant={activeTab === 'heatmap' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('heatmap')}
                  className="flex items-center gap-2"
                >
                  <Map className="h-4 w-4" />
                  Heatmap
                </Button>
                <Button
                  variant={activeTab === 'passmap' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('passmap')}
                  className="flex items-center gap-2"
                >
                  <Route className="h-4 w-4" />
                  Pass Map
                </Button>
                <Button
                  variant={activeTab === 'compare' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('compare')}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Comparer
                </Button>
              </div>

              {/* Contenu des onglets */}
              {activeTab === 'profile' && (
                <div className="text-center py-8">
                  <Activity className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Profil du Joueur</h3>
                  <p className="text-muted-foreground">
                    Les informations détaillées du joueur sont affichées ci-dessus.
                  </p>
                </div>
              )}

              {activeTab === 'heatmap' && (
                <div className="space-y-4">
                  {heatmapData?.success ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Heatmap
                        data={(heatmapData as any).heatmap.general}
                        title="Heatmap Générale"
                        type="general"
                      />
                      <Heatmap
                        data={(heatmapData as any).heatmap.defensive}
                        title="Actions Défensives"
                        type="defensive"
                      />
                      <Heatmap
                        data={(heatmapData as any).heatmap.offensive}
                        title="Actions Offensives"
                        type="offensive"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Map className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Génération de la Heatmap</h3>
                      <p className="text-muted-foreground">
                        Chargement des données de position et d'activité...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'passmap' && (
                <div className="space-y-4">
                  {passmapData?.success ? (
                    <PassMap
                      data={(passmapData as any).passMap}
                      title={`Pass Map - ${playerProfile.player.Player}`}
                      stats={(passmapData as any).stats}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Route className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Génération de la Pass Map</h3>
                      <p className="text-muted-foreground">
                        Analyse des patterns de passes en cours...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'compare' && (
                <div className="space-y-6">
                  {/* Sélection du joueur à comparer */}
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">Comparer avec:</label>
                    <Input
                      placeholder="Nom du joueur à comparer"
                      value={comparePlayer || ''}
                      onChange={(e) => setComparePlayer(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>

                  {comparisonData?.success ? (
                    <PlayerComparison data={(comparisonData as any).comparison} />
                  ) : comparePlayer ? (
                    <div className="text-center py-8">
                      <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Comparaison en cours</h3>
                      <p className="text-muted-foreground">
                        Analyse comparative entre {playerProfile.player.Player} et {comparePlayer}...
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Comparaison de Joueurs</h3>
                      <p className="text-muted-foreground">
                        Entrez le nom d'un joueur pour commencer la comparaison.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}