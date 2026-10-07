"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Benefit = { id: string; title: string };

type PlanData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  productDiscountPercent: number;
  ticketDiscountPercent: number;
  partnerDiscountPercent: number;
  sortOrder: number;
  highlighted: boolean;
  active: boolean;
  benefitIds: string[];
};

export function PlanAdminForm({
  plan,
  allBenefits,
  priceLabel,
}: {
  plan: PlanData;
  allBenefits: Benefit[];
  priceLabel: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError(false);
    const form = new FormData(e.currentTarget);
    const benefitIds = form.getAll("benefitIds").map(String);
    const res = await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        priceReais: form.get("priceReais"),
        productDiscountPercent: Number(form.get("productDiscountPercent") || 0),
        ticketDiscountPercent: Number(form.get("ticketDiscountPercent") || 0),
        partnerDiscountPercent: Number(form.get("partnerDiscountPercent") || 0),
        sortOrder: Number(form.get("sortOrder")),
        highlighted: form.get("highlighted") === "on",
        active: form.get("active") === "on",
        benefitIds,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(true);
      setMessage(data.error || "Erro ao salvar.");
      return;
    }
    setMessage("Salvo.");
    router.refresh();
  }

  async function onDelete() {
    if (!window.confirm(`Excluir o plano ${plan.name}?`)) return;
    setLoading(true);
    setMessage("");
    setError(false);
    const res = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(true);
      setMessage(data.error || "Não foi possível excluir.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl text-white">
          {plan.name}{" "}
          <span className="text-base text-tf-muted">({priceLabel})</span>
        </h2>
        <span className="text-xs uppercase text-tf-muted">{plan.slug}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Nome</label>
          <input name="name" defaultValue={plan.name} className="field" required />
        </div>
        <div>
          <label className="label">Preço mensal (R$)</label>
          <input
            name="priceReais"
            type="number"
            step="0.01"
            min="0"
            defaultValue={(plan.priceCents / 100).toFixed(2)}
            className="field"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Descrição</label>
          <textarea
            name="description"
            defaultValue={plan.description}
            className="field min-h-20"
            required
          />
        </div>
        <div>
          <label className="label">Desconto na loja (%)</label>
          <input
            name="productDiscountPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={plan.productDiscountPercent}
            className="field"
          />
        </div>
        <div>
          <label className="label">Desconto no ingresso (%)</label>
          <input
            name="ticketDiscountPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={plan.ticketDiscountPercent}
            className="field"
          />
        </div>
        <div>
          <label className="label">Desconto com parceiros (%)</label>
          <input
            name="partnerDiscountPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={plan.partnerDiscountPercent}
            className="field"
          />
        </div>
        <div>
          <label className="label">Ordem</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={plan.sortOrder}
            className="field"
          />
        </div>
        <div className="flex items-end gap-4 pb-2 text-sm text-white">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="highlighted"
              defaultChecked={plan.highlighted}
            />
            Destaque
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="active" defaultChecked={plan.active} />
            Ativo
          </label>
        </div>
      </div>
      <div>
        <p className="label">Benefícios</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {allBenefits.map((b) => (
            <label key={b.id} className="flex items-start gap-2 text-sm text-white/85">
              <input
                type="checkbox"
                name="benefitIds"
                value={b.id}
                defaultChecked={plan.benefitIds.includes(b.id)}
                className="mt-1"
              />
              {b.title}
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary !py-2" disabled={loading}>
          {loading ? "Salvando..." : "Salvar plano"}
        </button>
        <button
          type="button"
          className="btn btn-secondary !py-2"
          disabled={loading}
          onClick={onDelete}
        >
          Excluir plano
        </button>
        {message && (
          <span className={`text-sm ${error ? "text-tf-red" : "text-green-400"}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-16 backdrop-blur-sm md:items-center md:pt-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="panel w-full max-w-2xl space-y-4 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl text-white">{title}</h2>
          <button type="button" className="text-sm text-tf-muted hover:text-white" onClick={onClose}>
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PlansToolbar({ benefits }: { benefits: Benefit[] }) {
  const router = useRouter();
  const [screen, setScreen] = useState<"plan" | "benefit" | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createPlan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        priceReais: form.get("priceReais"),
        productDiscountPercent: Number(form.get("productDiscountPercent") || 0),
        ticketDiscountPercent: Number(form.get("ticketDiscountPercent") || 0),
        partnerDiscountPercent: Number(form.get("partnerDiscountPercent") || 0),
        sortOrder: Number(form.get("sortOrder") || 0),
        highlighted: form.get("highlighted") === "on",
        active: form.get("active") === "on",
        benefitIds: form.getAll("benefitIds").map(String),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Erro ao cadastrar.");
      return;
    }
    setScreen(null);
    setMessage("");
    router.refresh();
  }

  async function createBenefit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/benefits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.get("title") }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Erro ao cadastrar benefício.");
      return;
    }
    setScreen(null);
    setMessage("");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary !py-2" onClick={() => setScreen("plan")}>
          Cadastrar plano
        </button>
        <button type="button" className="btn btn-secondary !py-2" onClick={() => setScreen("benefit")}>
          Cadastrar benefício
        </button>
      </div>

      {screen === "plan" && (
        <Dialog title="Cadastrar plano" onClose={() => setScreen(null)}>
          <form onSubmit={createPlan} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">Nome</label>
                <input name="name" className="field" required />
              </div>
              <div>
                <label className="label">Preço mensal (R$)</label>
                <input name="priceReais" type="number" step="0.01" min="0.01" className="field" required />
              </div>
              <div className="md:col-span-2">
                <label className="label">Descrição</label>
                <textarea name="description" className="field min-h-20" required />
              </div>
              <div>
                <label className="label">Desconto na loja (%)</label>
                <input name="productDiscountPercent" type="number" min="0" max="100" defaultValue={0} className="field" />
              </div>
              <div>
                <label className="label">Desconto no ingresso (%)</label>
                <input name="ticketDiscountPercent" type="number" min="0" max="100" defaultValue={0} className="field" />
              </div>
              <div>
                <label className="label">Desconto com parceiros (%)</label>
                <input name="partnerDiscountPercent" type="number" min="0" max="100" defaultValue={0} className="field" />
              </div>
              <div>
                <label className="label">Ordem</label>
                <input name="sortOrder" type="number" defaultValue={0} className="field" />
              </div>
              <div className="flex items-end gap-4 pb-2 text-sm text-white">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="highlighted" />
                  Destaque
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="active" defaultChecked />
                  Ativo
                </label>
              </div>
            </div>
            <div>
              <p className="label">Benefícios</p>
              <div className="mt-2 grid max-h-48 gap-2 overflow-auto md:grid-cols-2">
                {benefits.map((benefit) => (
                  <label key={benefit.id} className="flex items-start gap-2 text-sm text-white/85">
                    <input type="checkbox" name="benefitIds" value={benefit.id} className="mt-1" />
                    {benefit.title}
                  </label>
                ))}
              </div>
            </div>
            {message && <p className="text-sm text-tf-red">{message}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar plano"}
            </button>
          </form>
        </Dialog>
      )}

      {screen === "benefit" && (
        <Dialog title="Cadastrar benefício" onClose={() => setScreen(null)}>
          <form onSubmit={createBenefit} className="space-y-4">
            <div>
              <label className="label">Título</label>
              <input
                name="title"
                className="field"
                placeholder="Ex.: Desconto na loja oficial"
                required
                minLength={3}
              />
            </div>
            {message && <p className="text-sm text-tf-red">{message}</p>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar benefício"}
            </button>
          </form>
        </Dialog>
      )}
    </>
  );
}
