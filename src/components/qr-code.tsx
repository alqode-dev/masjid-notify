"use client";

import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Printer } from "lucide-react";

interface QRCodeDisplayProps {
  url: string;
  mosqueName?: string;
  size?: number;
  showActions?: boolean;
}

export function QRCodeDisplay({
  url,
  mosqueName,
  size = 200,
  showActions = false,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${mosqueName?.replace(/\s+/g, "-").toLowerCase() || "mosque"}-qr-code.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [mosqueName]);

  const handlePrint = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const dataUrl = canvas.toDataURL("image/png");

    // Sanitize mosqueName to prevent XSS in the print window
    const safeName = (mosqueName || "Mosque")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${safeName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            img {
              max-width: 400px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 24px;
              color: #333;
              margin-bottom: 10px;
            }
            p {
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>${safeName}</h1>
          <img src="${dataUrl}" alt="QR Code" />
          <p>Scan to subscribe to WhatsApp updates</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }, [mosqueName]);

  return (
    <div className="flex flex-col items-center">
      <div
        ref={canvasRef}
        className="p-4 bg-white rounded-xl shadow-sm"
      >
        <QRCodeCanvas
          value={url}
          size={size}
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#0d9488"
        />
      </div>

      {showActions && (
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      )}
    </div>
  );
}

interface QRCodeCardProps {
  url: string;
  mosqueName: string;
}

export function QRCodeCard({ url, mosqueName }: QRCodeCardProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4 text-center">
        Scan to Subscribe
      </h2>
      <QRCodeDisplay
        url={url}
        mosqueName={mosqueName}
        size={180}
        showActions={true}
      />
      <p className="text-xs text-muted-foreground text-center mt-4">
        Share this QR code to let people subscribe to {mosqueName} updates
      </p>
    </Card>
  );
}

export function QRCodeMini({ url }: { url: string }) {
  return (
    <div className="p-2 bg-white rounded-lg">
      <QRCodeSVG
        value={url}
        size={80}
        level="M"
        bgColor="#ffffff"
        fgColor="#0d9488"
      />
    </div>
  );
}
