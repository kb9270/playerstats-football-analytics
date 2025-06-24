import { useState } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Search, TrendingUp, Users, Target } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-16 bg-stats-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6">
              Rechercher des <span className="text-stats-accent">Joueurs</span>
            </h1>
            <p className="text-gray-300 text-xl max-w-2xl mx-auto">
              Comparez les performances avec des données en temps réel provenant de FBref et Transfermarkt
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto mb-12">
            <SearchBar />
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Card className="stats-card p-6 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-stats-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-stats-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Recherche Avancée</h3>
                <p className="text-gray-400">
                  Trouvez n'importe quel joueur avec notre moteur de recherche intelligent
                </p>
              </CardContent>
            </Card>
            
            <Card className="stats-card p-6 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-stats-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-stats-blue" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Données Temps Réel</h3>
                <p className="text-gray-400">
                  Statistiques mises à jour automatiquement depuis les sources officielles
                </p>
              </CardContent>
            </Card>
            
            <Card className="stats-card p-6 text-center">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-stats-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-stats-green" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Analyses Détaillées</h3>
                <p className="text-gray-400">
                  Rapports de scouting avec percentiles et comparaisons avancées
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Popular Searches */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Recherches <span className="text-stats-accent">Populaires</span>
          </h2>
          
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Kylian Mbappé",
              "Erling Haaland",
              "Lionel Messi",
              "Mohamed Salah",
              "Kevin De Bruyne",
              "Vinicius Jr",
              "Jude Bellingham",
              "Pedri"
            ].map((name) => (
              <button
                key={name}
                className="px-6 py-3 bg-stats-secondary/60 border border-gray-700 rounded-full hover:border-stats-accent hover:text-stats-accent transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
