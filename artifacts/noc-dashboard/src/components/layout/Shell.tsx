import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { Activity, LayoutDashboard, Ticket, Users, Building, Tags, LogOut, Loader2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "noc_engineer", "manager"] },
  { href: "/tickets", label: "Tickets", icon: Ticket, roles: ["admin", "noc_engineer", "manager"] },
  { href: "/customers", label: "Customers", icon: Building, roles: ["admin", "noc_engineer", "manager"] },
  { href: "/categories", label: "Categories", icon: Tags, roles: ["admin"] },
  { href: "/departments", label: "Departments", icon: Briefcase, roles: ["admin"] },
  { href: "/users", label: "Users", icon: Users, roles: ["admin"] },
];

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const logout = useLogout();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <Activity className="h-6 w-6 text-primary mr-3" />
          <span className="font-bold text-lg text-sidebar-foreground tracking-tight">NOC Command</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.filter(item => item.roles.includes(user.role)).map((item) => {
              const isActive = location.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <div
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout.mutate(undefined, { onSuccess: () => window.location.href = "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
