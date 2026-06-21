import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Shell } from "@/components/layout/Shell";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

const Login = React.lazy(() => import("@/pages/Login"));
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Tickets = React.lazy(() => import("@/pages/Tickets"));
const TicketDetail = React.lazy(() => import("@/pages/TicketDetail"));
const TicketNew = React.lazy(() => import("@/pages/TicketNew"));
const Customers = React.lazy(() => import("@/pages/Customers"));
const Users = React.lazy(() => import("@/pages/Users"));
const Categories = React.lazy(() => import("@/pages/Categories"));
const Departments = React.lazy(() => import("@/pages/Departments"));
const MyTickets = React.lazy(() => import("@/pages/MyTickets"));
const SlaMonitoring = React.lazy(() => import("@/pages/SlaMonitoring"));
const DailyReport = React.lazy(() => import("@/pages/DailyReport"));
const MonthlyReport = React.lazy(() => import("@/pages/MonthlyReport"));
const EngineerPerformance = React.lazy(() => import("@/pages/EngineerPerformance"));
const Profile = React.lazy(() => import("@/pages/Profile"));

const queryClient = new QueryClient();

const loader = (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="animate-spin text-primary h-8 w-8" />
  </div>
);

function ProtectedRoute({
  component: Component,
  fixedLayout = false,
}: {
  component: React.ComponentType;
  fixedLayout?: boolean;
}) {
  return (
    <Shell>
      <React.Suspense fallback={loader}>
        {fixedLayout ? (
          <Component />
        ) : (
          <div className="h-full overflow-y-auto">
            <Component />
          </div>
        )}
      </React.Suspense>
    </Shell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/login">
        <React.Suspense fallback={null}>
          <Login />
        </React.Suspense>
      </Route>

      {/* Dashboard: fixed layout — fills viewport, no outer scroll */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} fixedLayout={true} /></Route>

      {/* All other pages: scrollable wrapper */}
      <Route path="/tickets"><ProtectedRoute component={Tickets} /></Route>
      <Route path="/tickets/new"><ProtectedRoute component={TicketNew} /></Route>
      <Route path="/tickets/:id"><ProtectedRoute component={TicketDetail} /></Route>
      <Route path="/customers"><ProtectedRoute component={Customers} /></Route>
      <Route path="/users"><ProtectedRoute component={Users} /></Route>
      <Route path="/categories"><ProtectedRoute component={Categories} /></Route>
      <Route path="/departments"><ProtectedRoute component={Departments} /></Route>
      <Route path="/my-tickets"><ProtectedRoute component={MyTickets} /></Route>
      <Route path="/sla-monitoring"><ProtectedRoute component={SlaMonitoring} /></Route>
      <Route path="/reports/daily"><ProtectedRoute component={DailyReport} /></Route>
      <Route path="/reports/monthly"><ProtectedRoute component={MonthlyReport} /></Route>
      <Route path="/reports/engineer"><ProtectedRoute component={EngineerPerformance} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
