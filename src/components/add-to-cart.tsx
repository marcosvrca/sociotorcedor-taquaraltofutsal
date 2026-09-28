"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";

export function AddToCart({
  productId,
  name,
  priceCents,
  memberPriceCents,
  imageUrl,
  sizes,
  stock,
}: {
  productId: string;
  name: string;
  priceCents: number;
  memberPriceCents: number | null;
  imageUrl: string | null;
  sizes: string[];
  stock: number;
}) {
  const router = useRouter();
  const [size, setSize] = useState(sizes[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");

  function onAdd() {
    if (sizes.length && !size) {
      setMessage("Escolha o tamanho.");
      return;
    }
    addToCart({
      productId,
      name,
      size: sizes.length ? size : null,
      quantity,
      priceCents,
      memberPriceCents,
      imageUrl,
    });
    setMessage("Adicionado à sacola.");
    router.push("/loja/carrinho");
  }

  if (stock <= 0) {
    return <p className="text-sm text-tf-muted">Produto esgotado.</p>;
  }

  return (
    <div className="space-y-4">
      {sizes.length > 0 && (
        <div>
          <p className="label">Tamanho</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSize(option)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  size === option
                    ? "border-white bg-white text-black"
                    : "border-white/20 text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="label" htmlFor="qty">
          Quantidade
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          max={Math.min(10, stock)}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          className="field max-w-28"
        />
      </div>
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        Adicionar à sacola
      </button>
      {message && <p className="text-sm text-green-400">{message}</p>}
    </div>
  );
}
