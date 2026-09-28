import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { AddToCart } from "@/components/add-to-cart";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";
import { parseSizes } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, active: true },
  });
  if (!product) notFound();

  const sizes = parseSizes(product.sizes);

  return (
    <div className="min-h-screen">
      <div className="hero-grid relative pb-10 pt-[calc(8.5rem+env(safe-area-inset-top))] court-lines sm:pt-40">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Link href="/loja" className="text-sm text-tf-muted hover:text-white">
            ← Loja
          </Link>
        </div>
      </div>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2 md:px-6">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-80 w-full rounded-xl object-cover md:h-[28rem]"
          />
        ) : (
          <div className="flex h-80 items-center justify-center rounded-xl bg-white/5 font-display text-6xl text-white/30 md:h-[28rem]">
            TF
          </div>
        )}
        <div className="space-y-5">
          <h1 className="font-display text-5xl text-white">{product.name}</h1>
          <p className="text-tf-muted">{product.description}</p>
          <div>
            <p className="font-display text-4xl text-white">{formatBRL(product.priceCents)}</p>
            {product.memberPriceCents != null && (
              <p className="mt-1 text-sm text-green-400">
                Sócio ativo: {formatBRL(product.memberPriceCents)}
              </p>
            )}
          </div>
          <AddToCart
            productId={product.id}
            name={product.name}
            priceCents={product.priceCents}
            memberPriceCents={product.memberPriceCents}
            imageUrl={product.imageUrl}
            sizes={sizes}
            stock={product.stock}
          />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
