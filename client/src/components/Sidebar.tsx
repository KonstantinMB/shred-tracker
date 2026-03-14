import { useState } from "react";
import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useProfile } from "@/hooks/useProfile";
import {
  LayoutDashboard,
  Weight,
  Utensils,
  Dumbbell,
  TrendingUp,
  Flame,
  Menu,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/weight", label: "Weight", icon: Weight },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/strength", label: "Strength", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: User },
];

function SidebarFooter() {
  const { profile, targets } = useProfile();
  return (
    <div className="px-6 py-4 border-t border-border">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Flame className="w-3.5 h-3.5 text-warning flex-shrink-0" />
        <span>{targets.calories.toLocaleString()} kcal · {targets.protein}g protein</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{profile.location || "Set location in Profile"}</div>
    </div>
  );
}

function SidebarProfile() {
  const { profile, targets, weightTargets } = useProfile();
  const { start, goal, months } = weightTargets;
  const startDate = profile.startDate ? new Date(profile.startDate) : new Date();
  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.max(1, Math.floor(daysSinceStart / 7) + 1);
  const progressPct = months > 0 ? Math.min(100, (currentWeek / (months * 4)) * 100) : 0;
  return (
    <div className="px-6 py-4 border-b border-border">
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>Progress</span>
        <span>Week {currentWeek} / {months * 4}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full fill-animate transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="flex justify-between text-xs mt-2">
        <span className="text-muted-foreground">{start} kg</span>
        <span className="text-primary font-medium">→ {goal} kg</span>
      </div>
    </div>
  );
}

function SidebarContent({
  location,
  isActive,
  onNavClick,
}: {
  location: string;
  isActive: (href: string) => boolean;
  onNavClick?: () => void;
}) {
  const { profile } = useProfile();
  return (
  <>
    {/* Logo */}
    <div className="px-6 py-5 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-label="Shred Tracker">
            <path
              d="M12 2C12 2 7 7 7 12.5C7 15.54 9.24 18 12 18C14.76 18 17 15.54 17 12.5C17 10 15 8 15 8C15 8 14.5 10 13 10.5C13 10.5 14 8.5 12 2Z"
              fill="hsl(186,90%,42%)"
            />
            <path
              d="M12 14C12 14 10 13 10 11.5C10 10.5 10.8 9.5 10.8 9.5C10.8 9.5 11 11 12 11.5C13 12 13.5 11 13.5 11C13.5 11 14 12.5 13 13.5C12.5 14 12 14 12 14Z"
              fill="hsl(38,90%,55%)"
            />
            <path
              d="M9 18C9 19.1 9.9 20 11 20H13C14.1 20 15 19.1 15 18"
              stroke="hsl(186,90%,42%)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <div className="text-sm font-bold text-foreground leading-tight">SUMMER SHRED</div>
          <div className="text-xs text-muted-foreground">{profile.name || "You"} · {profile.goalMonths || 12} Weeks</div>
        </div>
      </div>
    </div>

    {/* Progress bar - uses profile via SidebarProfile */}
    <SidebarProfile />

    {/* Nav items */}
    <nav className="flex-1 px-3 py-4 space-y-1" data-testid="sidebar-nav">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}>
          <a
            data-testid={`nav-${label.toLowerCase()}`}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer",
              isActive(href)
                ? "nav-active"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </a>
        </Link>
      ))}
    </nav>

    {/* Bottom - uses profile */}
    <SidebarFooter />
  </>
  );
}

export default function Sidebar() {
  const [location] = useHashLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location === "/" || location === "";
    return location.startsWith(href);
  };

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex-col z-50">
        <SidebarContent location={location} isActive={isActive} />
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M12 2C12 2 7 7 7 12.5C7 15.54 9.24 18 12 18C14.76 18 17 15.54 17 12.5C17 10 15 8 15 8C15 8 14.5 10 13 10.5C13 10.5 14 8.5 12 2Z" fill="hsl(186,90%,42%)" />
              <path d="M12 14C12 14 10 13 10 11.5C10 10.5 10.8 9.5 10.8 9.5C10.8 9.5 11 11 12 11.5C13 12 13.5 11 13.5 11C13.5 11 14 12.5 13 13.5C12.5 14 12 14 12 14Z" fill="hsl(38,90%,55%)" />
            </svg>
          </div>
          <span className="text-sm font-bold text-foreground">SUMMER SHRED</span>
        </div>
        <button
          data-testid="mobile-menu-button"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50"
          onClick={() => setMobileOpen(false)}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* drawer */}
          <aside
            className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent
              location={location}
              isActive={isActive}
              onNavClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
