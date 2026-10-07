import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";
import { ProductDeleteButton } from "@/components/product-admin-form";

export const dynamic = "force-dynamic";

export default async function AdminProdutosPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-white">Produtos</h2>
          <p className="mt-1 text-sm text-tf-muted">
            {products.length} item(ns) cadastrado(s).
          </p>
        </div>
        <Link href="/admin/loja/cadastrar" className="btn btn-primary">
          Cadastrar produto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-tf-muted">Nenhum produto ainda.</p>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <article key={product.id} className="panel flex flex-wrap items-center gap-4 p-4">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt=""
                  className="h-16 w-16 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-white/5 text-xs text-tf-muted">
                  TF
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white">{product.name}</p>
                <p className="text-sm text-tf-muted">
                  {product.priceCents > 0 ? formatBRL(product.priceCents) : "Preço em definição"}
                  {product.memberPriceCents != null
                    ? ` · sócio ${formatBRL(product.memberPriceCents)}`
                    : ""}
                  {product.sizes ? ` · ${product.sizes}` : ""}
                </p>
                <p className="text-xs uppercase text-tf-muted">
                  Estoque {product.stock} · {product.active ? "à venda" : "oculto"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/loja/produtos/${product.id}`} className="btn btn-secondary !py-2">
                  Editar
                </Link>
                <ProductDeleteButton id={product.id} name={product.name} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
