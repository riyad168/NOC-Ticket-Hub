import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function MonthlyReport() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Monthly Report</h1>
        <p className="text-muted-foreground mt-1">Summary of operations for the month.</p>
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Monthly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            Monthly report content will be implemented here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
