"use client";

import { useEffect, useState } from "react";
import { SubscribersTable } from "@/components/admin/subscribers-table";
import { SubscriberImport } from "@/components/admin/subscriber-import";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Subscriber, Mosque } from "@/lib/supabase";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "unsubscribed", label: "Unsubscribed" },
];

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchSubscribers = async () => {
    try {
      const response = await fetch(`/api/admin/subscribers?status=${statusFilter}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch subscribers");
      }

      const data = await response.json();
      setSubscribers(data.subscribers || []);
      if (data.mosque) {
        setMosque(data.mosque);
      }
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, status: Subscriber["status"]) => {
    try {
      const response = await fetch("/api/admin/subscribers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(`Status updated to ${status}`);
      fetchSubscribers();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;

    try {
      const response = await fetch(`/api/admin/subscribers?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete subscriber");
      }

      toast.success("Subscriber deleted");
      fetchSubscribers();
    } catch (error) {
      toast.error("Failed to delete subscriber");
    }
  };

  const handleExport = () => {
    const csv = [
      ["Phone Number", "Status", "Subscribed At", "Daily Prayers", "Jumuah", "Ramadan", "Hadith", "Announcements"],
      ...subscribers.map((s) => [
        s.phone_number,
        s.status,
        new Date(s.subscribed_at).toLocaleDateString(),
        s.pref_daily_prayers ? "Yes" : "No",
        s.pref_jumuah ? "Yes" : "No",
        s.pref_ramadan ? "Yes" : "No",
        s.pref_hadith ? "Yes" : "No",
        s.pref_announcements ? "Yes" : "No",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filteredSubscribers = subscribers.filter((s) =>
    s.phone_number.includes(searchQuery.replace(/[\s\-+]/g, ""))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscribers</h1>
          <p className="text-muted-foreground">
            {filteredSubscribers.length} subscriber
            {filteredSubscribers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {mosque && (
            <SubscriberImport
              mosqueId={mosque.id}
              onImportComplete={fetchSubscribers}
            />
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
          className="w-full sm:w-48"
        />
      </div>

      <SubscribersTable
        subscribers={filteredSubscribers}
        loading={loading}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
