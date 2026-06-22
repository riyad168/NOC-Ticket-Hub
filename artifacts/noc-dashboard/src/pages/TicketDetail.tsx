import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetTicket,
  useUpdateTicket,
  useGetMe,
  useListUsers,
  useListDepartments,
  useGetTicketTransfers,
  useTransferTicket,
  TicketDetailStatus,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Clock, User, Building, Tag, Activity, ArrowRightLeft, X } from "lucide-react";
import { StatusBadge } from "@/pages/Tickets";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function TicketDetail() {
  const [, params] = useRoute("/tickets/:id");
  const ticketId = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();

  const { data: ticket, isLoading } = useGetTicket(ticketId, { query: { enabled: !!ticketId } });
  const { data: transfers } = useGetTicketTransfers(ticketId);
  const { data: users } = useListUsers();
  const { data: departments } = useListDepartments();

  const updateTicket = useUpdateTicket();
  const transferTicket = useTransferTicket();

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferType, setTransferType] = useState<"user" | "department">("user");
  const [targetId, setTargetId] = useState<string>("");
  const [transferRemark, setTransferRemark] = useState("");

  const handleStatusChange = (newStatus: TicketDetailStatus) => {
    updateTicket.mutate({ id: ticketId, data: { status: newStatus as any } }, {
      onSuccess: () => {
        toast({ title: "Status updated" });
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update status" }),
    });
  };

  const handleAssignToMe = () => {
    if (!me) return;
    updateTicket.mutate({ id: ticketId, data: { assignedTo: me.id } }, {
      onSuccess: () => {
        toast({ title: "Assigned to you" });
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      },
    });
  };

  const handleTransfer = () => {
    if (!targetId) { toast({ variant: "destructive", title: "Please select a target" }); return; }
    if (!transferRemark.trim()) { toast({ variant: "destructive", title: "Remark is required for transfer" }); return; }
    transferTicket.mutate(
      { ticketId, data: { type: transferType, targetId: parseInt(targetId), remark: transferRemark } },
      {
        onSuccess: () => {
          toast({ title: "Ticket transferred successfully" });
          setShowTransfer(false);
          setTargetId("");
          setTransferRemark("");
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: err?.data?.error || "Transfer failed" });
        },
      }
    );
  };

  if (isLoading || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isClosed = ticket.status === "Closed" || ticket.status === "Resolved";

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Link href="/tickets" className="hover:text-foreground flex items-center transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tickets
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono text-primary">{ticket.ticketNumber}</h1>
            <StatusBadge status={ticket.status as any} />
            {ticket.slaBreached && (
              <span className="bg-destructive/20 text-destructive border border-destructive/30 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" /> SLA BREACH
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Created {format(new Date(ticket.createdAt), "PPP 'at' p")} by {ticket.createdBy?.name || "System"}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!ticket.assignedEngineer && !isClosed && (
            <Button variant="outline" size="sm" onClick={handleAssignToMe} disabled={updateTicket.isPending}>
              Assign to Me
            </Button>
          )}
          {!isClosed && (
            <Button
              variant="outline"
              size="sm"
              className="text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={() => setShowTransfer(true)}
            >
              <ArrowRightLeft className="h-4 w-4 mr-1" /> Transfer
            </Button>
          )}
          <Select
            value={ticket.status}
            onValueChange={(val) => handleStatusChange(val as TicketDetailStatus)}
            disabled={updateTicket.isPending}
          >
            <SelectTrigger className="w-[150px] text-sm font-medium">
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

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-semibold">Transfer Ticket</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{ticket.ticketNumber}</p>
              </div>
              <button onClick={() => setShowTransfer(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Transfer type */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Transfer To</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setTransferType("user"); setTargetId(""); }}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      transferType === "user"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <User className="h-4 w-4 inline mr-1.5" /> User
                  </button>
                  <button
                    onClick={() => { setTransferType("department"); setTargetId(""); }}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      transferType === "department"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Building className="h-4 w-4 inline mr-1.5" /> Department
                  </button>
                </div>
              </div>

              {/* Target selector */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  {transferType === "user" ? "Select User" : "Select Department"}
                </Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={transferType === "user" ? "Choose a user..." : "Choose a department..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {transferType === "user"
                      ? users?.filter(u => u.id !== me?.id).map(u => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name} <span className="text-muted-foreground text-xs ml-1 capitalize">({u.role.replace("_", " ")})</span>
                          </SelectItem>
                        ))
                      : departments?.map(d => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Remark — mandatory */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Remark <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Explain why you are transferring this ticket..."
                  value={transferRemark}
                  onChange={e => setTransferRemark(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground">Remark is mandatory for every transfer.</p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowTransfer(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleTransfer}
                disabled={transferTicket.isPending || !targetId || !transferRemark.trim()}
              >
                {transferTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Confirm Transfer
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details + activity + transfers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Remarks */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Incident Details</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.remarks ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 p-4 rounded-lg border border-border font-mono">
                  {ticket.remarks}
                </p>
              ) : (
                <p className="text-muted-foreground italic text-sm">No remarks provided.</p>
              )}
            </CardContent>
          </Card>

          {/* Transfer History */}
          {transfers && transfers.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-amber-500" /> Transfer History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transfers.map((t) => (
                    <div key={t.id} className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="mt-1 h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <ArrowRightLeft className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          <span className="text-amber-700">{t.transferBy.name}</span>
                          {" transferred to "}
                          <span className="font-semibold text-foreground">
                            {t.toUser ? t.toUser.name : t.toDept ? t.toDept.name : "Unknown"}
                          </span>
                          {t.toDept && (
                            <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">dept</span>
                          )}
                        </p>
                        <p className="text-xs text-amber-800 bg-amber-100/70 px-2 py-1 rounded border border-amber-200">
                          {t.remark}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {format(new Date(t.createdAt), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {(ticket as any).logs?.map((log: any) => (
                  <div key={log.id} className="flex gap-3 relative">
                    <div className="w-px h-full bg-border absolute left-[11px] top-6 bottom-0" />
                    <div className="mt-1 w-6 h-6 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shrink-0 z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-sm font-medium">
                        {log.user.name}{" "}
                        <span className="text-muted-foreground font-normal">{log.action}</span>
                      </p>
                      {log.description && (
                        <p className="text-xs text-muted-foreground mt-1 bg-muted/30 px-2 py-1.5 rounded border border-border">
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

        {/* Right: Properties */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PropRow icon={<Building className="h-4 w-4" />} label="Customer">
                <p className="text-sm font-medium">{ticket.customer.name}</p>
                {ticket.customer.contactPerson && (
                  <p className="text-xs text-muted-foreground">Contact: {ticket.customer.contactPerson}</p>
                )}
                {ticket.customer.phone && (
                  <p className="text-xs text-muted-foreground">Tel: {ticket.customer.phone}</p>
                )}
              </PropRow>

              <PropRow icon={<Tag className="h-4 w-4" />} label="Category">
                <span className="inline-block bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs mt-1">
                  {ticket.category.name}
                </span>
              </PropRow>

              {(ticket as any).department && (
                <PropRow icon={<Building className="h-4 w-4" />} label="Department">
                  <p className="text-sm">{(ticket as any).department.name}</p>
                </PropRow>
              )}

              <PropRow icon={<User className="h-4 w-4" />} label="Assigned Engineer">
                {ticket.assignedEngineer ? (
                  <p className="text-sm font-medium">{ticket.assignedEngineer.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Unassigned</p>
                )}
              </PropRow>

              <PropRow icon={<Clock className="h-4 w-4" />} label="Last Updated">
                <p className="text-xs font-mono text-muted-foreground">
                  {format(new Date(ticket.updatedAt), "yyyy-MM-dd HH:mm")}
                </p>
              </PropRow>
            </CardContent>
          </Card>

          {/* Transfer count badge */}
          {transfers && transfers.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-medium">{transfers.length} transfer{transfers.length > 1 ? "s" : ""} recorded</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Last: {format(new Date(transfers[0].createdAt), "MMM dd HH:mm")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PropRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        {children}
      </div>
    </div>
  );
}
