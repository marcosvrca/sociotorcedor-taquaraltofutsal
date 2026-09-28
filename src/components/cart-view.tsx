"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/club";
import { cartLineKey, linePrice, readCart, writeCart, type CartLine } from "@/lib/cart";

export function CartView({ member }: { member: boolean }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(readCart());
    setReady(true);
  }, []);

  function update(next: CartLine[]) {
    setLines(next);
    writeCart(next);
  }

  if (!ready) {
    return <p className="text-sm text-tf-muted">Carregando sacola...</p>;
  }

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

  const total = lines.reduce(
    (sum, line) => sum + linePrice(line, member) * line.quantity,
    0
  );

  return (
    <div className="space-y-4">
      {member && (
        <p className="text-sm text-green-400">
          Preço de sócio ativo aplicado nos itens com desconto.
        </p>
      )}
      {lines.map((line) => (
        <div
          key={cartLineKey(line)}
          className="panel flex flex-wrap items-center justify-between gap-4 p-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            {line.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={line.imageUrl}
                alt=""
                className="h-16 w-16 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-white/5 text-xs text-tf-muted">
                TF
              </div>
            )}
            <div>
              <p className="font-semibold text-white">{line.name}</p>
              {line.size && <p className="text-sm text-tf-muted">Tam. {line.size}</p>}
              <p className="text-sm text-white/80">
                {formatBRL(linePrice(line, member))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={10}
              value={line.quantity}
              onChange={(e) => {
                const quantity = Math.max(1, Math.min(10, Number(e.target.value) || 1));
                update(
                  lines.map((item) =>
                    cartLineKey(item) === cartLineKey(line) ? { ...item, quantity } : item
                  )
                );
              }}
              className="field w-20"
            />
            <button
              type="button"
              className="text-sm text-tf-red"
              onClick={() =>
                update(lines.filter((item) => cartLineKey(item) !== cartLineKey(line)))
              }
            >
              Remover
            </button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-display text-3xl text-white">{formatBRL(total)}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/loja" className="btn btn-secondary">
            Continuar comprando
          </Link>
          <Link href="/loja/checkout" className="btn btn-primary">
            Finalizar compra
          </Link>
        </div>
      </div>
    </div>
  );
}
