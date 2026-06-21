import React from "react";
import { 
  useGetDashboardStats, 
  useGetDashboardChart, 
  useGetDashboardCategories, 
  useGetRecentActivity 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, Activity, Ticket as TicketIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { format } from "date-fns";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { data: stats } = useGetDashboardStats();
  const { data: chartData } = useGetDashboardChart();
  const { data: categories } = useGetDashboardCategories();
  const { data: activities } = useGetRecentActivity();

  const formattedChartData = chartData?.days.map((day, i) => ({
    name: format(new Date(day), 'MMM dd'),
    Open: chartData.openCounts[i],
    Resolved: chartData.resolvedCounts[i],
    Closed: chartData.closedCounts[i]
  })) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
        <p className="text-muted-foreground mt-1">Real-time overview of network operations and ticket volume.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Active Tickets" 
          value={stats?.open ?? 0} 
          change={stats?.openChange ?? 0} 
          icon={<AlertCircle className="h-5 w-5 text-chart-3" />} 
        />
        <StatCard 
          title="Resolved Today" 
          value={stats?.resolved ?? 0} 
          change={stats?.resolvedChange ?? 0} 
          icon={<CheckCircle2 className="h-5 w-5 text-chart-4" />} 
        />
        <StatCard 
          title="SLA Breached" 
          value={stats?.slaBreached ?? 0} 
          change={stats?.slaChange ?? 0} 
          icon={<Clock className="h-5 w-5 text-destructive" />} 
          critical={!!stats?.slaBreached && stats.slaBreached > 0}
        />
        <StatCard 
          title="Total Volume" 
          value={stats?.total ?? 0} 
          change={stats?.totalChange ?? 0} 
          icon={<TicketIcon className="h-5 w-5 text-muted-foreground" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="col-span-1 lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle>Ticket Volume (30 Days)</CardTitle>
            <CardDescription>Daily breakdown of open, resolved, and closed tickets.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {formattedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="Open" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Resolved" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Closed" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Loading chart data...</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categories Donut */}
        <Card className="col-span-1 border-border bg-card">
          <CardHeader>
            <CardTitle>Issues by Category</CardTitle>
            <CardDescription>Distribution of active tickets.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {categories ? (
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
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Legend iconType="circle" layout="vertical" verticalAlign="bottom" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Loading categories...</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Operations Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities?.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="mt-0.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    <span className="text-primary font-mono mr-2">{activity.ticketNumber}</span>
                    {activity.action}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.user.name} • {activity.description}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                  {format(new Date(activity.createdAt), 'HH:mm:ss')}
                </div>
              </div>
            ))}
            {!activities?.length && (
              <div className="text-sm text-muted-foreground py-4 text-center">No recent activity detected.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, change, icon, critical }: { title: string, value: number, change: number, icon: React.ReactNode, critical?: boolean }) {
  return (
    <Card className={`border-border bg-card ${critical ? 'border-destructive shadow-[0_0_15px_rgba(255,0,0,0.15)]' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${critical ? 'text-destructive' : 'text-foreground'}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          <span className={change > 0 ? "text-chart-3" : change < 0 ? "text-chart-4" : ""}>
            {change > 0 ? '+' : ''}{change}
          </span>{" "}
          since yesterday
        </p>
      </CardContent>
    </Card>
  );
}
