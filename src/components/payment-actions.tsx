"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const MP_FALLBACK =
  "Infelizmente estamos com problemas com esta forma de pagamento, por favor faça o pagamento via pix";

export function PaymentActions({
  paymentId,
  mode,
  hasOpenPayment,
  checkoutUrl,
}: {
  paymentId?: string;
  mode?: "markPaid" | "create";
  hasOpenPayment?: boolean;
  checkoutUrl?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [receiptName, setReceiptName] = useState("");

  async function markPaid(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!paymentId) return;
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/member/payments/${paymentId}/mark-paid`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erro ao atualizar.");
      return;
    }
    router.refresh();
  }

  async function createCharge(method: "PIX" | "CARD") {
    setLoading(true);
    setError("");
    setInfo("");
    const res = await fetch("/api/member/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || MP_FALLBACK);
      return;
    }

    if (method === "CARD" && data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    router.refresh();
  }

  if (mode === "markPaid") {
    return (
      <form onSubmit={markPaid} className="mt-3 space-y-3">
        <div>
          <label className="label" htmlFor={`receipt-${paymentId}`}>
            Comprovante do PIX *
          </label>
          <input
            id={`receipt-${paymentId}`}
            name="receipt"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            className="field file:mr-3 file:rounded file:border-0 file:bg-tf-blue file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
            onChange={(e) =>
              setReceiptName(e.target.files?.[0]?.name || "")
            }
          />
          <p className="mt-1 text-xs text-tf-muted">
            JPG, PNG, WEBP ou PDF · máx. 5 MB
            {receiptName ? ` · ${receiptName}` : ""}
          </p>
        </div>
        <button
          type="submit"
          className="btn btn-primary !py-2"
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar comprovante e marcar como pago"}
        </button>
        {error && <p className="text-sm text-tf-red">{error}</p>}
      </form>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {checkoutUrl && (
        <a href={checkoutUrl} className="btn btn-primary !py-2 inline-flex">
          Continuar pagamento no Mercado Pago
        </a>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-blue !py-2"
          disabled={loading || hasOpenPayment}
          onClick={() => createCharge("PIX")}
        >
          {loading ? "Gerando..." : "Gerar cobrança PIX"}
        </button>
        <button
          type="button"
          className="btn btn-primary !py-2"
          disabled={loading || hasOpenPayment}
          onClick={() => createCharge("CARD")}
        >
          Pagar com cartão
        </button>
      </div>
      {hasOpenPayment && (
        <p className="text-xs text-tf-muted">
          Há uma cobrança em aberto. Conclua ou aguarde a confirmação antes de
          gerar outra.
        </p>
      )}
      {error && (
        <p className="rounded-md border border-tf-red/40 bg-tf-red/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {info && <p className="text-sm text-green-400">{info}</p>}
    </div>
  );
}
