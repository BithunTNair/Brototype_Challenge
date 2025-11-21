import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, LayoutDashboard, Settings, Crown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user, userRole } = useAuth();
  const location = useLocation();
  const [userName, setUserName] = useState<string>("");

  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isSuperAdmin = userRole === "super_admin";

  useEffect(() => {
    if (user?.id) {
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setUserName(data.full_name);
        });
    }
  }, [user?.id]);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(isAdmin ? [{ path: "/admin", label: "Admin Panel", icon: Settings }] : []),
    ...(isSuperAdmin ? [{ path: "/super-admin", label: "Super Admin", icon: Crown }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Bro VoiceBox
              </Link>
              <div className="hidden md:flex items-center space-x-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                        location.pathname === item.path
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isAdmin && (
                <Link to="/complaint/new">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Complaint</span>
                  </Button>
                </Link>
              )}
              <div className="text-sm text-muted-foreground hidden sm:block">
                {userName || user?.email}
              </div>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
