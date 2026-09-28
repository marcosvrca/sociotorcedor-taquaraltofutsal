import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StockAdjust } from "@/components/stock-adjust";

export const dynamic = "force-dynamic";

const LOW_STOCK = 5;

export default async function AdminEstoquePage() {
  const products = await prisma.product.findMany({
    orderBy: [{ stock: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl text-white">Estoque</h2>
        <p className="mt-1 text-sm text-tf-muted">
          Itens com {LOW_STOCK} unidades ou menos aparecem como estoque baixo.
        </p>
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-tf-muted">
          Nenhum produto.{" "}
          <Link href="/admin/loja/cadastrar" className="text-white underline">
            Cadastrar o primeiro
          </Link>
        </p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const level =
              product.stock <= 0 ? "Esgotado" : product.stock <= LOW_STOCK ? "Baixo" : "Ok";
            const tone =
              product.stock <= 0
                ? "text-tf-red"
                : product.stock <= LOW_STOCK
                  ? "text-yellow-300"
                  : "text-green-400";
            return (
              <article
                key={product.id}
                className="panel flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <div>
                  <p className="font-semibold text-white">{product.name}</p>
                  <p className="text-sm text-tf-muted">
                    {product.sizes || "Sem tamanho"} · {product.active ? "à venda" : "oculto"}
                  </p>
                  <p className={`mt-1 text-xs font-bold uppercase ${tone}`}>{level}</p>
                </div>
                <StockAdjust
                  key={`${product.id}-${product.stock}`}
                  productId={product.id}
                  stock={product.stock}
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
