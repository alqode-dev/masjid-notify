"use client";

import { useEffect, useState } from "react";
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

export function AnalyticsCharts() {
  const [loading, setLoading] = useState(true);
  const [subscriberGrowth, setSubscriberGrowth] = useState<SubscriberGrowthData[]>([]);
  const [messageTypes, setMessageTypes] = useState<MessageTypeData[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdownData[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/admin/analytics");
        if (!response.ok) throw new Error("Failed to fetch analytics");
        const data = await response.json();

        setSubscriberGrowth(data.subscriberGrowth || []);
        setMessageTypes(data.messageTypes || []);
        setStatusBreakdown(data.statusBreakdown || []);
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
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
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
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
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
