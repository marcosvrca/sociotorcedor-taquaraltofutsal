"use client";

import { QRCodeSVG } from "qrcode.react";

export function PixQr({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs uppercase tracking-[0.16em] text-tf-muted">QR Code PIX</p>
      <div className="rounded-lg bg-white p-3">
        <QRCodeSVG value={value} size={180} level="M" />
      </div>
      <p className="max-w-xs text-center text-xs text-tf-muted">
        Aponte a câmera do app do banco para pagar o valor desta cobrança.
      </p>
    </div>
  );
}
