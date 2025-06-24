import { Link } from "wouter";
import { Mail, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-stats-secondary/80 backdrop-blur-sm border-t border-gray-800 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-xl font-bold text-white mb-4">
              PLAYER<span className="text-stats-accent">STATS</span>
            </div>
            <p className="text-gray-400 text-sm">
              Plateforme d'analyse footballistique avec données en temps réel.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Fonctionnalités</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/comparison" className="hover:text-stats-accent transition-colors">
                  Comparaison de joueurs
                </Link>
              </li>
              <li>
                <span className="hover:text-stats-accent transition-colors cursor-pointer">
                  Rapports de scouting
                </span>
              </li>
              <li>
                <span className="hover:text-stats-accent transition-colors cursor-pointer">
                  Données en temps réel
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Ligues</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <span className="hover:text-stats-accent transition-colors cursor-pointer">
                  Ligue 1
                </span>
              </li>
              <li>
                <span className="hover:text-stats-accent transition-colors cursor-pointer">
                  Premier League
                </span>
              </li>
              <li>
                <span className="hover:text-stats-accent transition-colors cursor-pointer">
                  Champions League
                </span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-4">Sources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <ExternalLink className="w-3 h-3" />
                <span>Données: FBref.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <ExternalLink className="w-3 h-3" />
                <span>Valeurs: Transfermarkt</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-3 h-3" />
                <span>support@playerstats.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
          © 2024 PlayerStats. Toutes les données proviennent de sources officielles et sont mises à jour en temps réel.
        </div>
      </div>
    </footer>
  );
}
