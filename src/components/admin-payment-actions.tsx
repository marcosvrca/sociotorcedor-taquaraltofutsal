"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminPaymentActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action: "confirm" | "reject") {
    setLoading(true);
    await fetch(`/api/admin/payments/${paymentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        className="btn btn-primary !py-2"
        disabled={loading}
        onClick={() => act("confirm")}
      >
        Confirmar pagamento
      </button>
      <button
        type="button"
        className="btn btn-secondary !py-2"
        disabled={loading}
        onClick={() => act("reject")}
      >
        Rejeitar
      </button>
    </div>
  );
}
