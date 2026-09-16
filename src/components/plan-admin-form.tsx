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
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const benefitIds = form.getAll("benefitIds").map(String);
    const res = await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        priceReais: form.get("priceReais"),
        sortOrder: Number(form.get("sortOrder")),
        highlighted: form.get("highlighted") === "on",
        active: form.get("active") === "on",
        benefitIds,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage("Erro ao salvar.");
      return;
    }
    setMessage("Salvo.");
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
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary !py-2" disabled={loading}>
          {loading ? "Salvando..." : "Salvar plano"}
        </button>
        {message && <span className="text-sm text-green-400">{message}</span>}
      </div>
    </form>
  );
}

export function BenefitCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/admin/benefits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-3 p-5">
      <h2 className="font-display text-2xl text-white">Novo benefício</h2>
      <input
        className="field"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ex.: Desconto na loja oficial"
        required
      />
      <button type="submit" className="btn btn-blue !py-2" disabled={loading}>
        {loading ? "Adicionando..." : "Adicionar benefício"}
      </button>
    </form>
  );
}
