import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Trophy, Users, Globe, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface League {
  id: number;
  name: string;
  country: string;
  level: number;
  teams: number;
  totalPlayers: number;
  averageAge: number;
  averageValue: number;
  season: string;
  logo?: string;
  topScorer?: string;
  topScorerGoals?: number;
}

export default function Leagues() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: leagues = [], isLoading } = useQuery({
    queryKey: ['/api/leagues'],
  });

  // Additional mock leagues for demonstration
  const mockLeagues: League[] = [
    {
      id: 1,
      name: "Ligue 1",
      country: "France",
      level: 1,
      teams: 18,
      totalPlayers: 500,
      averageAge: 25.4,
      averageValue: 12500000,
      season: "2024-2025",
      topScorer: "Kylian Mbappé",
      topScorerGoals: 24
    },
    {
      id: 2,
      name: "Premier League",
      country: "Angleterre",
      level: 1,
      teams: 20,
      totalPlayers: 560,
      averageAge: 26.1,
      averageValue: 28000000,
      season: "2024-2025",
      topScorer: "Erling Haaland",
      topScorerGoals: 26
    },
    {
      id: 3,
      name: "La Liga",
      country: "Espagne",
      level: 1,
      teams: 20,
      totalPlayers: 550,
      averageAge: 25.8,
      averageValue: 22000000,
      season: "2024-2025",
      topScorer: "Robert Lewandowski",
      topScorerGoals: 22
    },
    {
      id: 4,
      name: "Serie A",
      country: "Italie",
      level: 1,
      teams: 20,
      totalPlayers: 540,
      averageAge: 26.3,
      averageValue: 18500000,
      season: "2024-2025",
      topScorer: "Victor Osimhen",
      topScorerGoals: 20
    },
    {
      id: 5,
      name: "Bundesliga",
      country: "Allemagne",
      level: 1,
      teams: 18,
      totalPlayers: 486,
      averageAge: 25.2,
      averageValue: 24000000,
      season: "2024-2025",
      topScorer: "Harry Kane",
      topScorerGoals: 25
    },
    {
      id: 6,
      name: "Ligue 2",
      country: "France",
      level: 2,
      teams: 20,
      totalPlayers: 560,
      averageAge: 24.8,
      averageValue: 2800000,
      season: "2024-2025",
      topScorer: "Mohamed-Ali Cho",
      topScorerGoals: 18
    },
    {
      id: 7,
      name: "Liga Portugal",
      country: "Portugal",
      level: 1,
      teams: 18,
      totalPlayers: 486,
      averageAge: 25.6,
      averageValue: 8500000,
      season: "2024-2025",
      topScorer: "Viktor Gyökeres",
      topScorerGoals: 23
    },
    {
      id: 8,
      name: "Eredivisie",
      country: "Pays-Bas",
      level: 1,
      teams: 18,
      totalPlayers: 486,
      averageAge: 24.8,
      averageValue: 6200000,
      season: "2024-2025",
      topScorer: "Brian Brobbey",
      topScorerGoals: 19
    },
    {
      id: 9,
      name: "Championship",
      country: "Angleterre",
      level: 2,
      teams: 24,
      totalPlayers: 648,
      averageAge: 26.4,
      averageValue: 4500000,
      season: "2024-2025",
      topScorer: "Sammie Szmodics",
      topScorerGoals: 21
    }
  ];

  const allLeagues = [...leagues, ...mockLeagues];
  const filteredLeagues = allLeagues.filter(league =>
    league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    league.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K€`;
    }
    return `${value}€`;
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return "bg-yellow-500/20 text-yellow-400";
      case 2: return "bg-gray-500/20 text-gray-400";
      case 3: return "bg-orange-500/20 text-orange-400";
      default: return "bg-blue-500/20 text-blue-400";
    }
  };

  const getLevelText = (level: number) => {
    switch (level) {
      case 1: return "Division 1";
      case 2: return "Division 2";
      case 3: return "Division 3";
      default: return `Division ${level}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stats-primary via-stats-secondary to-stats-primary text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Ligues</h1>
          <p className="text-muted-foreground text-lg">
            Découvrez les championnats de football européens et leurs statistiques
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Rechercher une ligue ou pays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border text-foreground"
            />
          </div>
        </div>

        {/* League Statistics Overview */}
        {!searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card/80 border-border">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-stats-accent mb-2">
                  {allLeagues.length}
                </div>
                <div className="text-sm text-muted-foreground">Ligues disponibles</div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-stats-accent mb-2">
                  {allLeagues.reduce((sum, league) => sum + league.teams, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Équipes total</div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-stats-accent mb-2">
                  {allLeagues.reduce((sum, league) => sum + league.totalPlayers, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Joueurs total</div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-border">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-stats-accent mb-2">
                  {formatValue(allLeagues.reduce((sum, league) => sum + league.averageValue, 0) / allLeagues.length)}
                </div>
                <div className="text-sm text-muted-foreground">Valeur moyenne</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leagues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeagues.map((league) => (
            <Card key={league.id} className="bg-card/80 border-border hover:bg-card/90 transition-all duration-300 cursor-pointer group hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-foreground flex items-center gap-2 group-hover:text-stats-accent transition-colors">
                    <Trophy className="w-5 h-5 text-stats-accent" />
                    {league.name}
                  </CardTitle>
                  <Badge className={getLevelColor(league.level)}>
                    {getLevelText(league.level)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>{league.country}</span>
                  <span>• Saison {league.season}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 bg-card/50 rounded-lg p-3">
                    <Trophy className="w-4 h-4 text-stats-accent" />
                    <div>
                      <div className="font-semibold text-foreground">{league.teams}</div>
                      <div className="text-xs text-muted-foreground">Équipes</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-card/50 rounded-lg p-3">
                    <Users className="w-4 h-4 text-stats-accent" />
                    <div>
                      <div className="font-semibold text-foreground">{league.totalPlayers}</div>
                      <div className="text-xs text-muted-foreground">Joueurs</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
                    <span className="text-muted-foreground font-medium">Âge moyen:</span>
                    <span className="text-foreground font-semibold">{league.averageAge} ans</span>
                  </div>
                  <div className="flex justify-between items-center bg-gradient-to-r from-stats-accent/10 to-transparent rounded-lg p-3">
                    <span className="text-muted-foreground font-medium">Valeur moyenne:</span>
                    <span className="text-stats-accent font-bold">
                      {formatValue(league.averageValue)}
                    </span>
                  </div>
                </div>

                {league.topScorer && (
                  <div className="pt-2 border-t border-border bg-card/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-stats-accent" />
                      <span className="text-sm text-muted-foreground font-medium">Meilleur buteur</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-foreground font-medium">{league.topScorer}</div>
                      <div className="text-stats-accent font-bold text-lg">{league.topScorerGoals} ⚽</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLeagues.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">
              Aucune ligue trouvée pour "{searchQuery}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}