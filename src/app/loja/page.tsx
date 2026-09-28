import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";

export const dynamic = "force-dynamic";

export default async function LojaPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="min-h-screen">
      <div className="hero-grid relative pb-12 pt-[calc(8.5rem+env(safe-area-inset-top))] court-lines sm:pb-16 sm:pt-40 lg:pt-44">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tf-red sm:text-sm sm:tracking-[0.2em]">
            Loja oficial
          </p>
          <h1 className="mt-2 font-display text-5xl text-white sm:text-6xl md:text-7xl">
            Produtos do clube
          </h1>
          <p className="mt-4 max-w-2xl text-tf-muted">
            Camisas, acessórios e itens oficiais. Sócio com plano ativo paga o
            preço especial na finalização, com a mesma conta e o mesmo PIX do programa.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        {products.length === 0 ? (
          <p className="text-tf-muted">A loja ainda não tem produtos à venda.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link key={product.id} href={`/loja/${product.slug}`} className="panel overflow-hidden">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt="" className="h-52 w-full object-cover" />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-white/5 font-display text-4xl text-white/30">
                    TF
                  </div>
                )}
                <div className="space-y-2 p-5">
                  <h2 className="font-display text-2xl text-white">{product.name}</h2>
                  <p className="line-clamp-2 text-sm text-tf-muted">{product.description}</p>
                  <p className="text-white">{formatBRL(product.priceCents)}</p>
                  {product.memberPriceCents != null && (
                    <p className="text-sm text-green-400">
                      Sócio {formatBRL(product.memberPriceCents)}
                    </p>
                  )}
                  <p className="text-xs uppercase text-tf-muted">
                    {product.stock > 0 ? `${product.stock} em estoque` : "Esgotado"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
