"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Mosque } from "@/lib/supabase";
import { toast } from "sonner";
import { Save, Moon, Clock, Star } from "lucide-react";

const CALCULATION_METHODS = [
  { value: "1", label: "University of Islamic Sciences, Karachi" },
  { value: "2", label: "Islamic Society of North America (ISNA)" },
  { value: "3", label: "Muslim World League" },
  { value: "4", label: "Umm Al-Qura University, Makkah" },
  { value: "5", label: "Egyptian General Authority of Survey" },
  { value: "99", label: "Custom / Masjid Times" },
];

const EID_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "eid_ul_fitr", label: "Eid ul-Fitr" },
  { value: "eid_ul_adha", label: "Eid ul-Adha" },
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
  const [eidMode, setEidMode] = useState("off");
  const [eidKhutbahTime, setEidKhutbahTime] = useState("");
  const [eidSalahTime, setEidSalahTime] = useState("");
  const [customFajr, setCustomFajr] = useState("");
  const [customSunrise, setCustomSunrise] = useState("");
  const [customDhuhr, setCustomDhuhr] = useState("");
  const [customAsr, setCustomAsr] = useState("");
  const [customMaghrib, setCustomMaghrib] = useState("");
  const [customIsha, setCustomIsha] = useState("");

  useEffect(() => {
    const fetchMosque = async () => {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) {
          console.error("Error fetching settings");
          setLoading(false);
          return;
        }

        const data = await response.json();
        const mosqueData = data.mosque as Mosque;
        setMosque(mosqueData);
        setRamadanMode(mosqueData.ramadan_mode ?? false);
        setSuhoorMins((mosqueData.suhoor_reminder_mins ?? 30).toString());
        setIftarMins((mosqueData.iftar_reminder_mins ?? 15).toString());
        setTaraweehTime(mosqueData.taraweeh_time ? mosqueData.taraweeh_time.slice(0, 5) : "");
        setJumuahAdhaan(mosqueData.jumuah_adhaan_time ? mosqueData.jumuah_adhaan_time.slice(0, 5) : "12:45");
        setJumuahKhutbah(mosqueData.jumuah_khutbah_time ? mosqueData.jumuah_khutbah_time.slice(0, 5) : "13:00");
        setCalculationMethod((mosqueData.calculation_method ?? 3).toString());
        setMadhab(mosqueData.madhab ?? "hanafi");
        setEidMode(mosqueData.eid_mode ?? "off");
        setEidKhutbahTime(mosqueData.eid_khutbah_time ? mosqueData.eid_khutbah_time.slice(0, 5) : "");
        setEidSalahTime(mosqueData.eid_salah_time ? mosqueData.eid_salah_time.slice(0, 5) : "");
        if (mosqueData.custom_prayer_times) {
          const cpt = mosqueData.custom_prayer_times;
          setCustomFajr(cpt.fajr || "");
          setCustomSunrise(cpt.sunrise || "");
          setCustomDhuhr(cpt.dhuhr || "");
          setCustomAsr(cpt.asr || "");
          setCustomMaghrib(cpt.maghrib || "");
          setCustomIsha(cpt.isha || "");
        }
      } catch (error) {
        console.error("Error in fetchMosque:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMosque();
  }, []);

  const handleSave = async () => {
    if (!mosque) return;

    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ramadan_mode: ramadanMode,
          suhoor_reminder_mins: parseInt(suhoorMins, 10) || 30,
          iftar_reminder_mins: parseInt(iftarMins, 10) || 15,
          taraweeh_time: taraweehTime ? taraweehTime + ":00" : null,
          jumuah_adhaan_time: jumuahAdhaan + ":00",
          jumuah_khutbah_time: jumuahKhutbah + ":00",
          calculation_method: parseInt(calculationMethod, 10) || 3,
          madhab: madhab as "hanafi" | "shafii",
          eid_mode: eidMode,
          eid_khutbah_time: eidKhutbahTime ? eidKhutbahTime + ":00" : null,
          eid_salah_time: eidSalahTime ? eidSalahTime + ":00" : null,
          custom_prayer_times: calculationMethod === "99" ? {
            fajr: customFajr,
            sunrise: customSunrise,
            dhuhr: customDhuhr,
            asr: customAsr,
            maghrib: customMaghrib,
            isha: customIsha,
          } : null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      if (data.warning) {
        toast.warning(data.warning);
      } else {
        toast.success("Settings saved successfully");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
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
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-lg font-semibold text-foreground mb-2">Unable to load settings</h2>
          <p className="text-muted-foreground text-sm">Could not connect to the server. Please refresh the page or try again later.</p>
        </Card>
      </div>
    );
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

          {calculationMethod === "99" && (
            <div className="space-y-3 p-4 rounded-xl bg-muted/50">
              <p className="text-sm font-medium text-foreground">Custom Prayer Times (24h format)</p>
              <p className="text-xs text-muted-foreground">
                Enter the times your mosque committee has agreed on for this month
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input label="Fajr" type="time" value={customFajr} onChange={(e) => setCustomFajr(e.target.value)} />
                <Input label="Sunrise" type="time" value={customSunrise} onChange={(e) => setCustomSunrise(e.target.value)} />
                <Input label="Dhuhr" type="time" value={customDhuhr} onChange={(e) => setCustomDhuhr(e.target.value)} />
                <Input label="Asr" type="time" value={customAsr} onChange={(e) => setCustomAsr(e.target.value)} />
                <Input label="Maghrib" type="time" value={customMaghrib} onChange={(e) => setCustomMaghrib(e.target.value)} />
                <Input label="Isha" type="time" value={customIsha} onChange={(e) => setCustomIsha(e.target.value)} />
              </div>
            </div>
          )}

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
              id="ramadan-mode"
              checked={ramadanMode}
              onCheckedChange={(checked) => {
                setRamadanMode(checked);
                if (checked) setEidMode("off");
              }}
              aria-label="Ramadan Mode"
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

      {/* Eid Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Eid Settings
          </h2>
        </div>

        <div className="space-y-4">
          <Select
            label="Eid Mode"
            value={eidMode}
            onChange={(e) => {
              const val = e.target.value;
              setEidMode(val);
              if (val !== "off") setRamadanMode(false);
            }}
            options={EID_OPTIONS}
          />

          {eidMode !== "off" && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Eid Khutbah Time"
                type="time"
                value={eidKhutbahTime}
                onChange={(e) => setEidKhutbahTime(e.target.value)}
              />
              <Input
                label="Eid Salah Time"
                type="time"
                value={eidSalahTime}
                onChange={(e) => setEidSalahTime(e.target.value)}
              />
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
