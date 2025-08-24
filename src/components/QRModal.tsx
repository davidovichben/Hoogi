import React from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import QRCode from "react-qr-code";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  title?: string;
}

export function QRModal({ isOpen, onClose, value, title = "QR Code" }: QRModalProps) {
  if (!isOpen) return null;

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-svg") as SVGElement;
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 400;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 400, 400);

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = "qr.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-lg">
            <QRCode
              id="qr-svg"
              value={value}
              size={192}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleDownloadQR} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            הורד כ-PNG
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            סגור
          </Button>
        </div>
      </div>
    </div>
  );
}
