"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type ProductAdminData = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  memberPriceCents: number | null;
  stock: number;
  sizes: string | null;
  sortOrder: number;
  active: boolean;
  imageUrl: string | null;
};

function ProductFields({
  product,
}: {
  product?: ProductAdminData;
}) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Nome</label>
          <input name="name" defaultValue={product?.name} className="field" required />
        </div>
        <div>
          <label className="label">Preço (R$)</label>
          <input
            name="priceReais"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""}
            className="field"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Descrição</label>
          <textarea
            name="description"
            defaultValue={product?.description}
            className="field min-h-20"
            required
          />
        </div>
        <div>
          <label className="label">Preço sócio fixo (R$)</label>
          <p className="mb-1 text-xs text-tf-muted">
            Básico e Torcida usam o percentual do plano. Deixe em branco.
          </p>
          <input
            name="memberPriceReais"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              product?.memberPriceCents != null
                ? (product.memberPriceCents / 100).toFixed(2)
                : ""
            }
            className="field"
            placeholder="Opcional"
          />
        </div>
        <div>
          <label className="label">Estoque</label>
          <input
            name="stock"
            type="number"
            min="0"
            defaultValue={product?.stock ?? 0}
            className="field"
            required
          />
        </div>
        <div>
          <label className="label">Tamanhos</label>
          <input
            name="sizes"
            defaultValue={product?.sizes?.replaceAll(",", ", ") || ""}
            className="field"
            placeholder="P, M, G, GG"
          />
        </div>
        <div>
          <label className="label">Ordem</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={product?.sortOrder ?? 0}
            className="field"
          />
        </div>
        <div>
          <label className="label">Foto</label>
          <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="field !py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm text-white">
          <input name="active" type="checkbox" defaultChecked={product?.active ?? true} />
          À venda
        </label>
      </div>
      {product?.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageUrl} alt="" className="h-24 w-24 rounded-md object-cover" />
      )}
    </>
  );
}

export function ProductCreateForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = e.currentTarget;
    const res = await fetch("/api/admin/products", { method: "POST", body: new FormData(form) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Erro ao criar.");
      return;
    }
    form.reset();
    setMessage("Produto criado.");
    router.push("/admin/loja/produtos");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5">
      <h2 className="font-display text-2xl text-white">Novo produto</h2>
      <ProductFields />
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Salvando..." : "Cadastrar"}
      </button>
      {message && <p className="text-sm text-white">{message}</p>}
    </form>
  );
}

export function ProductDeleteButton({
  id,
  name,
  redirectTo,
}: {
  id: string;
  name: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onDelete() {
    if (!window.confirm(`Excluir o produto ${name}? Pedidos já feitos continuam registrados.`)) {
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Não foi possível excluir.");
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        className="btn btn-secondary !py-2"
        disabled={loading}
        onClick={onDelete}
      >
        {loading ? "Excluindo..." : "Excluir"}
      </button>
      {error && <p className="text-sm text-tf-red">{error}</p>}
    </div>
  );
}

export function ProductEditForm({ product }: { product: ProductAdminData }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      body: new FormData(e.currentTarget),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Erro ao salvar.");
      return;
    }
    setMessage("Salvo.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5">
      <h2 className="font-display text-2xl text-white">{product.name}</h2>
      <ProductFields product={product} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </button>
        <ProductDeleteButton
          id={product.id}
          name={product.name}
          redirectTo="/admin/loja/produtos"
        />
      </div>
      {message && <p className="text-sm text-white">{message}</p>}
    </form>
  );
}
