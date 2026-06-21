import React from "react";
import { 
  useGetDashboardStats, 
  useGetDashboardChart, 
  useGetDashboardCategories, 
  useGetRecentActivity,
  useListTickets
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Grid, 
  Hourglass, 
  CheckCircle2, 
  AlertTriangle,
  Eye
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data: stats } = useGetDashboardStats();
  const { data: chartData } = useGetDashboardChart();
  const { data: categories } = useGetDashboardCategories();
  const { data: activities } = useGetRecentActivity();
  const { data: tickets } = useListTickets();

  const formattedChartData = chartData?.days.map((day, i) => ({
    name: format(new Date(day), 'dd/MM'),
    Open: chartData.openCounts[i],
    Resolved: chartData.resolvedCounts[i],
    Closed: chartData.closedCounts[i]
  })) || [];

  const slaPercent = stats && stats.total > 0
    ? Math.round((stats.slaBreached / stats.total) * 100)
    : 0;
  const dashArray = `${slaPercent}, 100`;

  return (
    <div className="h-full flex flex-col gap-3">

      {/* Row 1 — Stat Cards */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <StatCard
          title="Total Tickets"
          value={stats?.total ?? 0}
          change={stats?.totalChange ?? 0}
          icon={<div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Grid className="h-4 w-4" /></div>}
        />
        <StatCard
          title="Open Tickets"
          value={stats?.open ?? 0}
          change={stats?.openChange ?? 0}
          icon={<div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Hourglass className="h-4 w-4" /></div>}
        />
        <StatCard
          title="Resolved Tickets"
          value={stats?.resolved ?? 0}
          change={stats?.resolvedChange ?? 0}
          icon={<div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 className="h-4 w-4" /></div>}
        />
        <StatCard
          title="SLA Breach Tickets"
          value={stats?.slaBreached ?? 0}
          change={stats?.slaChange ?? 0}
          icon={<div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertTriangle className="h-4 w-4" /></div>}
        />
      </div>

      {/* Row 2 — Charts + Activities */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        {/* Line Chart */}
        <Card className="col-span-2 shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b">
            <CardTitle className="text-sm font-semibold">Tickets Overview</CardTitle>
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </CardHeader>
          <CardContent className="p-3">
            <div className="h-[160px]">
              {formattedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedChartData} margin={{ top: 4, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={4} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '6px', fontSize: '11px' }}
                    />
                    <Line type="monotone" dataKey="Open" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Closed" stroke="#94a3b8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="col-span-1 shadow-sm border-0">
          <CardHeader className="py-2 px-4 border-b">
            <CardTitle className="text-sm font-semibold">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-3">
              {activities?.slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex items-start gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                    {activity.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-tight">
                      <span className="font-medium">{activity.user.name}</span> {activity.action}{' '}
                      <span className="text-primary font-medium">{activity.ticketNumber}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              {!activities?.length && (
                <div className="text-xs text-muted-foreground py-2 text-center">No recent activities</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Tickets Table + Donut + SLA */}
      <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
        {/* Latest Tickets */}
        <Card className="col-span-2 shadow-sm border-0 flex flex-col min-h-0">
          <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b shrink-0">
            <CardTitle className="text-sm font-semibold">Latest Tickets</CardTitle>
            <Link href="/tickets" className="text-xs text-primary hover:underline font-medium">View All</Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-muted-foreground bg-muted/50 uppercase sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-medium">Ticket No</th>
                  <th className="px-3 py-2 font-medium">Customer</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Engineer</th>
                  <th className="px-3 py-2 font-medium">SLA</th>
                  <th className="px-3 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets?.slice(0, 6).map(ticket => (
                  <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-medium text-primary">{ticket.ticketNumber}</td>
                    <td className="px-3 py-2 truncate max-w-[90px]">{ticket.customer.name}</td>
                    <td className="px-3 py-2 truncate max-w-[80px]">{ticket.category.name}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-3 py-2 truncate max-w-[80px]">{ticket.assignedEngineer?.name || '-'}</td>
                    <td className="px-3 py-2">
                      {ticket.slaBreached ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">Breach</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">OK</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/tickets/${ticket.id}`} className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {!tickets?.length && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No tickets found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Right column: Donut + SLA */}
        <div className="col-span-1 flex flex-col gap-3 min-h-0">
          {/* Tickets by Category */}
          <Card className="shadow-sm border-0 flex-1 min-h-0 flex flex-col">
            <CardHeader className="py-2 px-4 border-b shrink-0">
              <CardTitle className="text-sm font-semibold">By Category</CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-1 flex flex-col min-h-0">
              <div className="flex-1 min-h-0" style={{ minHeight: 100 }}>
                {categories && categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="65%"
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {categories.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '6px', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data</div>
                )}
              </div>
              <div className="space-y-1 shrink-0 mt-2">
                {categories?.slice(0, 4).map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate max-w-[100px]">{cat.name}</span>
                    </div>
                    <span className="text-muted-foreground font-mono ml-1">{cat.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SLA Status */}
          <Card className="shadow-sm border-0 shrink-0">
            <CardHeader className="py-2 px-4 border-b">
              <CardTitle className="text-sm font-semibold">SLA Status</CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path
                    stroke="hsl(var(--muted))"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    stroke="#ef4444"
                    strokeWidth="3.5"
                    strokeDasharray={dashArray}
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-red-500">{stats?.slaBreached || 0}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">SLA Breach</p>
                <p className="text-[10px] text-muted-foreground">Total {stats?.total || 0} tickets</p>
                <Link href="/sla-monitoring" className="text-[10px] text-primary hover:underline mt-1 block">View Monitoring</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon }: { title: string, value: number, change: number, icon: React.ReactNode }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <h3 className="text-xl font-bold text-foreground">{value}</h3>
            <span className={`text-[10px] font-medium ${change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-muted-foreground"}`}>
              {change > 0 ? '+' : ''}{change}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Open: "bg-blue-100 text-blue-700",
    In_Progress: "bg-amber-100 text-amber-700",
    Resolved: "bg-emerald-100 text-emerald-700",
    Closed: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${styles[status] || "bg-gray-100 text-gray-700"}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
