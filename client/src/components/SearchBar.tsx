import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, User } from "lucide-react";
import { useLocation } from "wouter";

interface SearchBarProps {
  onPlayerSelect?: (playerId: number) => void;
}

export default function SearchBar({ onPlayerSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [, setLocation] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: [`/api/players/search?q=${query}`],
    enabled: query.length > 2,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowResults(true);
    }
  };

  const handlePlayerClick = (player: any) => {
    if (onPlayerSelect) {
      onPlayerSelect(player.id);
    } else {
      setLocation(`/player/${player.id}`);
    }
    setShowResults(false);
    setQuery("");
  };

  return (
    <div ref={searchRef} className="relative">
      <form onSubmit={handleSearch} className="relative">
        <Input
          type="text"
          placeholder="Rechercher n'importe quel joueur professionnel (ex: Kylian Mbappé, Lionel Messi, Haaland...)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(e.target.value.length > 2);
          }}
          className="w-full px-6 py-4 bg-blue-950/30 border border-blue-400/30 rounded-xl text-blue-100 placeholder-blue-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all pr-16 backdrop-blur-sm"
        />
        <Button
          type="submit"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 stats-button px-6 py-2 rounded-lg"
        >
          <Search className="w-4 h-4" />
        </Button>
      </form>

      {/* Search Results */}
      {showResults && query.length > 2 && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-stats-secondary border border-gray-700 rounded-xl z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div>
                {searchResults.map((player: any) => (
                  <div
                    key={player.id}
                    onClick={() => handlePlayerClick(player)}
                    className="search-result-item flex items-center space-x-3"
                  >
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-contrast-high">{player.name}</div>
                      <div className="text-sm text-contrast-medium">
                        {player.team} • {player.position}
                        {player.age && ` • ${player.age} ans`}
                        {player.nationality && ` • ${player.nationality}`}
                      </div>
                      {player.marketValue && (
                        <div className="text-xs text-stats-accent font-medium">
                          Valeur: {player.marketValue > 1000000 
                            ? `${(player.marketValue / 1000000).toFixed(1)}M€` 
                            : `${(player.marketValue / 1000).toFixed(0)}K€`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-contrast-medium">
                {query.length > 2 ? "Aucun joueur trouvé. Essayez avec un nom complet ou une autre orthographe." : "Tapez au moins 3 caractères pour rechercher parmi tous les joueurs professionnels"}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
