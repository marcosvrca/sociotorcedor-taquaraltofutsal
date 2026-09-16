"use client";

import { QRCodeSVG } from "qrcode.react";

export function TicketQr({ value, size = 180 }: { value: string; size?: number }) {
  return (
    <div className="mx-auto inline-block rounded-xl bg-white p-4">
      <QRCodeSVG value={value} size={size} />
    </div>
  );
}
