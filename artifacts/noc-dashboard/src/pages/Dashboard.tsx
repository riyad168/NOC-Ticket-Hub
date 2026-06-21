import React from "react";
import { 
  useGetDashboardStats, 
  useGetDashboardChart, 
  useGetDashboardCategories, 
  useGetRecentActivity,
  useListTickets
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Grid, 
  Hourglass, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  Eye
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { data: stats } = useGetDashboardStats();
  const { data: chartData } = useGetDashboardChart();
  const { data: categories } = useGetDashboardCategories();
  const { data: activities } = useGetRecentActivity();
  const { data: tickets } = useListTickets();

  const formattedChartData = chartData?.days.map((day, i) => ({
    name: format(new Date(day), 'MMM dd'),
    Open: chartData.openCounts[i],
    Resolved: chartData.resolvedCounts[i],
    Closed: chartData.closedCounts[i]
  })) || [];

  return (
    <div className="space-y-6">
      {/* Row 1 - Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Tickets" 
          value={stats?.total ?? 0} 
          change={stats?.totalChange ?? 0} 
          icon={<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Grid className="h-5 w-5" /></div>} 
        />
        <StatCard 
          title="Open Tickets" 
          value={stats?.open ?? 0} 
          change={stats?.openChange ?? 0} 
          icon={<div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Hourglass className="h-5 w-5" /></div>} 
        />
        <StatCard 
          title="Resolved Tickets" 
          value={stats?.resolved ?? 0} 
          change={stats?.resolvedChange ?? 0} 
          icon={<div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>} 
        />
        <StatCard 
          title="SLA Breach Tickets" 
          value={stats?.slaBreached ?? 0} 
          change={stats?.slaChange ?? 0} 
          icon={<div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertTriangle className="h-5 w-5" /></div>} 
        />
      </div>

      {/* Row 2 - Charts & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1 lg:col-span-2 shadow-sm border-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b mb-4">
              <CardTitle className="text-base font-semibold">Tickets Overview</CardTitle>
              <Button variant="outline" size="sm" className="h-8">
                This Month <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                {formattedChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Line type="monotone" dataKey="Open" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="Closed" stroke="#94a3b8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="col-span-1 lg:col-span-1 shadow-sm border-0">
          <CardHeader className="pb-2 border-b mb-4">
            <CardTitle className="text-base font-semibold">Tickets by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[200px] w-full mb-4">
              {categories && categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </div>
            <div className="w-full space-y-2">
              {categories?.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground font-medium">{cat.name}</span>
                  </div>
                  <span className="text-muted-foreground font-mono">{cat.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 - Latest Tickets & SLA / Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-0 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b mb-4">
              <CardTitle className="text-base font-semibold">Latest Tickets</CardTitle>
              <Link href="/tickets" className="text-sm text-primary hover:underline font-medium">View All</Link>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Ticket No</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Assigned Engineer</th>
                      <th className="px-4 py-3 font-medium">Start Time</th>
                      <th className="px-4 py-3 font-medium">SLA</th>
                      <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tickets?.slice(0, 5).map(ticket => (
                      <tr key={ticket.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-primary">{ticket.ticketNumber}</td>
                        <td className="px-4 py-3">{ticket.customer.name}</td>
                        <td className="px-4 py-3">{ticket.category.name}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-4 py-3">{ticket.assignedEngineer?.name || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm')}</td>
                        <td className="px-4 py-3">
                          {ticket.slaBreached ? (
                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">SLA Breach</span>
                          ) : (
                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700">Within SLA</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/tickets/${ticket.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {!tickets?.length && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No tickets found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-2 border-b mb-4">
              <CardTitle className="text-base font-semibold">SLA Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path
                    className="text-muted stroke-current"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {stats && stats.total > 0 && stats.slaBreached > 0 && (
                    <path
                      className="text-red-500 stroke-current"
                      strokeWidth="3"
                      strokeDasharray={`${(stats.slaBreached / stats.total) * 100}, 100`}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold text-red-500">{stats?.slaBreached || 0}</span>
                </div>
              </div>
              <div className="text-center space-y-1 mb-6">
                <h3 className="font-semibold text-foreground text-lg">SLA Breach Tickets</h3>
                <p className="text-sm text-muted-foreground">Total {stats?.total || 0} Tickets</p>
              </div>
              <Button asChild className="w-full" variant="outline">
                <Link href="/sla-monitoring">View SLA Monitoring</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 flex-1">
            <CardHeader className="pb-2 border-b mb-4">
              <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities?.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      {activity.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.user.name}</span> {activity.action} <span className="font-medium text-primary">{activity.ticketNumber}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                {!activities?.length && (
                  <div className="text-sm text-muted-foreground py-4 text-center">No recent activities</div>
                )}
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
      <CardContent className="p-6 flex items-center gap-4">
        {icon}
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-foreground">{value}</h3>
            <span className={`text-xs font-medium ${change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-muted-foreground"}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Open: "bg-blue-100 text-blue-700",
    In_Progress: "bg-amber-100 text-amber-700",
    Resolved: "bg-emerald-100 text-emerald-700",
    Closed: "bg-gray-100 text-gray-700",
  };
  
  const formattedStatus = status.replace('_', ' ');
  const style = styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700";

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style}`}>
      {formattedStatus}
    </span>
  );
}
