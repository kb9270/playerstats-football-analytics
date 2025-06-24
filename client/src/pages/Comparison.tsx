import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import StatsTable from "@/components/StatsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart3, Users, X } from "lucide-react";

export default function Comparison() {
  const { id } = useParams();
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  const { data: comparison, isLoading } = useQuery({
    queryKey: [`/api/comparisons/${id}`],
    enabled: !!id,
  });

  const addPlayer = (playerId: number) => {
    if (selectedPlayers.length < 4 && !selectedPlayers.includes(playerId)) {
      setSelectedPlayers(prev => [...prev, playerId]);
    }
  };

  const removePlayer = (playerId: number) => {
    setSelectedPlayers(prev => prev.filter(id => id !== playerId));
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <BarChart3 className="inline w-10 h-10 text-stats-accent mr-4" />
            COMPARAISON
          </h1>
          <div className="text-gray-400">
            SAISON 2024/2025 • LIGUE 1 • STATISTIQUES PAR 90' & CENTILE
          </div>
        </div>

        {/* Player Selection */}
        <Card className="stats-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-6 h-6 text-stats-accent mr-3" />
              Sélection des Joueurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Selected Players */}
              {selectedPlayers.map((playerId, index) => (
                <PlayerSlot
                  key={playerId}
                  playerId={playerId}
                  index={index}
                  onRemove={() => removePlayer(playerId)}
                />
              ))}
              
              {/* Empty Slots */}
              {Array.from({ length: 4 - selectedPlayers.length }).map((_, index) => (
                <EmptyPlayerSlot key={`empty-${index}`} />
              ))}
            </div>
            
            {/* Search Bar */}
            <div className="max-w-md">
              <SearchBar onPlayerSelect={addPlayer} />
            </div>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        {selectedPlayers.length >= 2 && (
          <Card className="stats-card">
            <CardHeader>
              <CardTitle>Comparaison Statistique</CardTitle>
            </CardHeader>
            <CardContent>
              <StatsTable playerIds={selectedPlayers} />
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {selectedPlayers.length < 2 && (
          <Card className="stats-card">
            <CardContent className="text-center py-16">
              <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sélectionnez au moins 2 joueurs</h3>
              <p className="text-gray-400">
                Utilisez la barre de recherche pour ajouter des joueurs à comparer
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

function PlayerSlot({ playerId, index, onRemove }: { playerId: number; index: number; onRemove: () => void }) {
  const { data: player } = useQuery({
    queryKey: [`/api/players/${playerId}`],
  });

  const colors = ['stats-accent', 'stats-blue', 'stats-green', 'stats-yellow'];
  const colorClass = colors[index % colors.length];

  return (
    <div className="bg-stats-dark/50 rounded-xl p-4 border border-gray-700 relative">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
      
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-3"></div>
        <div className={`font-bold text-${colorClass} mb-1`}>
          {player?.name || 'Chargement...'}
        </div>
        <div className="text-sm text-gray-400">
          {player?.team || ''}
        </div>
        <Badge variant="outline" className="mt-2">
          Joueur {index + 1}
        </Badge>
      </div>
    </div>
  );
}

function EmptyPlayerSlot() {
  return (
    <div className="bg-stats-dark/20 border-2 border-dashed border-gray-600 rounded-xl p-4 flex items-center justify-center min-h-[140px]">
      <div className="text-center">
        <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <div className="text-sm text-gray-400">Ajouter un joueur</div>
      </div>
    </div>
  );
}
