"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/club";

type PlanTicketPrice = {
  name: string;
  percent: number;
  priceCents: number;
};

type Props = {
  matchId: string;
  opponent: string;
  priceCents: number;
  listPriceCents?: number;
  memberPlanName?: string | null;
  planPrices?: PlanTicketPrice[];
  defaultName?: string;
  defaultEmail?: string;
};

export function TicketPurchaseForm({
  matchId,
  opponent,
  priceCents,
  listPriceCents,
  memberPlanName = null,
  planPrices = [],
  defaultName = "",
  defaultEmail = "",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        buyerName: form.get("buyerName"),
        buyerEmail: form.get("buyerEmail"),
        buyerPhone: form.get("buyerPhone"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Não foi possível gerar o ingresso.");
      return;
    }
    router.push(`/ingresso/${data.code}`);
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      <div>
        <h2 className="font-display text-2xl text-white">Dados da compra</h2>
        <p className="mt-1 text-sm text-tf-muted">
          Ingresso digital vs {opponent}
          {priceCents > 0 ? ` · ${formatBRL(priceCents)}` : " · cortesia"}
        </p>
        {memberPlanName && listPriceCents != null && listPriceCents > priceCents && (
          <p className="mt-1 text-sm text-green-400">
            Plano {memberPlanName}: {formatBRL(priceCents)} (de {formatBRL(listPriceCents)})
          </p>
        )}
        {!memberPlanName && planPrices.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-green-400">
            {planPrices.map((plan) => (
              <li key={plan.name}>
                {plan.name}: {formatBRL(plan.priceCents)} ({plan.percent}% no ingresso). Entre na
                conta de sócio para aplicar.
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <label className="label">Nome completo</label>
        <input
          name="buyerName"
          className="field"
          defaultValue={defaultName}
          required
        />
      </div>
      <div>
        <label className="label">E-mail</label>
        <input
          name="buyerEmail"
          type="email"
          className="field"
          defaultValue={defaultEmail}
        />
      </div>
      <div>
        <label className="label">WhatsApp / telefone</label>
        <input name="buyerPhone" className="field" placeholder="(63) 99999-9999" />
      </div>
      {error && <p className="text-sm text-tf-red">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading
          ? "Gerando..."
          : priceCents > 0
            ? "Continuar para pagamento"
            : "Gerar ingresso"}
      </button>
    </form>
  );
}
