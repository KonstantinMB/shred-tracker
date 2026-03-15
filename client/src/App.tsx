import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseConfigBanner } from "@/components/SupabaseConfigBanner";
import { hasSupabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

const bannerVisible = !hasSupabase() && !import.meta.env.DEV;
import Dashboard from "@/pages/Dashboard";
import WeightPage from "@/pages/WeightPage";
import NutritionPage from "@/pages/NutritionPage";
import WorkoutsPage from "@/pages/WorkoutsPage";
import StrengthPage from "@/pages/StrengthPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseConfigBanner />
      <Router hook={useHashLocation}>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          {/* On desktop: offset for fixed 256px sidebar. On mobile: offset for 56px top bar. When Supabase banner visible, add top padding so content doesn't overlap. */}
          <main className={`flex-1 min-w-0 md:ml-64 pb-16 md:pb-0 min-h-screen overflow-x-hidden ${bannerVisible ? "pt-24 md:pt-10" : "pt-14 md:pt-0"}`}>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/weight" component={WeightPage} />
              <Route path="/nutrition" component={NutritionPage} />
              <Route path="/workouts" component={WorkoutsPage} />
              <Route path="/strength" component={StrengthPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route component={NotFound} />
            </Switch>
            <BottomNav />
          </main>
        </div>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
