import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductEditForm, type ProductAdminData } from "@/components/product-admin-form";

export const dynamic = "force-dynamic";

export default async function AdminProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const data: ProductAdminData = {
    id: product.id,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    memberPriceCents: product.memberPriceCents,
    stock: product.stock,
    sizes: product.sizes,
    sortOrder: product.sortOrder,
    active: product.active,
    imageUrl: product.imageUrl,
  };

  return (
    <div className="space-y-4">
      <Link href="/admin/loja/produtos" className="text-sm text-tf-muted hover:text-white">
        ← Produtos
      </Link>
      <ProductEditForm product={data} />
    </div>
  );
}
