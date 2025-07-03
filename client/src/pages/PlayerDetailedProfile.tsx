import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, MapPin, Calendar, Flag, User, Target, BarChart3, Brain, Loader2, Users, Activity } from "lucide-react";
import SimpleAutoComparison from "@/components/SimpleAutoComparison";

interface PlayerAnalysis {
  analysis: {
    player: {
      Player: string;
      Squad: string;
      Nation: string;
      Pos: string;
      Age: number;
      Gls: number;
      Ast: number;
      MP: number;
      Min: number;
      [key: string]: any;
    };
    percentiles: { [key: string]: number };
    strengths: string[];
    weaknesses: string[];
    overallRating: number;
  };
}

export default function PlayerDetailedProfile() {
  const { id } = useParams();
  const decodedPlayerName = decodeURIComponent(id as string).trim();
  const [comparatif, setComparatif] = useState<string>("");
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Nouvelles fonctionnalités pour directeurs sportifs
  const [progressionData, setProgressionData] = useState<any>(null);
  const [autoComparisonData, setAutoComparisonData] = useState<any>(null);
  const [loadingProgression, setLoadingProgression] = useState(false);
  const [loadingAutoComparison, setLoadingAutoComparison] = useState(false);

  // Obtenir les données CSV pour débugger
  const { data: csvData } = useQuery({
    queryKey: ['/api/csv-direct/leagues'],
    staleTime: 5 * 60 * 1000,
  });

  const { data: playerAnalysis, isLoading } = useQuery<PlayerAnalysis>({
    queryKey: [`/api/csv-direct/player/${id}/analysis`],
    enabled: !!id,
  });

  // Debug: afficher les noms dans la console
  React.useEffect(() => {
    if (csvData?.stats?.allPlayers) {
      console.log("DEBUG noms CSV :", csvData.stats.allPlayers.slice(0, 10).map((p: any) => p.Player));
      console.log("DEBUG reçu depuis URL :", decodedPlayerName);
      console.log("DEBUG id brut :", id);
    }
  }, [csvData, decodedPlayerName, id]);

  const handleDownloadPDF = () => {
    window.open(`/api/csv-direct/player/${id}/pdf`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const generateComparatif = async () => {
    if (!playerAnalysis) return;

    setIsGeneratingAnalysis(true);
    try {
      const { player } = playerAnalysis.analysis;
      const prompt = `Fais une analyse détaillée du joueur ${player.Player} (club : ${player.Squad || 'N/A'}) basé sur ces statistiques de la saison 2024/2025 : 
      - Buts: ${player.Gls || 0} en ${player.MP || 0} matchs (${player.Min || 0} minutes)
      - Passes décisives: ${player.Ast || 0}
      - xG (Expected Goals): ${player.xG || 0}
      - xAG (Expected Assists): ${player.xAG || 0}
      - Position: ${player.Pos || 'N/A'}
      - Âge: ${player.Age || 'N/A'} ans
      - Nationalité: ${player.Nation || 'N/A'}
      - Ligue: ${player.Comp || 'N/A'}

      Compare-le à des joueurs similaires évoluant au même poste en Europe et donne ton avis sur ses points forts, faiblesses et potentiel. Réponds en français, de manière structurée et professionnelle.`;

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer sk-ee7e82da6ed44598ae402d25997c8837",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      const data = await response.json();
      setComparatif(data.choices?.[0]?.message?.content || "Aucune réponse générée.");
    } catch (error) {
      console.error("Erreur lors de la génération de l'analyse:", error);
      setComparatif("Erreur lors de la génération de l'analyse IA.");
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  // Nouvelle fonction: Analyse de progression - "Il progresse où ?"
  const getProgressionAnalysis = async () => {
    if (!decodedPlayerName || loadingProgression) return;
    
    setLoadingProgression(true);
    try {
      const response = await fetch(`/api/csv-direct/player/${encodeURIComponent(decodedPlayerName)}/progression`);
      if (response.ok) {
        const data = await response.json();
        setProgressionData(data);
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse de progression:", error);
    } finally {
      setLoadingProgression(false);
    }
  };

  // Nouvelle fonction: Comparaison de joueurs - "Peux-tu me comparer ça avec X ?"
  const startAutoComparison = async () => {
    if (!decodedPlayerName || loadingAutoComparison) return;
    
    setLoadingAutoComparison(true);
    try {
      const response = await fetch(`/api/csv-direct/player/${encodeURIComponent(decodedPlayerName)}/auto-compare`);
      if (response.ok) {
        const data = await response.json();
        setAutoComparisonData(data);
      }
    } catch (error) {
      console.error("Erreur lors de la comparaison automatique:", error);
    } finally {
      setLoadingAutoComparison(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!playerAnalysis) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Joueur non trouvé</h1>
          <p>Impossible de charger les données pour {decodedPlayerName}</p>
        </div>
      </div>
    );
  }

  const { player, percentiles, strengths, weaknesses, overallRating } = playerAnalysis.analysis;


  const getPercentileColor = (value: number) => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getPercentileTextColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    if (value >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      {/* Header avec boutons d'actions */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-gray-700 p-4 print:hidden">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">PROFIL JOUEUR</h1>
          <div className="flex gap-4">
            <Button 
              onClick={generateComparatif}
              disabled={isGeneratingAnalysis}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGeneratingAnalysis ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Analyse IA
            </Button>
            <Button 
              onClick={handlePrint}
              variant="outline" 
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600 print:hidden"
            >
              <Download className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              className="bg-red-600 hover:bg-red-700 text-white print:hidden"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Profil Principal */}
        <Card className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 border-pink-500/30">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {player.Player.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2" style={{ color: '#ff1493' }}>
                    {player.Player.toUpperCase()}
                  </h1>
                  <div className="flex items-center space-x-4 text-lg">
                    <Badge className="bg-blue-600 text-white">{player.Squad}</Badge>
                    <Badge className="bg-purple-600 text-white">{player.Pos}</Badge>
                    <span className="text-gray-300">{player.Age} ANS</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold text-xl mb-2">
                  {Math.round(overallRating)}/100
                </div>
                <div className="text-sm text-gray-300">NOTE GLOBALE</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-pink-400" />
                  <span className="text-gray-300">Nationalité:</span>
                  <span className="font-semibold">{player.Nation || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-pink-400" />
                  <span className="text-gray-300">Club:</span>
                  <span className="font-semibold">{player.Squad || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-pink-400" />
                  <span className="text-gray-300">Position:</span>
                  <span className="font-semibold">{player.Pos || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-pink-400" />
                  <span className="text-gray-300">Âge:</span>
                  <span className="font-semibold">{player.Age || 'N/A'} ans</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">{player.Gls || 0}</div>
                  <div className="text-sm text-gray-300">Buts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{player.Ast || 0}</div>
                  <div className="text-sm text-gray-300">Passes D.</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques de base */}
        <Card className="bg-black/40 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-green-400" />
              DONNÉES DE PERFORMANCES 2024/2025
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">{player.MP || 0}</div>
                <div className="text-sm text-gray-400">MATCHS</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{player.Gls || 0}</div>
                <div className="text-sm text-gray-400">BUTS</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{player.Ast || 0}</div>
                <div className="text-sm text-gray-400">PASSES DÉCISIVES</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">{player.Min || 0}</div>
                <div className="text-sm text-gray-400">MINUTES</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rapport de Scouting */}
        <Card className="bg-black/40 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#ff1493' }}>
              RAPPORT DE SCOUTING
            </h2>
            <div className="text-sm text-gray-400 mb-6">
              En comparaison aux joueurs évoluant au même poste - Saison 2024/2025
              <br />
              Statistiques par 90' & Centile
            </div>

            <div className="space-y-4">
              {Object.entries(percentiles).map(([key, value]) => {
                const displayValue = typeof value === 'number' ? value.toFixed(2) : value;
                const percentage = typeof value === 'number' ? Math.round(value) : 0;

                return (
                  <div key={key} className="flex items-center space-x-4">
                    <div className="w-48 text-sm font-medium">
                      {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className={`w-16 text-right font-bold ${getPercentileTextColor(percentage)}`}>
                      {displayValue}
                    </div>
                    <div className="flex-1 max-w-md">
                      <div className="w-full bg-gray-700 rounded-full h-6 relative">
                        <div 
                          className={`h-6 rounded-full ${getPercentileColor(percentage)} transition-all duration-500`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                          {percentage}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-900/30 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-blue-300">
                <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-xs">i</span>
                <span>
                  Un 95 signifie que le joueur est meilleur que 95% des joueurs dans cette catégorie.
                  Toutes les statistiques sont ramenées à 90 minutes.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analyse IA */}
        {comparatif && (
          <Card className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/30">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold text-purple-400 mb-4 flex items-center">
                <Brain className="w-6 h-6 mr-3" />
                ANALYSE IA - RAPPORT SCOUT
              </h3>
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {comparatif}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Points Forts et Faibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-green-900/20 border-green-500/30">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-green-400 mb-4">POINTS FORTS</h3>
              <div className="space-y-2">
                {strengths.slice(0, 5).map((strength, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-sm">{strength}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-red-400 mb-4">POINTS À AMÉLIORER</h3>
              <div className="space-y-2">
                {weaknesses.slice(0, 5).map((weakness, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                    <span className="text-sm">{weakness}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NOUVELLES SECTIONS POUR DIRECTEURS SPORTIFS */}
        
        {/* Section 1: "Il progresse où ?" */}
        <Card className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-400 flex items-center">
                <Target className="w-6 h-6 mr-3" />
                "IL PROGRESSE OÙ ?" - ANALYSE DE PROGRESSION
              </h2>
              <Button 
                onClick={getProgressionAnalysis}
                disabled={loadingProgression}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loadingProgression ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Analyser la progression
              </Button>
            </div>

            {progressionData ? (
              <div className="space-y-6">
                {/* Résumé */}
                <div className="bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-bold text-blue-300 mb-2">Résumé exécutif</h3>
                  <p className="text-gray-300">{progressionData.summary?.response}</p>
                  <div className="mt-3 space-y-1">
                    {progressionData.summary?.keyInsights?.map((insight: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        <span className="text-sm text-gray-300">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Domaines de progression */}
                {progressionData.progression?.progressionAreas && (
                  <div>
                    <h3 className="text-lg font-bold text-blue-300 mb-4">Domaines de progression identifiés</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {progressionData.progression.progressionAreas.map((area: any, index: number) => (
                        <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                          <h4 className="font-bold text-blue-200 mb-2">{area.domain}</h4>
                          <div className="space-y-1 text-sm">
                            <div><span className="text-gray-400">Niveau actuel:</span> {area.currentLevel}</div>
                            <div><span className="text-gray-400">Potentiel:</span> {area.potential}</div>
                            <div><span className="text-gray-400">Timeline:</span> {area.timeline}</div>
                            <div className="text-gray-300 mt-2">{area.recommendation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valeur marchande */}
                {progressionData.progression?.marketValue && (
                  <div className="bg-green-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-green-300 mb-2">Projection de valeur marchande</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(progressionData.progression.marketValue.current)}
                        </div>
                        <div className="text-sm text-gray-400">Valeur actuelle</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-400">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(progressionData.progression.marketValue.projected)}
                        </div>
                        <div className="text-sm text-gray-400">Valeur projetée</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">
                          +{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(progressionData.progression.marketValue.potentialGain)}
                        </div>
                        <div className="text-sm text-gray-400">Gain potentiel</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                Cliquez sur "Analyser la progression" pour voir où le joueur peut s'améliorer et sa projection de valeur marchande.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: "Peux-tu me comparer ça avec [Joueur X] ?" */}
        <Card className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-purple-400 flex items-center">
                <User className="w-6 h-6 mr-3" />
                "PEUX-TU ME COMPARER ÇA AVEC [JOUEUR X] ?"
              </h2>
            </div>

            <div className="text-center mb-6">
              <Button
                onClick={startAutoComparison}
                disabled={loadingAutoComparison || !!autoComparisonData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
              >
                {loadingAutoComparison ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Comparaison en cours...
                  </>
                ) : autoComparisonData ? (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Comparaison effectuée
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Comparer avec les joueurs similaires
                  </>
                )}
              </Button>
              {!autoComparisonData && (
                <p className="text-sm text-gray-400 mt-2">
                  Trouvez automatiquement les 3 joueurs avec des statistiques similaires
                </p>
              )}
              
              {autoComparisonData && (
                <div className="mt-4">
                  <Button
                    onClick={() => setAutoComparisonData(null)}
                    variant="outline"
                    className="text-sm"
                  >
                    Nouvelle comparaison
                  </Button>
                </div>
              )}
            </div>

            {autoComparisonData?.success ? (
              <SimpleAutoComparison data={autoComparisonData} />
            ) : loadingAutoComparison ? (
              <div className="text-center py-8">
                <Activity className="h-16 w-16 mx-auto text-muted-foreground mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">Analyse en cours</h3>
                <p className="text-muted-foreground">
                  Recherche des joueurs similaires à {decodedPlayerName}...
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Comparaison Automatique</h3>
                <p className="text-muted-foreground">
                  Cliquez sur le bouton pour comparer {decodedPlayerName} avec les joueurs ayant des statistiques similaires.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm mt-8 pb-8 print:block">
          <div className="border-t border-gray-700 pt-4">
            <p>Source: FBREF.COM • Données saison 2024/2025</p>
            <p>Généré par PlayerStats Analytics Platform</p>
          </div>
        </div>
      </div>

      {/* Styles pour l'impression */}
      <style jsx>{`
        @media print {
          body { 
            background: white !important; 
            color: black !important; 
          }
          .bg-gradient-to-br, .bg-gradient-to-r { background: white !important; }
          .bg-black\\/40, .bg-purple-900\\/40, .bg-blue-900\\/40 { background: white !important; border: 1px solid #ccc !important; }
          .text-white, .text-purple-400, .text-blue-400, .text-green-400 { color: black !important; }
          .text-gray-300 { color: #666 !important; }
          .text-gray-400 { color: #777 !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
}