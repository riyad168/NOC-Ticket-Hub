import React, { useState } from "react";
import { Link } from "wouter";
import { useListTickets, Ticket, TicketStatus } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Loader2, AlertCircle } from "lucide-react";

export function StatusBadge({ status }: { status: TicketStatus }) {
  const styles = {
    Open: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    In_Progress: "bg-chart-1/20 text-chart-1 border-chart-1/30",
    Resolved: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    Closed: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function Tickets() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: tickets, isLoading } = useListTickets({ 
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">Manage and track network incidents.</p>
        </div>
        <Link href="/tickets/new">
          <Button className="font-bold tracking-wide">
            <Plus className="mr-2 h-4 w-4" />
            NEW TICKET
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tickets by number, customer..." 
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-background">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In_Progress">In Progress</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px]">Ticket No.</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : tickets?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No tickets found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              tickets?.map((ticket) => (
                <TableRow key={ticket.id} className="group cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-primary font-medium">
                    <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                      {ticket.ticketNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{ticket.customer.name}</TableCell>
                  <TableCell>
                    <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs">
                      {ticket.category.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ticket.status} />
                      {ticket.slaBreached && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {ticket.assignedEngineer?.name || "Unassigned"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(ticket.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
