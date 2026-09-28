"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { PixQr } from "@/components/pix-qr";

export function TicketPaymentPanel({
  ticketId,
  code,
  pixKey,
  pixPayload,
  amountLabel,
  verifyUrl,
}: {
  ticketId: string;
  code: string;
  pixKey: string | null;
  pixPayload: string | null;
  amountLabel: string;
  verifyUrl: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/tickets/${ticketId}/mark-paid`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Erro ao enviar comprovante.");
      return;
    }
    setMessage("Comprovante enviado. Aguarde a confirmação do clube.");
    router.refresh();
  }

  return (
    <div className="panel space-y-5 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-tf-muted">
          Pagamento PIX
        </p>
        <h2 className="mt-1 font-display text-2xl text-white">{amountLabel}</h2>
        <p className="mt-1 font-mono text-sm text-tf-muted">{code}</p>
      </div>

      {pixPayload && <PixQr value={pixPayload} />}
      {pixKey && (
        <div>
          <p className="label">Chave PIX</p>
          <p className="break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white">
            {pixKey}
          </p>
        </div>
      )}
      {pixPayload && (
        <div>
          <p className="label">PIX copia e cola</p>
          <textarea
            readOnly
            className="field min-h-24 font-mono text-xs"
            value={pixPayload}
          />
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="label">Comprovante</label>
          <input
            type="file"
            name="receipt"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="field !py-2"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Enviando..." : "Já paguei — enviar comprovante"}
        </button>
        {message && <p className="text-sm text-green-400">{message}</p>}
      </form>

      <div className="border-t border-white/10 pt-4 text-center">
        <p className="mb-3 text-xs text-tf-muted">
          Após a confirmação, o QR abaixo valida o ingresso na entrada.
        </p>
        <div className="mx-auto inline-block rounded-lg bg-white p-3">
          <QRCodeSVG value={verifyUrl} size={140} />
        </div>
      </div>
    </div>
  );
}
