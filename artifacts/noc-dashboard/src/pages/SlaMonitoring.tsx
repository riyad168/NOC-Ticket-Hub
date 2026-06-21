import React from "react";
import Tickets from "./Tickets";

export default function SlaMonitoring() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SLA Monitoring</h1>
        <p className="text-muted-foreground mt-1 text-destructive font-medium">Tickets that have breached their SLA.</p>
      </div>
      <div className="bg-card shadow-sm rounded-lg overflow-hidden border">
        {/* We reuse the Tickets component, ideally filtered. */}
        <Tickets />
      </div>
    </div>
  );
}
