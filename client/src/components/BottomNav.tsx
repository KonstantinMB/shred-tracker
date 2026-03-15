import { useState } from "react";
import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Menu,
  Weight,
  TrendingUp,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/nutrition", label: "Nutrition", icon: Utensils },
];

const moreNavItems = [
  { href: "/weight", label: "Weight", icon: Weight },
  { href: "/strength", label: "Strength", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const [location] = useHashLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return location === "/" || location === "";
    return location.startsWith(href);
  };

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-card border-t border-border flex items-center justify-around z-40 pb-[env(safe-area-inset-bottom)]"
        aria-label="Bottom navigation"
      >
        {mainNavItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <a
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 min-w-0 gap-0.5 text-xs font-medium transition-colors",
                isActive(href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate max-w-[80px]">{label}</span>
            </a>
          </Link>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-2 min-w-0 gap-0.5 text-xs font-medium transition-colors",
            moreNavItems.some(({ href }) => isActive(href))
              ? "text-primary"
              : "text-muted-foreground"
          )}
          aria-label="More"
        >
          <Menu className="w-5 h-5 flex-shrink-0" />
          <span className="truncate max-w-[80px]">More</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-xl pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 mt-4">
            {moreNavItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <a
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive(href)
                      ? "nav-active"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {label}
                </a>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
