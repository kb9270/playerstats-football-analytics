import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  User, 
  TrendingUp, 
  Activity, 
  Target, 
  Brain, 
  Trophy,
  Medal,
  Users,
  Globe,
  Star,
  Zap,
  BarChart3
} from "lucide-react";

interface Player {
  Player: string;
  Squad: string;
  Pos: string;
  Age: number;
  Nation: string;
  Comp: string;
  Gls: number;
  Ast: number;
  xG: number;
  xAG: number;
  Min: number;
  MP: number;
  'Cmp%': number;
  Tkl: number;
  Int: number;
  PrgP: number;
  'Succ%': number;
  Sh: number;
  SoT: number;
}

interface PlayerAnalysis {
  player: Player;
  percentiles: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  playingStyle: string;
  overallRating: number;
  stats: {
    goalsPerGame: string;
    assistsPerGame: string;
    minutesPlayed: number;
    appearances: number;
  };
}

export default function BeautifulCSVDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");

  // Données de base
  const { data: leagueStats } = useQuery({
    queryKey: ['/api/csv-direct/leagues'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: teamStats } = useQuery({
    queryKey: ['/api/csv-direct/teams'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: topScorers } = useQuery({
    queryKey: ['/api/csv-direct/top-scorers', 5],
    staleTime: 5 * 60 * 1000,
  });

  const { data: topAssists } = useQuery({
    queryKey: ['/api/csv-direct/top-assists', 5],
    staleTime: 5 * 60 * 1000,
  });

  // Recherche
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: [`/api/csv-direct/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: searchQuery.length > 2 && searchQuery.trim().length > 0,
    staleTime: 30 * 1000, // 30 secondes
  });

  // Analyse du joueur sélectionné
  const { data: playerAnalysis, isLoading: isLoadingAnalysis } = useQuery({
    queryKey: ['/api/csv-direct/player', selectedPlayer],
    enabled: !!selectedPlayer,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const formatPercentile = (value: number): string => {
    if (value >= 80) return "text-green-600 dark:text-green-400";
    if (value >= 60) return "text-blue-600 dark:text-blue-400";
    if (value >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getPercentileIcon = (value: number): string => {
    if (value >= 80) return "🟢";
    if (value >= 60) return "🔵";
    if (value >= 40) return "🟡";
    return "🔴";
  };

  const getFlag = (nation: string): string => {
    const flagMap: Record<string, string> = {
      'eng ENG': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'es ESP': '🇪🇸', 'fr FRA': '🇫🇷', 'it ITA': '🇮🇹', 
      'de GER': '🇩🇪', 'br BRA': '🇧🇷', 'ar ARG': '🇦🇷', 'pt POR': '🇵🇹',
      'nl NED': '🇳🇱', 'be BEL': '🇧🇪', 'hr CRO': '🇭🇷', 'pl POL': '🇵🇱'
    };
    return flagMap[nation] || '🌍';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      <div className="container mx-auto py-8 space-y-8">
        
        {/* En-tête héroïque */}
        <div className="text-center space-y-6 py-12">
          <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Football Analytics Platform</span>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Analyseur de Joueurs
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Explorez les données complètes de <span className="font-semibold text-blue-600 dark:text-blue-400">2800+ joueurs européens</span> avec 
            des analyses avancées, percentiles par position et insights tactiques
          </p>
        </div>

        {/* Barre de recherche principale */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Search className="h-6 w-6 text-blue-600" />
              Recherche de Joueur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Recherchez par nom (ex: Messi, Mbappé, Haaland...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-12 text-lg"
              />
              <Button size="lg" disabled={isSearching} className="px-8">
                {isSearching ? "Recherche..." : "Rechercher"}
              </Button>
            </div>
            
            {/* Résultats de recherche */}
            {searchResults?.success && searchResults.players && searchResults.players.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-lg">Résultats ({searchResults.players.length})</h3>
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {searchResults.players.slice(0, 8).map((player: Player, index: number) => (
                    <div 
                      key={index}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:shadow-md"
                      onClick={() => window.open(`/player-profile/${encodeURIComponent(player.Player)}`, '_blank')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-semibold">
                              {player.Player.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-lg">{player.Player}</h4>
                            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                {getFlag(player.Nation)} {player.Squad}
                              </span>
                              <Badge variant="outline">{player.Pos}</Badge>
                              <span>{player.Age} ans</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {player.Gls}G / {player.Ast}A
                          </div>
                          <div className="text-sm text-gray-500">{player.Comp}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analyse détaillée du joueur sélectionné */}
        {isLoadingAnalysis && selectedPlayer && (
          <Card className="shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto"></div>
              </div>
            </CardContent>
          </Card>
        )}

        {playerAnalysis?.success && (
          <div className="space-y-6">
            {/* Carte principale du joueur */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-2xl font-bold">
                        {playerAnalysis.analysis.player.Player.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {playerAnalysis.analysis.player.Player}
                      </h2>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="flex items-center gap-2 text-lg text-gray-600 dark:text-gray-300">
                          {getFlag(playerAnalysis.analysis.player.Nation)} {playerAnalysis.analysis.player.Squad}
                        </span>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {playerAnalysis.analysis.player.Pos}
                        </Badge>
                        <span className="text-lg text-gray-600 dark:text-gray-300">
                          {playerAnalysis.analysis.player.Age} ans
                        </span>
                        <Button
                          onClick={() => window.open(`/api/csv-direct/player/${encodeURIComponent(playerAnalysis.analysis.player.Player)}/pdf`, '_blank')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Fiche PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {playerAnalysis.analysis.overallRating}/100
                    </div>
                    <div className="text-sm text-gray-500">Note Globale</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {playerAnalysis.analysis.player.Gls}
                    </div>
                    <div className="text-sm text-gray-500">Buts</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {playerAnalysis.analysis.player.Ast}
                    </div>
                    <div className="text-sm text-gray-500">Passes D.</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {playerAnalysis.analysis.player.MP}
                    </div>
                    <div className="text-sm text-gray-500">Matchs</div>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.round(playerAnalysis.analysis.player.Min / 90)}
                    </div>
                    <div className="text-sm text-gray-500">90 min jouées</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="percentiles" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="percentiles" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Percentiles
                </TabsTrigger>
                <TabsTrigger value="analysis" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Analyse
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Statistiques
                </TabsTrigger>
              </TabsList>

              <TabsContent value="percentiles">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Performance vs Position
                    </CardTitle>
                    <CardDescription>
                      Comparaison avec les joueurs du même poste ayant joué au moins 90 minutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(playerAnalysis.analysis.percentiles).map(([stat, value]) => (
                        <div key={stat} className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-lg capitalize">{stat.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{getPercentileIcon(value)}</span>
                              <Badge 
                                variant={value >= 70 ? "default" : value >= 40 ? "secondary" : "destructive"}
                                className="text-sm px-3 py-1"
                              >
                                {value}e percentile
                              </Badge>
                            </div>
                          </div>
                          <Progress value={value} className="h-3 bg-gray-200 dark:bg-gray-700" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Style de Jeu
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="text-xl p-4 w-full justify-center">
                        {playerAnalysis.analysis.playingStyle}
                      </Badge>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-500" />
                        Forces & Faiblesses
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {playerAnalysis.analysis.strengths.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Forces
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {playerAnalysis.analysis.strengths.map((strength, index) => (
                              <Badge key={index} variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {playerAnalysis.analysis.weaknesses.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Points d'amélioration
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {playerAnalysis.analysis.weaknesses.map((weakness, index) => (
                              <Badge key={index} variant="outline" className="border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
                                {weakness}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="stats">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Statistiques Détaillées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-xl font-semibold">{playerAnalysis.analysis.stats.goalsPerGame}</div>
                        <div className="text-sm text-gray-500">Buts/Match</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-xl font-semibold">{playerAnalysis.analysis.stats.assistsPerGame}</div>
                        <div className="text-sm text-gray-500">Passes D./Match</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-xl font-semibold">{playerAnalysis.analysis.stats.minutesPlayed}</div>
                        <div className="text-sm text-gray-500">Minutes jouées</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="text-xl font-semibold">{playerAnalysis.analysis.stats.appearances}</div>
                        <div className="text-sm text-gray-500">Apparitions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Statistiques globales et classements */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Statistiques des ligues */}
          {leagueStats?.success && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  Ligues Représentées
                </CardTitle>
                <CardDescription>
                  {leagueStats.stats.totalPlayers} joueurs dans {Object.keys(leagueStats.stats.leagues).length} championnats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leagueStats.stats.topLeagues.slice(0, 5).map(([league, count]: [string, number], index: number) => (
                    <div key={league} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-medium">{league}</span>
                      <Badge variant="secondary">{count} joueurs</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top buteurs */}
          {topScorers?.success && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Buteurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topScorers.players.slice(0, 5).map((player: Player, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      onClick={() => setSelectedPlayer(player.Player)}
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-semibold">{player.Player}</div>
                          <div className="text-sm text-gray-500">{player.Squad}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {player.Gls} buts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top passeurs */}
        {topAssists?.success && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5 text-blue-500" />
                Top Passeurs Décisifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topAssists.players.slice(0, 6).map((player: Player, index: number) => (
                  <div 
                    key={index}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    onClick={() => setSelectedPlayer(player.Player)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{player.Player}</div>
                        <div className="text-sm text-gray-500">{player.Squad}</div>
                      </div>
                      <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                        {player.Ast} assists
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pied de page */}
        <div className="text-center py-8 space-y-4">
          <Separator />
          <p className="text-gray-600 dark:text-gray-400">
            Plateforme d'analyse alimentée par les données FBref 2024/25 - Projet de Khalil 🧬
          </p>
          <p className="text-sm text-gray-500">
            {leagueStats?.success && `${leagueStats.stats.totalPlayers} joueurs analysés`} • 
            Mise à jour en temps réel • Analyses par IA
          </p>
        </div>
      </div>
    </div>
  );
}