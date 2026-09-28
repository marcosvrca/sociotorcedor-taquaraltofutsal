"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminOrderActions({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function act(action: "confirm" | "reject" | "fulfill" | "cancel") {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Não foi possível atualizar.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {(status === "PENDING" || status === "AWAITING_CONFIRMATION") && (
          <button type="button" className="btn btn-primary !py-2" disabled={loading} onClick={() => act("confirm")}>
            Confirmar pagamento
          </button>
        )}
        {status === "PAID" && (
          <button type="button" className="btn btn-primary !py-2" disabled={loading} onClick={() => act("fulfill")}>
            Marcar entregue
          </button>
        )}
        {status !== "FULFILLED" && status !== "CANCELLED" && status !== "REJECTED" && (
          <>
            <button type="button" className="btn btn-secondary !py-2" disabled={loading} onClick={() => act("reject")}>
              Recusar
            </button>
            <button type="button" className="text-sm text-tf-muted underline" disabled={loading} onClick={() => act("cancel")}>
              Cancelar
            </button>
          </>
        )}
      </div>
      {error && <p className="text-sm text-tf-red">{error}</p>}
    </div>
  );
}
