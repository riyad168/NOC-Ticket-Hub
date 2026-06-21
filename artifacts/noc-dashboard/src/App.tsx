import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Shell } from "@/components/layout/Shell";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

// Lazy load pages
const Login = React.lazy(() => import("@/pages/Login"));
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Tickets = React.lazy(() => import("@/pages/Tickets"));
const TicketDetail = React.lazy(() => import("@/pages/TicketDetail"));
const TicketNew = React.lazy(() => import("@/pages/TicketNew"));
const Customers = React.lazy(() => import("@/pages/Customers"));
const Users = React.lazy(() => import("@/pages/Users"));
const Categories = React.lazy(() => import("@/pages/Categories"));

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Shell>
      <React.Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary h-8 w-8"/></div>}>
        <Component />
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
      
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/tickets"><ProtectedRoute component={Tickets} /></Route>
      <Route path="/tickets/new"><ProtectedRoute component={TicketNew} /></Route>
      <Route path="/tickets/:id"><ProtectedRoute component={TicketDetail} /></Route>
      <Route path="/customers"><ProtectedRoute component={Customers} /></Route>
      <Route path="/users"><ProtectedRoute component={Users} /></Route>
      <Route path="/categories"><ProtectedRoute component={Categories} /></Route>
      
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
