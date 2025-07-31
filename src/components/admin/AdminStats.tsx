import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, TrendingUp, Database, Activity, AlertTriangle } from 'lucide-react';

interface AdminStatsProps {
  stats: {
    totalOrgs: number;
    totalUsers: number;
    totalFunds: number;
    activeDeals: number;
    recentActivity: number;
    pendingIssues: number;
  };
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statItems = [
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
      description: 'Investment funds',
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
      title: 'Recent Activity',
      value: stats.recentActivity,
      description: 'Last 24 hours',
      icon: Activity,
      color: 'text-emerald-600'
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statItems.map((item) => (
        <Card key={item.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}