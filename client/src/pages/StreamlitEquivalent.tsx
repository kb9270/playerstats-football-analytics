import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { User, TrendingUp, Activity, Target, Brain, FileText } from "lucide-react";

interface PlayerData {
  Player: string;
  Team: string;
  Position: string;
  Age: number;
  Height?: string;
  Foot?: string;
  Rating?: number;
  Goals_per90: number;
  Assists_per90: number;
  Dribbles_per90: number;
  Crosses_per90: number;
  Progressive_passes_per90: number;
  Tackles_per90: number;
  Interceptions_per90: number;
  Passes_completed_pct: number;
  Percentile_Goals: number;
  Percentile_Assists: number;
  Percentile_Dribbles: number;
  Percentile_Crosses: number;
  Percentile_Progressive_Passes: number;
  Percentile_Tackles: number;
  Percentile_Interceptions: number;
  Percentile_Pass_Completion: number;
}

export default function StreamlitEquivalent() {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);

  // Récupérer la liste des joueurs disponibles
  const { data: playersData } = useQuery({
    queryKey: ['/api/csv/players/list', 500],
    enabled: true
  });

  // Récupérer les données du joueur sélectionné
  const { data: playerProfile, isLoading } = useQuery({
    queryKey: ['/api/csv/players/profile', selectedPlayer],
    enabled: !!selectedPlayer
  });

  useEffect(() => {
    if (playersData?.success && playersData.players) {
      setAvailablePlayers(playersData.players.sort());
    }
  }, [playersData]);

  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 70) return "🟩";
    if (percentile >= 40) return "🟨";
    return "🟥";
  };

  const getPercentileVariant = (percentile: number) => {
    if (percentile >= 70) return "default";
    if (percentile >= 40) return "secondary";
    return "destructive";
  };

  const generateAnalysis = (data: any): string => {
    if (!data?.percentiles) return "Données insuffisantes pour l'analyse.";
    
    const percentiles = data.percentiles;
    
    if (percentiles.dribbles > 80 && percentiles.passes_decisives > 80) {
      return "Joueur créatif, fort en 1v1, excellent dans la dernière passe.";
    } else if (percentiles.tacles > 70) {
      return "Joueur très actif à la récupération.";
    } else {
      return "Profil équilibré. Potentiel à développer dans un système adapté.";
    }
  };

  const statisticsMetrics = [
    { label: "Buts", key: "buts", percentileKey: "buts", unit: "/ 90 min" },
    { label: "Passes déc.", key: "passes_decisives", percentileKey: "passes_decisives", unit: "/ 90 min" },
    { label: "Dribbles réussis", key: "dribbles", percentileKey: "dribbles", unit: "/ 90 min" },
    { label: "Centres", key: "centres", percentileKey: "centres", unit: "/ 90 min" },
    { label: "Passes progressives", key: "passes_progressives", percentileKey: "passes_progressives", unit: "/ 90 min" },
    { label: "Tacles", key: "tacles", percentileKey: "tacles", unit: "/ 90 min" },
    { label: "Interceptions", key: "interceptions", percentileKey: "interceptions", unit: "/ 90 min" },
    { label: "Limite de déchet", key: "precision_passes", percentileKey: "precision_passes", unit: "%" },
  ];

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* En-tête */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          📊 Fiche Joueur - Saison 2024/25
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Analyse complète des performances basée sur votre fichier CSV de 2800+ joueurs européens
        </p>
      </div>

      {/* Sélection du joueur */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Sélection du Joueur
          </CardTitle>
          <CardDescription>
            Choisissez un joueur pour afficher sa fiche complète
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisis un joueur..." />
            </SelectTrigger>
            <SelectContent>
              {availablePlayers.map((player) => (
                <SelectItem key={player} value={player}>
                  {player}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Informations du joueur */}
      {isLoading && selectedPlayer && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">Chargement des données du joueur...</div>
          </CardContent>
        </Card>
      )}

      {playerProfile?.success && playerProfile.profile && (
        <div className="space-y-6">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                🧑‍💼 {playerProfile.profile.informations_personnelles.nom} - {playerProfile.profile.informations_personnelles.equipe} ({playerProfile.profile.informations_personnelles.position})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Âge :</span> {playerProfile.profile.informations_personnelles.age} ans
                </div>
                <div>
                  <span className="font-semibold">Taille :</span> {playerProfile.profile.informations_personnelles.taille || "—"}
                </div>
                <div>
                  <span className="font-semibold">Pied fort :</span> {playerProfile.profile.informations_personnelles.pied_fort || "—"}
                </div>
                <div>
                  <span className="font-semibold">Note moyenne :</span> {playerProfile.profile.note_globale}/100
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques avancées par 90 minutes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                📈 Statistiques avancées (par 90 min) + Percentiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {playerProfile.profile.percentiles && Object.entries(playerProfile.profile.percentiles).map(([key, percentile]) => {
                const stat = playerProfile.profile.statistiques_base;
                let value = "—";
                let label = key.replace(/_/g, ' ');
                
                // Correspondance avec les statistiques de base
                switch (key) {
                  case 'buts':
                    value = stat?.buts || 0;
                    label = "Buts";
                    break;
                  case 'passes_decisives':
                    value = stat?.passes_d || 0;
                    label = "Passes déc.";
                    break;
                  case 'tacles':
                    value = stat?.tacles || 0;
                    label = "Tacles";
                    break;
                  case 'interceptions':
                    value = stat?.interceptions || 0;
                    label = "Interceptions";
                    break;
                  case 'precision_passes':
                    value = stat?.precision_passes ? `${stat.precision_passes}%` : "—";
                    label = "Précision passes";
                    break;
                }

                const percentileValue = percentile as number;
                const color = getPercentileColor(percentileValue);

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{value} / 90 min</span>
                        <span className="text-lg">{color}</span>
                        <Badge variant={getPercentileVariant(percentileValue)}>
                          {percentileValue}ᵉ percentile
                        </Badge>
                      </div>
                    </div>
                    <Progress value={percentileValue} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Separator />

          {/* Analyse automatique */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                🧠 Résumé analytique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm leading-relaxed">
                  {generateAnalysis(playerProfile.profile)}
                </p>
              </div>
              
              {/* Forces et faiblesses */}
              {playerProfile.profile.forces && playerProfile.profile.faiblesses && (
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Forces</h4>
                    <div className="space-y-1">
                      {playerProfile.profile.forces.map((force: string, index: number) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-1 border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                          {force}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Faiblesses</h4>
                    <div className="space-y-1">
                      {playerProfile.profile.faiblesses.map((faiblesse: string, index: number) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-1 border-red-200 text-red-700 dark:border-red-800 dark:text-red-300">
                          {faiblesse}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Pied de page */}
          <div className="text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              Généré automatiquement à partir des données CSV 2024/25 — Projet de Khalil 🧬
            </p>
          </div>
        </div>
      )}
    </div>
  );
}