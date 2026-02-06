"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeDisplay } from "@/components/qr-code";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function QRCodePage() {
  const [mosqueName, setMosqueName] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://masjid-notify.vercel.app";

  useEffect(() => {
    const fetchMosque = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setMosqueName(data.mosqueName || "");
        }
      } catch (error) {
        console.error("Error fetching mosque name:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMosque();
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      toast.success("URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL. Please copy it manually.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">QR Code</h1>
        <p className="text-muted-foreground">
          Share your subscription page via QR code
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 text-center">
            Subscribe QR Code
          </h2>
          <QRCodeDisplay
            url={siteUrl}
            mosqueName={mosqueName}
            size={280}
            showActions={true}
          />
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Print this QR code and display it at your mosque entrance, notice boards, or share it on social media. When scanned, it will take people directly to the subscription page.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Share Link
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="url" className="text-sm font-medium">
                Subscription Page URL
              </Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="url"
                  value={siteUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="px-2"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Where to share
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>🕌</span>
                  <span>Mosque entrance & notice boards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>📱</span>
                  <span>WhatsApp groups & status</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>📧</span>
                  <span>Email newsletters</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>🌐</span>
                  <span>Mosque website & social media</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>📄</span>
                  <span>Printed flyers & brochures</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Tips for success
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Print QR code in high resolution for best scanning</li>
                <li>• Include a brief call-to-action near the QR code</li>
                <li>• Test the QR code before printing in bulk</li>
                <li>• Place at eye level for easy scanning</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
