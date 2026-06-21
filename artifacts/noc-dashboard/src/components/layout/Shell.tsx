import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { 
  Shield, 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  User, 
  AlertTriangle, 
  Calendar, 
  BarChart2, 
  TrendingUp, 
  Building2, 
  Tags, 
  Users, 
  Briefcase, 
  UserCircle, 
  LogOut, 
  Loader2, 
  Bell, 
  Send,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navGroups = [
  {
    label: "TICKET MANAGEMENT",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "noc_engineer", "manager"] },
      { href: "/tickets/new", label: "Create Ticket", icon: PlusCircle, roles: ["admin", "noc_engineer", "manager"] },
      { href: "/tickets", label: "All Tickets", icon: List, roles: ["admin", "noc_engineer", "manager"] },
      { href: "/my-tickets", label: "My Tickets", icon: User, roles: ["admin", "noc_engineer", "manager"] },
      { href: "/sla-monitoring", label: "SLA Monitoring", icon: AlertTriangle, roles: ["admin", "noc_engineer", "manager"] },
    ]
  },
  {
    label: "REPORTS",
    items: [
      { href: "/reports/daily", label: "Daily Report", icon: Calendar, roles: ["admin", "manager"] },
      { href: "/reports/monthly", label: "Monthly Report", icon: BarChart2, roles: ["admin", "manager"] },
      { href: "/reports/engineer", label: "Engineer Performance", icon: TrendingUp, roles: ["admin", "manager"] },
    ]
  },
  {
    label: "MASTER DATA",
    items: [
      { href: "/customers", label: "Customers", icon: Building2, roles: ["admin"] },
      { href: "/categories", label: "Ticket Categories", icon: Tags, roles: ["admin"] },
      { href: "/users", label: "Users", icon: Users, roles: ["admin"] },
      { href: "/departments", label: "Departments", icon: Briefcase, roles: ["admin"] },
    ]
  },
  {
    label: "SETTINGS",
    items: [
      { href: "/profile", label: "Profile", icon: UserCircle, roles: ["admin", "noc_engineer", "manager"] },
    ]
  }
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
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-full z-20">
        <div className="h-16 flex items-center px-4 justify-between border-b border-sidebar-border bg-sidebar shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg text-white tracking-tight">NOC SYSTEM</span>
          </div>
          <button className="text-sidebar-foreground hover:text-white transition-colors">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
          {navGroups.map((group) => {
            const groupItems = group.items.filter(item => item.roles.includes(user.role));
            if (groupItems.length === 0) return null;
            return (
              <div key={group.label} className="space-y-2">
                <h3 className="px-3 text-xs font-semibold text-sidebar-foreground uppercase tracking-wider">
                  {group.label}
                </h3>
                <ul className="space-y-1">
                  {groupItems.map((item) => {
                    const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href) && item.href !== "/tickets/new");
                    return (
                      <li key={item.href}>
                        <Link href={item.href}>
                          <div
                            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-white"
                            }`}
                          >
                            <item.icon className="mr-3 h-4 w-4" />
                            {item.label}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          
          <div className="space-y-2">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => logout.mutate(undefined, { onSuccess: () => window.location.href = "/login" })}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {/* Header */}
        <header className="h-16 flex-shrink-0 bg-card border-b border-border flex items-center justify-between px-6 z-10 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">NOC Ticket Management System</h1>
          
          <div className="flex items-center gap-6">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                3
              </span>
            </button>
            <button className="text-cyan-600 hover:text-cyan-700 transition-colors">
              <Send className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden p-4 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
};
