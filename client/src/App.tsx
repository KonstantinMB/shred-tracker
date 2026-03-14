import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import WeightPage from "@/pages/WeightPage";
import NutritionPage from "@/pages/NutritionPage";
import WorkoutsPage from "@/pages/WorkoutsPage";
import StrengthPage from "@/pages/StrengthPage";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router hook={useHashLocation}>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          {/* On desktop: offset for fixed 256px sidebar. On mobile: offset for 56px top bar */}
          <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen overflow-x-hidden">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/weight" component={WeightPage} />
              <Route path="/nutrition" component={NutritionPage} />
              <Route path="/workouts" component={WorkoutsPage} />
              <Route path="/strength" component={StrengthPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
