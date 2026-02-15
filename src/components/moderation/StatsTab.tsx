import { useState, useEffect } from "react";
import { Users, Ban, AlertTriangle, Star, TrendingUp, Shield, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StatsData {
  totalUsers: number;
  totalBans: number;
  activeBans: number;
  totalWarnings: number;
  totalVips: number;
  totalAdmins: number;
  totalTrialAdmins: number;
  recentActions: number;
}

interface UserData {
  isBanned: boolean;
  warningsCount: number;
  isVip?: boolean;
  role?: string;
}

export const StatsTab = ({ users }: { users: UserData[] }) => {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalBans: 0,
    activeBans: 0,
    totalWarnings: 0,
    totalVips: 0,
    totalAdmins: 0,
    totalTrialAdmins: 0,
    recentActions: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateStats = async () => {
      try {
        // Calculate from users array
        const totalUsers = users.length;
        const activeBans = users.filter(u => u.isBanned).length;
        const totalWarnings = users.reduce((acc, u) => acc + u.warningsCount, 0);
        const totalVips = users.filter(u => u.isVip).length;
        const totalAdmins = users.filter(u => u.role === 'admin').length;
        const totalTrialAdmins = users.filter(u => u.role === 'trial_admin').length;

        // Fetch recent moderation actions count
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: recentActions } = await (supabase as any)
          .from('moderation_actions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo);

        // Fetch total bans ever
        const { count: totalBans } = await (supabase as any)
          .from('moderation_actions')
          .select('*', { count: 'exact', head: true })
          .in('action_type', ['ban', 'temp_ban', 'perm_ban']);

        setStats({
          totalUsers,
          totalBans: totalBans || 0,
          activeBans,
          totalWarnings,
          totalVips,
          totalAdmins,
          totalTrialAdmins,
          recentActions: recentActions || 0
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateStats();
  }, [users]);

  const statCards = [
    { 
      label: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'cyan',
      bgClass: 'bg-cyan-500/10 border-cyan-500/30',
      textClass: 'text-cyan-400'
    },
    { 
      label: 'Active Bans', 
      value: stats.activeBans, 
      icon: Ban, 
      color: 'red',
      bgClass: 'bg-red-500/10 border-red-500/30',
      textClass: 'text-red-400'
    },
    { 
      label: 'Total Warnings', 
      value: stats.totalWarnings, 
      icon: AlertTriangle, 
      color: 'amber',
      bgClass: 'bg-amber-500/10 border-amber-500/30',
      textClass: 'text-amber-400'
    },
    { 
      label: 'VIP Users', 
      value: stats.totalVips, 
      icon: Star, 
      color: 'purple',
      bgClass: 'bg-purple-500/10 border-purple-500/30',
      textClass: 'text-purple-400'
    },
    { 
      label: 'Admins', 
      value: stats.totalAdmins, 
      icon: Shield, 
      color: 'green',
      bgClass: 'bg-green-500/10 border-green-500/30',
      textClass: 'text-green-400'
    },
    { 
      label: 'Trial Admins', 
      value: stats.totalTrialAdmins, 
      icon: Shield, 
      color: 'orange',
      bgClass: 'bg-orange-500/10 border-orange-500/30',
      textClass: 'text-orange-400'
    },
    { 
      label: 'Actions (7d)', 
      value: stats.recentActions, 
      icon: TrendingUp, 
      color: 'blue',
      bgClass: 'bg-blue-500/10 border-blue-500/30',
      textClass: 'text-blue-400'
    },
  ];

  // Calculate percentages for the pie chart
  const userDistribution = [
    { label: 'Regular', count: stats.totalUsers - stats.activeBans - stats.totalVips - stats.totalAdmins, color: 'bg-slate-500' },
    { label: 'VIP', count: stats.totalVips, color: 'bg-purple-500' },
    { label: 'Admin', count: stats.totalAdmins, color: 'bg-green-500' },
    { label: 'Banned', count: stats.activeBans, color: 'bg-red-500' },
  ].filter(d => d.count > 0);

  const total = userDistribution.reduce((acc, d) => acc + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Statistics Dashboard</h3>
          <p className="text-xs text-muted-foreground">Overview of moderation activity and user stats</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className={`p-4 rounded-lg border ${stat.bgClass}`}>
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.textClass}`} />
              <span className={`text-xs ${stat.textClass} font-mono uppercase`}>{stat.label}</span>
            </div>
            <div className={`text-3xl font-bold ${stat.textClass}`}>
              {isLoading ? '...' : stat.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* User Distribution */}
      <div className="p-6 rounded-lg bg-slate-900/50 border border-slate-800">
        <h4 className="font-bold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          User Distribution
        </h4>
        
        {/* Simple bar chart */}
        <div className="space-y-3">
          {userDistribution.map((dist, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{dist.label}</span>
                <span className="font-mono text-slate-300">
                  {dist.count} ({total > 0 ? ((dist.count / total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${dist.color} rounded-full transition-all duration-500`}
                  style={{ width: total > 0 ? `${(dist.count / total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Facts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="text-sm text-slate-400 mb-1">Ban Rate</div>
          <div className="text-2xl font-bold text-red-400">
            {stats.totalUsers > 0 
              ? ((stats.activeBans / stats.totalUsers) * 100).toFixed(1)
              : 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">of total users</div>
        </div>
        
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="text-sm text-slate-400 mb-1">Avg Warnings</div>
          <div className="text-2xl font-bold text-amber-400">
            {stats.totalUsers > 0 
              ? (stats.totalWarnings / stats.totalUsers).toFixed(2)
              : 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">per user</div>
        </div>
      </div>

      {/* Total Bans Info */}
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
        <div className="flex items-center gap-3">
          <Ban className="w-5 h-5 text-red-400" />
          <div>
            <div className="font-bold text-red-400">Total Bans Issued</div>
            <div className="text-sm text-slate-400">
              {stats.totalBans} bans issued all-time, {stats.activeBans} currently active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
