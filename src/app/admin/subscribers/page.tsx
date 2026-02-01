"use client";

import { useEffect, useState } from "react";
import { createClientSupabase } from "@/lib/supabase";
import { SubscribersTable } from "@/components/admin/subscribers-table";
import { SubscriberImport } from "@/components/admin/subscriber-import";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Subscriber, Mosque } from "@/lib/supabase";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DEFAULT_MOSQUE_SLUG } from "@/lib/constants";

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
    const supabase = createClientSupabase();

    // Get mosque first
    let currentMosque = mosque;
    if (!currentMosque) {
      const { data: mosqueData } = await supabase
        .from("mosques")
        .select("*")
        .eq("slug", DEFAULT_MOSQUE_SLUG)
        .single();

      if (mosqueData) {
        currentMosque = mosqueData as Mosque;
        setMosque(currentMosque);
      }
    }

    if (!currentMosque) {
      console.error("Mosque not found for slug:", DEFAULT_MOSQUE_SLUG);
      setLoading(false);
      return;
    }

    // Filter subscribers by mosque_id
    let query = supabase
      .from("subscribers")
      .select("*")
      .eq("mosque_id", currentMosque.id)
      .order("subscribed_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Failed to load subscribers");
    } else {
      setSubscribers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscribers();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, status: Subscriber["status"]) => {
    const supabase = createClientSupabase();
    const { error } = await supabase
      .from("subscribers")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status updated to ${status}`);
      fetchSubscribers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;

    const supabase = createClientSupabase();
    const { error } = await supabase.from("subscribers").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete subscriber");
    } else {
      toast.success("Subscriber deleted");
      fetchSubscribers();
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
