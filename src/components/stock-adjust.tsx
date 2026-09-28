"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function StockAdjust({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(stock));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: Number(value) }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Erro ao salvar.");
      return;
    }
    setMessage("Atualizado.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="field w-24"
        aria-label="Quantidade em estoque"
      />
      <button type="submit" className="btn btn-secondary !py-2" disabled={loading}>
        {loading ? "..." : "Salvar"}
      </button>
      {message && <span className="text-xs text-white/70">{message}</span>}
    </form>
  );
}
