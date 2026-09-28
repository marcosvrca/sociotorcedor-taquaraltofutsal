"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PixQr } from "@/components/pix-qr";

export function OrderPaymentPanel({
  orderId,
  code,
  pixKey,
  pixPayload,
  amountLabel,
}: {
  orderId: string;
  code: string;
  pixKey: string | null;
  pixPayload: string | null;
  amountLabel: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/orders/${orderId}/mark-paid`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erro ao enviar comprovante.");
      return;
    }
    setMessage("Comprovante enviado. Aguarde a confirmação do clube.");
    router.refresh();
  }

  async function cancel() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Não foi possível cancelar.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="panel space-y-5 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-tf-muted">Pagamento PIX</p>
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
          <textarea readOnly className="field min-h-24 font-mono text-xs" value={pixPayload} />
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
      </form>
      <button type="button" className="text-sm text-tf-muted underline" disabled={loading} onClick={cancel}>
        Cancelar pedido
      </button>
      {message && <p className="text-sm text-green-400">{message}</p>}
      {error && <p className="text-sm text-tf-red">{error}</p>}
    </div>
  );
}
