import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, Trophy, Target, Calendar, BarChart3, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function MatchAnalyzer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHomeTeam, setSelectedHomeTeam] = useState("");
  const [selectedAwayTeam, setSelectedAwayTeam] = useState("");

  // Recent matches
  const { data: recentMatches, isLoading: loadingRecent } = useQuery({
    queryKey: ['/api/matches/recent'],
    enabled: true
  });

  // League stats
  const { data: leagueStats, isLoading: loadingLeagues } = useQuery({
    queryKey: ['/api/matches/leagues'],
    enabled: true
  });

  // Top scorers
  const { data: topScorers, isLoading: loadingScorers } = useQuery({
    queryKey: ['/api/matches/top-scorers'],
    enabled: true
  });

  // ELO rankings
  const { data: eloRankings, isLoading: loadingElo } = useQuery({
    queryKey: ['/api/matches/elo-rankings'],
    enabled: true
  });

  // Search matches
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/matches/search', searchQuery],
    enabled: searchQuery.length > 2
  });

  // Match analysis
  const { data: matchAnalysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['/api/matches/analysis', selectedHomeTeam, selectedAwayTeam],
    enabled: selectedHomeTeam.length > 0 && selectedAwayTeam.length > 0
  });

  const getDivisionName = (division: string) => {
    const divisions: { [key: string]: string } = {
      'E1': 'Premier League',
      'E2': 'Championship', 
      'D1': 'Bundesliga',
      'D2': '2. Bundesliga',
      'F1': 'Ligue 1',
      'F2': 'Ligue 2',
      'I1': 'Serie A',
      'I2': 'Serie B',
      'S1': 'La Liga',
      'S2': 'Segunda División',
      'CL': 'Champions League',
      'EL': 'Europa League'
    };
    return divisions[division] || division;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'H': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'A': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'D': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Analyse des Matchs
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Explorez les données de matchs des 3 dernières années des 5 grandes ligues européennes et de la Ligue des Champions
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Rechercher des équipes ou des matchs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 text-lg border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>
          
          {searchResults && searchResults.success && searchQuery.length > 2 && (
            <Card className="mt-4 max-h-96 overflow-y-auto">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Résultats de recherche</h3>
                <div className="space-y-2">
                  {searchResults.matches?.slice(0, 10).map((match: any, index: number) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        setSelectedHomeTeam(match.HomeTeam);
                        setSelectedAwayTeam(match.AwayTeam);
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <Badge className={getResultColor(match.FTResult)}>
                          {getDivisionName(match.Division)}
                        </Badge>
                        <span className="font-medium">{match.HomeTeam} vs {match.AwayTeam}</span>
                        <span className="text-sm text-gray-500">{formatDate(match.MatchDate)}</span>
                      </div>
                      <div className="text-lg font-bold">
                        {match.FTHome || 0} - {match.FTAway || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Matchs récents
            </TabsTrigger>
            <TabsTrigger value="leagues" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Ligues
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Classements ELO
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Analyse
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* League Stats */}
              {leagueStats && leagueStats.success && (
                <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Statistiques des Ligues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Ligues:</span>
                        <span className="font-bold">{leagueStats.stats?.totalLeagues}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Matchs:</span>
                        <span className="font-bold">{leagueStats.stats?.totalMatches?.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Scoring Teams */}
              {topScorers && topScorers.success && (
                <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Équipes les plus prolifiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topScorers.scorers?.slice(0, 3).map((scorer: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span className="truncate">{scorer.team}</span>
                          <span className="font-bold">{scorer.goals}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ELO Leaders */}
              {eloRankings && eloRankings.success && (
                <Card className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top ELO
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {eloRankings.rankings?.slice(0, 3).map((team: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span className="truncate">{team.club}</span>
                          <span className="font-bold">{Math.round(team.elo)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Recent Matches Tab */}
          <TabsContent value="recent" className="space-y-6">
            {recentMatches && recentMatches.success && (
              <Card>
                <CardHeader>
                  <CardTitle>Matchs récents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentMatches.matches?.map((match: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Badge className={getResultColor(match.FTResult)}>
                            {getDivisionName(match.Division)}
                          </Badge>
                          <div>
                            <div className="font-medium">{match.HomeTeam} vs {match.AwayTeam}</div>
                            <div className="text-sm text-gray-500">{formatDate(match.MatchDate)}</div>
                          </div>
                        </div>
                        <div className="text-xl font-bold">
                          {match.FTHome || 0} - {match.FTAway || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Leagues Tab */}
          <TabsContent value="leagues" className="space-y-6">
            {leagueStats && leagueStats.success && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leagueStats.stats?.leagues?.map((league: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{getDivisionName(league.division)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Matchs:</span>
                          <span className="font-semibold">{league.matches?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Équipes:</span>
                          <span className="font-semibold">{league.totalTeams}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Buts/Match:</span>
                          <span className="font-semibold">{league.avgGoalsPerMatch}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total buts:</span>
                          <span className="font-semibold">{league.totalGoals?.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ELO Rankings Tab */}
          <TabsContent value="rankings" className="space-y-6">
            {eloRankings && eloRankings.success && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Classement ELO</span>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {eloRankings.rankings?.map((team: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{team.club}</div>
                            <div className="text-sm text-gray-500">{team.country}</div>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {Math.round(team.elo)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyse de match</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Équipe domicile</label>
                    <Input
                      placeholder="Nom de l'équipe domicile"
                      value={selectedHomeTeam}
                      onChange={(e) => setSelectedHomeTeam(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Équipe extérieur</label>
                    <Input
                      placeholder="Nom de l'équipe extérieur"
                      value={selectedAwayTeam}
                      onChange={(e) => setSelectedAwayTeam(e.target.value)}
                    />
                  </div>
                </div>

                {matchAnalysis && matchAnalysis.success && (
                  <div className="space-y-6">
                    {/* Prediction */}
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                      <CardHeader>
                        <CardTitle>Prédiction</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{matchAnalysis.analysis?.prediction?.homeWin}%</div>
                            <div className="text-sm">Victoire {selectedHomeTeam}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{matchAnalysis.analysis?.prediction?.draw}%</div>
                            <div className="text-sm">Match nul</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{matchAnalysis.analysis?.prediction?.awayWin}%</div>
                            <div className="text-sm">Victoire {selectedAwayTeam}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Team Stats Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>{selectedHomeTeam}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Matchs joués:</span>
                              <span className="font-semibold">{matchAnalysis.analysis?.homeStats?.totalMatches}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>% Victoires:</span>
                              <span className="font-semibold text-green-600">{matchAnalysis.analysis?.homeStats?.winPercentage}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Buts pour:</span>
                              <span className="font-semibold">{matchAnalysis.analysis?.homeStats?.goalsFor}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Buts contre:</span>
                              <span className="font-semibold">{matchAnalysis.analysis?.homeStats?.goalsAgainst}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ELO moyen:</span>
                              <span className="font-semibold text-blue-600">{matchAnalysis.analysis?.homeStats?.avgElo}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>{selectedAwayTeam}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Matchs joués:</span>
                              <span className="font-semibold">{matchAnalysis.analysis?.awayStats?.totalMatches}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>% Victoires:</span>
                              <span className="font-semibold text-green-600">{matchAnalysis.analysis?.awayStats?.winPercentage}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Buts pour:</span>
                              <span className="font-semibold">{matchAnalysis.analysis?.awayStats?.goalsFor}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Buts contre:</span>
                              <span className="font-semibold">{matchAnalysis.analysis?.awayStats?.goalsAgainst}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ELO moyen:</span>
                              <span className="font-semibold text-blue-600">{matchAnalysis.analysis?.awayStats?.avgElo}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Head to Head */}
                    {matchAnalysis.analysis?.headToHead?.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Confrontations directes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {matchAnalysis.analysis.headToHead.slice(0, 5).map((match: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{match.HomeTeam} vs {match.AwayTeam}</span>
                                  <span className="text-sm text-gray-500">{formatDate(match.MatchDate)}</span>
                                </div>
                                <div className="font-bold">
                                  {match.FTHome || 0} - {match.FTAway || 0}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}