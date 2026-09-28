"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/club";
import { clearCart, linePrice, readCart, type CartLine } from "@/lib/cart";

type Defaults = {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
};

export function CheckoutForm({
  member,
  cardAvailable,
  defaults,
}: {
  member: boolean;
  cardAvailable: boolean;
  defaults: Defaults;
}) {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState<"PIX" | "CARD" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLines(readCart());
    setReady(true);
  }, []);

  const total = lines.reduce(
    (sum, line) => sum + linePrice(line, member) * line.quantity,
    0
  );

  async function pay(method: "PIX" | "CARD", form: HTMLFormElement) {
    setLoading(method);
    setError("");
    const data = new FormData(form);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method,
        address: data.get("address"),
        city: data.get("city"),
        state: data.get("state"),
        zipCode: data.get("zipCode"),
        phone: data.get("phone"),
        notes: data.get("notes"),
        items: lines.map((line) => ({
          productId: line.productId,
          size: line.size,
          quantity: line.quantity,
        })),
      }),
    });
    const payload = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      setError(payload.error || "Não foi possível criar o pedido.");
      return;
    }
    clearCart();
    if (payload.checkoutUrl) {
      window.location.href = payload.checkoutUrl;
      return;
    }
    router.push(`/loja/pedido/${payload.code}`);
  }

  async function onPix(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await pay("PIX", e.currentTarget);
  }

  if (!ready) return <p className="text-sm text-tf-muted">Carregando...</p>;

  if (!lines.length) {
    return (
      <div className="panel p-6">
        <p className="text-tf-muted">Sua sacola está vazia.</p>
        <Link href="/loja" className="btn btn-primary mt-4">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onPix} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="panel space-y-4 p-5">
        <h2 className="font-display text-2xl text-white">Entrega ou retirada</h2>
        <div>
          <label className="label" htmlFor="address">
            Endereço
          </label>
          <input
            id="address"
            name="address"
            required
            defaultValue={defaults.address}
            className="field"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="city">
              Cidade
            </label>
            <input id="city" name="city" required defaultValue={defaults.city} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="state">
              UF
            </label>
            <input
              id="state"
              name="state"
              required
              maxLength={20}
              defaultValue={defaults.state}
              className="field uppercase"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="zipCode">
              CEP
            </label>
            <input
              id="zipCode"
              name="zipCode"
              defaultValue={defaults.zipCode}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Telefone
            </label>
            <input id="phone" name="phone" defaultValue={defaults.phone} className="field" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="notes">
            Observação
          </label>
          <textarea id="notes" name="notes" className="field min-h-20" maxLength={300} />
        </div>
      </div>

      <div className="panel space-y-4 p-5">
        <h2 className="font-display text-2xl text-white">Pedido</h2>
        <ul className="space-y-2 text-sm">
          {lines.map((line) => (
            <li key={`${line.productId}-${line.size || ""}`} className="flex justify-between gap-3 text-white/90">
              <span>
                {line.quantity}× {line.name}
                {line.size ? ` (${line.size})` : ""}
              </span>
              <span>{formatBRL(linePrice(line, member) * line.quantity)}</span>
            </li>
          ))}
        </ul>
        {member && (
          <p className="text-xs text-green-400">Desconto de sócio aplicado no servidor.</p>
        )}
        <p className="font-display text-4xl text-white">{formatBRL(total)}</p>
        <button type="submit" className="btn btn-primary w-full" disabled={loading !== null}>
          {loading === "PIX" ? "Gerando PIX..." : "Pagar com PIX"}
        </button>
        {cardAvailable && (
          <button
            type="button"
            className="btn btn-secondary w-full"
            disabled={loading !== null}
            onClick={(e) => {
              const form = e.currentTarget.form;
              if (!form || !form.reportValidity()) return;
              void pay("CARD", form);
            }}
          >
            {loading === "CARD" ? "Abrindo checkout..." : "Pagar com cartão"}
          </button>
        )}
        {error && <p className="text-sm text-tf-red">{error}</p>}
        <p className="text-xs text-tf-muted">
          O PIX usa a chave do clube.
        </p>
      </div>
    </form>
  );
}
