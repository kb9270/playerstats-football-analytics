import { Link, useLocation } from "wouter";
import { Search, BarChart3, Users, Trophy } from "lucide-react";

export default function Header() {
  const [location] = useLocation();

  const navItems = [
    { path: "/comparison", label: "Comparaison", icon: BarChart3, active: location.startsWith("/comparison") },
    { path: "/", label: "Joueurs", icon: Users, active: location === "/" },
    { path: "/teams", label: "Équipes", icon: Trophy, active: location.startsWith("/teams") },
    { path: "/leagues", label: "Ligues", icon: Trophy, active: location.startsWith("/leagues") },
  ];

  return (
    <header className="relative z-10 bg-stats-secondary/80 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <div className="text-2xl font-bold text-white">
              PLAYER<span className="text-stats-accent">STATS</span>
            </div>
            <div className="hidden md:block text-sm text-gray-400">
              Analyses Footballistiques Avancées
            </div>
          </Link>
          
          <nav className="flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 transition-colors ${
                    item.active 
                      ? "text-stats-accent" 
                      : "text-gray-400 hover:text-stats-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
