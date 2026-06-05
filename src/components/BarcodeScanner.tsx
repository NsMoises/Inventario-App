"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, ScanLine } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (codigo: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const readerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "barcode-scanner-reader";

  useEffect(() => {
    const reader = new Html5Qrcode(containerId);
    readerRef.current = reader;

    reader.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      (decodedText) => {
        onScan(decodedText);
        reader.stop().catch(() => {});
        onClose();
      },
      () => {}
    ).catch(() => {});

    return () => {
      reader.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <ScanLine className="h-4 w-4 text-primary-600" />
            Escanear código
          </div>
          <button onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div id={containerId} className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-900" />
        <p className="text-xs text-gray-400 text-center mt-2">
          Apunta la cámara al código de barras
        </p>
      </div>
    </div>
  );
}
