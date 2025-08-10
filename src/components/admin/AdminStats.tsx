import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, TrendingUp, Database, Activity, AlertTriangle, Shield, DollarSign } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    totalOrgs: number;
    totalUsers: number;
    totalFunds: number;
    activeDeals: number;
    recentActivity: number;
    pendingIssues: number;
    systemStatus?: 'healthy' | 'degraded' | 'critical';
    dailyCost?: number;
    activeAgents?: number;
    totalAgents?: number;
  };
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statItems = [
    {
      title: 'System Status',
      value: stats.systemStatus === 'healthy' ? '✓ Healthy' : stats.systemStatus === 'degraded' ? '⚠ Degraded' : '❌ Critical',
      description: 'Overall system health',
      icon: Shield,
      color: stats.systemStatus === 'healthy' ? 'text-green-600' : stats.systemStatus === 'degraded' ? 'text-yellow-600' : 'text-red-600'
    },
    {
      title: 'Organizations',
      value: stats.totalOrgs,
      description: 'Total organizations',
      icon: Building2,
      color: 'text-blue-600'
    },
    {
      title: 'Users',
      value: stats.totalUsers,
      description: 'Platform users',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Funds',
      value: stats.totalFunds,
      description: 'Total investment funds',
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      title: 'Active Deals',
      value: stats.activeDeals,
      description: 'Deals in pipeline',
      icon: Database,
      color: 'text-orange-600'
    },
    {
      title: 'Daily Cost',
      value: stats.dailyCost ? `$${stats.dailyCost.toFixed(2)}` : '$0.00',
      description: 'AI analysis costs',
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      title: 'AI Agents',
      value: `${stats.activeAgents || 0}/${stats.totalAgents || 0}`,
      description: 'Active agents',
      icon: Activity,
      color: (stats.activeAgents || 0) === (stats.totalAgents || 0) ? 'text-green-600' : 'text-yellow-600'
    },
    {
      title: 'Pending Issues',
      value: stats.pendingIssues,
      description: 'Requires attention',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
      {statItems.map((item) => (
        <Card key={item.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}