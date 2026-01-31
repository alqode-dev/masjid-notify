"use client";

import { useEffect, useState } from "react";
import { createClientSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, PieChartIcon, Users } from "lucide-react";

interface SubscriberGrowthData {
  date: string;
  count: number;
}

interface MessageTypeData {
  name: string;
  value: number;
  color: string;
}

interface StatusBreakdownData {
  name: string;
  value: number;
  color: string;
}

const MESSAGE_TYPE_COLORS: Record<string, string> = {
  prayer: "#0d9488",
  hadith: "#f59e0b",
  announcement: "#8b5cf6",
  ramadan: "#ec4899",
  welcome: "#10b981",
  jumuah: "#3b82f6",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  paused: "#f59e0b",
  unsubscribed: "#ef4444",
};

export function AnalyticsCharts() {
  const [loading, setLoading] = useState(true);
  const [subscriberGrowth, setSubscriberGrowth] = useState<SubscriberGrowthData[]>([]);
  const [messageTypes, setMessageTypes] = useState<MessageTypeData[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdownData[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const supabase = createClientSupabase();

      try {
        // Get mosque
        const { data: mosque } = await supabase
          .from("mosques")
          .select("id")
          .eq("slug", "test-masjid")
          .single();

        if (!mosque) return;

        // Fetch subscriber growth (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: subscribers } = await supabase
          .from("subscribers")
          .select("subscribed_at")
          .eq("mosque_id", mosque.id)
          .gte("subscribed_at", thirtyDaysAgo.toISOString())
          .order("subscribed_at", { ascending: true });

        // Group by date
        const growthMap = new Map<string, number>();
        let cumulativeCount = 0;

        // Get count before 30 days
        const { count: priorCount } = await supabase
          .from("subscribers")
          .select("*", { count: "exact", head: true })
          .eq("mosque_id", mosque.id)
          .lt("subscribed_at", thirtyDaysAgo.toISOString());

        cumulativeCount = priorCount || 0;

        // Generate all dates in range
        const dates: string[] = [];
        for (let i = 0; i < 30; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          dates.push(date.toISOString().split("T")[0]);
        }

        // Count subscribers per date
        const dateCountMap = new Map<string, number>();
        subscribers?.forEach((sub) => {
          const date = new Date(sub.subscribed_at).toISOString().split("T")[0];
          dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
        });

        // Build cumulative data
        const growthData: SubscriberGrowthData[] = dates.map((date) => {
          cumulativeCount += dateCountMap.get(date) || 0;
          return {
            date: new Date(date).toLocaleDateString("en-ZA", {
              month: "short",
              day: "numeric",
            }),
            count: cumulativeCount,
          };
        });

        setSubscriberGrowth(growthData);

        // Fetch message types breakdown - sum sent_to_count for actual messages sent
        const { data: messages } = await supabase
          .from("messages")
          .select("type, sent_to_count")
          .eq("mosque_id", mosque.id);

        const typeCounts = new Map<string, number>();
        messages?.forEach((msg) => {
          const count = msg.sent_to_count || 0;
          typeCounts.set(msg.type, (typeCounts.get(msg.type) || 0) + count);
        });

        const typeData: MessageTypeData[] = Array.from(typeCounts.entries()).map(
          ([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: MESSAGE_TYPE_COLORS[name] || "#6b7280",
          })
        );

        setMessageTypes(typeData);

        // Fetch status breakdown
        const statusCounts: Record<string, number> = {
          active: 0,
          paused: 0,
          unsubscribed: 0,
        };

        const { data: allSubscribers } = await supabase
          .from("subscribers")
          .select("status")
          .eq("mosque_id", mosque.id);

        allSubscribers?.forEach((sub) => {
          statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
        });

        const statusData: StatusBreakdownData[] = Object.entries(statusCounts)
          .filter(([, value]) => value > 0)
          .map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: STATUS_COLORS[name] || "#6b7280",
          }));

        setStatusBreakdown(statusData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscriber Growth Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Subscriber Growth</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Last 30 days</p>
          <div className="h-48">
            {subscriberGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={subscriberGrowth}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={false}
                    name="Subscribers"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No subscriber data yet
              </div>
            )}
          </div>
        </Card>

        {/* Message Types Pie Chart */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Messages by Type</h3>
          </div>
          <div className="h-56">
            {messageTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={messageTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {messageTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                    formatter={(value) => (
                      <span className="text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No messages sent yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Subscriber Status</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {statusBreakdown.length > 0 ? (
            statusBreakdown.map((status) => (
              <div
                key={status.name}
                className="flex items-center justify-between p-4 rounded-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="font-medium text-foreground">{status.name}</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {status.value}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-muted-foreground text-sm py-4">
              No subscribers yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
