import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import PlayerProfile from "@/pages/PlayerProfile";
import PlayerDetailedProfile from "@/pages/PlayerDetailedProfile";
import Comparison from "@/pages/Comparison";
import Teams from "@/pages/Teams";
import Leagues from "@/pages/Leagues";
import CSVAnalyzer from "@/pages/CSVAnalyzer";
import StreamlitEquivalent from "@/pages/StreamlitEquivalent";
import BeautifulCSVDashboard from "@/pages/BeautifulCSVDashboard";
import MatchAnalyzer from "@/pages/MatchAnalyzer";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={BeautifulCSVDashboard} />
      <Route path="/old-home" component={Home} />
      <Route path="/player/:id" component={PlayerProfile} />
      <Route path="/player-profile/:playerName" component={PlayerDetailedProfile} />
      <Route path="/joueur/:playerName" component={PlayerDetailedProfile} />
      <Route path="/comparison/:id?" component={Comparison} />
      <Route path="/teams" component={Teams} />
      <Route path="/leagues" component={Leagues} />
      <Route path="/csv-analyzer" component={CSVAnalyzer} />
      <Route path="/streamlit-style" component={StreamlitEquivalent} />
      <Route path="/matches" component={MatchAnalyzer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen text-white" style={{ backgroundColor: 'hsl(0, 0%, 3.9%)' }}>
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;