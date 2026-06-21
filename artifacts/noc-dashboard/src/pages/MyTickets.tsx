import React from "react";
import Tickets from "./Tickets";
import { useAuth } from "@/lib/auth";

export default function MyTickets() {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
        <p className="text-muted-foreground mt-1">Tickets currently assigned to you.</p>
      </div>
      <div className="bg-card shadow-sm rounded-lg overflow-hidden border">
        {/* We reuse the Tickets component but it would ideally accept an initial filter.
            For now we render it as is, or we could pass a prop if we modify Tickets.tsx */}
        <Tickets initialEngineer={user.id.toString()} />
      </div>
    </div>
  );
}
