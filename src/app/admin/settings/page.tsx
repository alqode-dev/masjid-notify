"use client";

import { useEffect, useState } from "react";
import { createClientSupabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Mosque } from "@/lib/supabase";
import { toast } from "sonner";
import { Save, Moon, Clock } from "lucide-react";

const CALCULATION_METHODS = [
  { value: "1", label: "University of Islamic Sciences, Karachi" },
  { value: "2", label: "Islamic Society of North America (ISNA)" },
  { value: "3", label: "Muslim World League" },
  { value: "4", label: "Umm Al-Qura University, Makkah" },
  { value: "5", label: "Egyptian General Authority of Survey" },
];

const MADHAB_OPTIONS = [
  { value: "hanafi", label: "Hanafi" },
  { value: "shafii", label: "Shafi'i" },
];

export default function SettingsPage() {
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [ramadanMode, setRamadanMode] = useState(false);
  const [suhoorMins, setSuhoorMins] = useState("30");
  const [iftarMins, setIftarMins] = useState("15");
  const [taraweehTime, setTaraweehTime] = useState("");
  const [jumuahAdhaan, setJumuahAdhaan] = useState("12:45");
  const [jumuahKhutbah, setJumuahKhutbah] = useState("13:00");
  const [calculationMethod, setCalculationMethod] = useState("3");
  const [madhab, setMadhab] = useState("hanafi");

  useEffect(() => {
    const fetchMosque = async () => {
      const supabase = createClientSupabase();
      const { data } = await supabase
        .from("mosques")
        .select("*")
        .eq("slug", "test-masjid")
        .single();

      if (data) {
        const mosqueData = data as Mosque;
        setMosque(mosqueData);
        setRamadanMode(mosqueData.ramadan_mode);
        setSuhoorMins(mosqueData.suhoor_reminder_mins.toString());
        setIftarMins(mosqueData.iftar_reminder_mins.toString());
        setTaraweehTime(mosqueData.taraweeh_time ? mosqueData.taraweeh_time.slice(0, 5) : "");
        setJumuahAdhaan(mosqueData.jumuah_adhaan_time.slice(0, 5));
        setJumuahKhutbah(mosqueData.jumuah_khutbah_time.slice(0, 5));
        setCalculationMethod(mosqueData.calculation_method.toString());
        setMadhab(mosqueData.madhab);
      }
      setLoading(false);
    };

    fetchMosque();
  }, []);

  const handleSave = async () => {
    if (!mosque) return;

    setSaving(true);

    try {
      const supabase = createClientSupabase();
      const { error } = await supabase
        .from("mosques")
        .update({
          ramadan_mode: ramadanMode,
          suhoor_reminder_mins: parseInt(suhoorMins),
          iftar_reminder_mins: parseInt(iftarMins),
          taraweeh_time: taraweehTime ? taraweehTime + ":00" : null,
          jumuah_adhaan_time: jumuahAdhaan + ":00",
          jumuah_khutbah_time: jumuahKhutbah + ":00",
          calculation_method: parseInt(calculationMethod),
          madhab: madhab as "hanafi" | "shafii",
        })
        .eq("id", mosque.id);

      if (error) {
        throw error;
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!mosque) {
    return <div>Mosque not found</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure your mosque preferences
        </p>
      </div>

      {/* Prayer Time Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Prayer Time Settings
          </h2>
        </div>

        <div className="space-y-4">
          <Select
            label="Calculation Method"
            value={calculationMethod}
            onChange={(e) => setCalculationMethod(e.target.value)}
            options={CALCULATION_METHODS}
          />

          <Select
            label="Madhab (for Asr)"
            value={madhab}
            onChange={(e) => setMadhab(e.target.value)}
            options={MADHAB_OPTIONS}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jumu'ah Adhaan"
              type="time"
              value={jumuahAdhaan}
              onChange={(e) => setJumuahAdhaan(e.target.value)}
            />
            <Input
              label="Jumu'ah Khutbah"
              type="time"
              value={jumuahKhutbah}
              onChange={(e) => setJumuahKhutbah(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Ramadan Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Moon className="w-5 h-5 text-secondary" />
          <h2 className="text-lg font-semibold text-foreground">
            Ramadan Settings
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Ramadan Mode</p>
              <p className="text-sm text-muted-foreground">
                Enable Suhoor and Iftar reminders
              </p>
            </div>
            <Switch
              checked={ramadanMode}
              onCheckedChange={setRamadanMode}
            />
          </div>

          {ramadanMode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Suhoor reminder (mins before Fajr)"
                  type="number"
                  min="10"
                  max="60"
                  value={suhoorMins}
                  onChange={(e) => setSuhoorMins(e.target.value)}
                />
                <Input
                  label="Iftar reminder (mins before Maghrib)"
                  type="number"
                  min="5"
                  max="30"
                  value={iftarMins}
                  onChange={(e) => setIftarMins(e.target.value)}
                />
              </div>
              <Input
                label="Taraweeh Time (optional)"
                type="time"
                value={taraweehTime}
                onChange={(e) => setTaraweehTime(e.target.value)}
                placeholder="Leave empty to disable Taraweeh reminders"
              />
              <p className="text-xs text-muted-foreground">
                Set the Taraweeh start time to send reminders 30 minutes before. Leave empty to disable Taraweeh reminders.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
