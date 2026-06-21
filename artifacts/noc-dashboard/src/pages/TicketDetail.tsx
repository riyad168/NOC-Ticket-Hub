import React from "react";
import { useRoute, Link } from "wouter";
import { useGetTicket, useUpdateTicket, useGetMe, TicketDetailStatus } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Clock, User, Building, Tag, Activity } from "lucide-react";
import { StatusBadge } from "@/pages/Tickets";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function TicketDetail() {
  const [, params] = useRoute("/tickets/:id");
  const ticketId = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();

  const { data: ticket, isLoading } = useGetTicket(ticketId, {
    query: {
      enabled: !!ticketId,
    }
  });

  const updateTicket = useUpdateTicket();

  const handleStatusChange = (newStatus: TicketDetailStatus) => {
    updateTicket.mutate({
      id: ticketId,
      data: { status: newStatus as any }
    }, {
      onSuccess: () => {
        toast({ title: "Status updated successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", String(ticketId)] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to update status" });
      }
    });
  };

  const handleAssignToMe = () => {
    if (!me) return;
    updateTicket.mutate({
      id: ticketId,
      data: { assignedTo: me.id }
    }, {
      onSuccess: () => {
        toast({ title: "Assigned successfully" });
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", String(ticketId)] });
      }
    });
  };

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/tickets" className="hover:text-foreground flex items-center transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tickets
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight font-mono text-primary">{ticket.ticketNumber}</h1>
            <StatusBadge status={ticket.status as any} />
            {ticket.slaBreached && (
              <span className="bg-destructive/20 text-destructive border border-destructive/30 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                <Clock className="h-3 w-3 mr-1" /> SLA BREACH
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Created on {format(new Date(ticket.createdAt), "PPP 'at' p")} by {ticket.createdBy?.name || "System"}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!ticket.assignedEngineer && (
            <Button variant="outline" onClick={handleAssignToMe} disabled={updateTicket.isPending}>
              Assign to Me
            </Button>
          )}
          <Select 
            value={ticket.status} 
            onValueChange={(val) => handleStatusChange(val as TicketDetailStatus)}
            disabled={updateTicket.isPending}
          >
            <SelectTrigger className="w-[160px] font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In_Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Incident Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                {ticket.remarks ? (
                  <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-muted/30 p-4 rounded-md border border-border">
                    {ticket.remarks}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">No remarks provided.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(ticket as any).logs?.map((log: any) => (
                  <div key={log.id} className="flex gap-4 relative">
                    <div className="w-px h-full bg-border absolute left-[11px] top-6 bottom-0" />
                    <div className="mt-1 w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center flex-shrink-0 z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm font-medium">
                        {log.user.name} <span className="text-muted-foreground font-normal ml-2">{log.action}</span>
                      </p>
                      {log.description && (
                        <p className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded border border-border inline-block">
                          {log.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                      </p>
                    </div>
                  </div>
                ))}
                {(!(ticket as any).logs || (ticket as any).logs.length === 0) && (
                  <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Customer</p>
                  <p className="text-sm text-muted-foreground">{ticket.customer.name}</p>
                  {ticket.customer.contactPerson && (
                    <p className="text-xs text-muted-foreground mt-1">Contact: {ticket.customer.contactPerson}</p>
                  )}
                  {ticket.customer.phone && (
                    <p className="text-xs text-muted-foreground">Tel: {ticket.customer.phone}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Category</p>
                  <span className="inline-block mt-1 bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs">
                    {ticket.category.name}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Assigned Engineer</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.assignedEngineer ? ticket.assignedEngineer.name : "Unassigned"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Last Updated</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {format(new Date(ticket.updatedAt), "yyyy-MM-dd HH:mm")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
