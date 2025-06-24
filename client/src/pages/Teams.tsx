import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, Trophy, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Team {
  id: number;
  name: string;
  league: string;
  country: string;
  founded?: number;
  stadium?: string;
  playerCount: number;
  averageAge?: number;
  totalValue?: number;
  logo?: string;
}

export default function Teams() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock team data - in real app this would come from API
  const teams: Team[] = [
    {
      id: 1,
      name: "FC Nantes",
      league: "Ligue 1",
      country: "France",
      founded: 1943,
      stadium: "Stade de la Beaujoire",
      playerCount: 25,
      averageAge: 25.2,
      totalValue: 45000000
    },
    {
      id: 2,
      name: "Real Madrid",
      league: "La Liga",
      country: "Espagne",
      founded: 1902,
      stadium: "Santiago Bernabéu",
      playerCount: 28,
      averageAge: 26.8,
      totalValue: 850000000
    },
    {
      id: 3,
      name: "RC Strasbourg",
      league: "Ligue 1", 
      country: "France",
      founded: 1906,
      stadium: "Stade de la Meinau",
      playerCount: 24,
      averageAge: 24.1,
      totalValue: 38000000
    },
    {
      id: 4,
      name: "Saint-Étienne",
      league: "Ligue 2",
      country: "France", 
      founded: 1919,
      stadium: "Stade Geoffroy-Guichard",
      playerCount: 26,
      averageAge: 25.8,
      totalValue: 25000000
    }
  ];

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.league.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.country.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-stats-primary via-stats-secondary to-stats-primary text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Équipes</h1>
          <p className="text-muted-foreground text-lg">
            Explorez les équipes de football et leurs statistiques
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Rechercher une équipe, ligue ou pays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border text-foreground"
            />
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="bg-card/80 border-border hover:bg-card/90 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl text-foreground flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-stats-accent" />
                    {team.name}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-stats-accent/20 text-stats-accent">
                    {team.league}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{team.country}</span>
                  {team.founded && <span>• Fondé en {team.founded}</span>}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {team.stadium && (
                  <div className="text-sm text-muted-foreground">
                    🏟️ {team.stadium}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-stats-accent" />
                    <span className="text-foreground">{team.playerCount} joueurs</span>
                  </div>
                  {team.averageAge && (
                    <div className="text-muted-foreground">
                      Âge moyen: {team.averageAge} ans
                    </div>
                  )}
                </div>
                
                {team.totalValue && (
                  <div className="pt-2 border-t border-border">
                    <div className="text-sm text-muted-foreground">Valeur totale</div>
                    <div className="text-lg font-semibold text-stats-accent">
                      {formatValue(team.totalValue)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">
              Aucune équipe trouvée pour "{searchQuery}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}