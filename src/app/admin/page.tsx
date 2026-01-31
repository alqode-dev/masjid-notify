"use client";

import { useEffect, useState } from "react";
import { createClientSupabase } from "@/lib/supabase";
import { StatsCard } from "@/components/admin/stats-card";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MessageCircle, Bell, TrendingUp } from "lucide-react";

interface DashboardStats {
  totalSubscribers: number;
  activeSubscribers: number;
  totalMessages: number;
  todayMessages: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mosqueName, setMosqueName] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClientSupabase();

      try {
        // Get mosque info
        const { data: mosque } = await supabase
          .from("mosques")
          .select("name")
          .eq("slug", "test-masjid")
          .single();

        if (mosque) {
          setMosqueName(mosque.name);
        }

        // Get subscriber counts
        const { count: totalSubscribers } = await supabase
          .from("subscribers")
          .select("*", { count: "exact", head: true });

        const { count: activeSubscribers } = await supabase
          .from("subscribers")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        // Get message counts - sum sent_to_count for actual messages sent
        const { data: totalMessagesData } = await supabase
          .from("messages")
          .select("sent_to_count");

        const totalMessages = totalMessagesData?.reduce(
          (sum, msg) => sum + (msg.sent_to_count || 0),
          0
        ) || 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: todayMessagesData } = await supabase
          .from("messages")
          .select("sent_to_count")
          .gte("sent_at", today.toISOString());

        const todayMessages = todayMessagesData?.reduce(
          (sum, msg) => sum + (msg.sent_to_count || 0),
          0
        ) || 0;

        setStats({
          totalSubscribers: totalSubscribers || 0,
          activeSubscribers: activeSubscribers || 0,
          totalMessages: totalMessages || 0,
          todayMessages: todayMessages || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{mosqueName}</h1>
        <p className="text-muted-foreground">Dashboard Overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Subscribers"
          value={stats?.totalSubscribers || 0}
          icon={Users}
        />
        <StatsCard
          title="Active Subscribers"
          value={stats?.activeSubscribers || 0}
          subtitle={`${stats?.totalSubscribers ? Math.round((stats.activeSubscribers / stats.totalSubscribers) * 100) : 0}% of total`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Total Messages Sent"
          value={stats?.totalMessages || 0}
          icon={MessageCircle}
        />
        <StatsCard
          title="Messages Today"
          value={stats?.todayMessages || 0}
          icon={Bell}
        />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            href="/admin/announcements"
            icon="📢"
            title="Send Announcement"
            description="Broadcast a message to subscribers"
          />
          <QuickActionCard
            href="/admin/subscribers"
            icon="👥"
            title="View Subscribers"
            description="Manage your subscriber list"
          />
          <QuickActionCard
            href="/admin/settings"
            icon="⚙️"
            title="Settings"
            description="Configure mosque preferences"
          />
        </div>
      </Card>

      {/* Analytics Section */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Analytics
        </h2>
        <AnalyticsCharts />
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors block"
    >
      <span className="text-2xl mb-2 block">{icon}</span>
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </a>
  );
}
