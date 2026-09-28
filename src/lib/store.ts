import type { OrderStatus, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "produto";
}

export function generateOrderCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `LJ-${n}${Date.now().toString().slice(-4)}`;
}

export function parseSizes(sizes: string | null | undefined) {
  if (!sizes) return [];
  return sizes
    .split(",")
    .map((size) => size.trim().toUpperCase())
    .filter(Boolean);
}

export function formatSizes(sizes: string[]) {
  return sizes.length ? sizes.join(",") : null;
}

export function unitPriceCents(
  product: Pick<Product, "priceCents" | "memberPriceCents">,
  member: boolean
) {
  if (member && product.memberPriceCents != null) return product.memberPriceCents;
  return product.priceCents;
}

export function orderStatusLabel(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return "Aguardando pagamento";
    case "AWAITING_CONFIRMATION":
      return "Comprovante enviado";
    case "PAID":
      return "Pago";
    case "FULFILLED":
      return "Entregue";
    case "REJECTED":
      return "Recusado";
    case "CANCELLED":
      return "Cancelado";
  }
}

export async function uniqueProductSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function getPixSettings() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["pix_key", "pix_holder", "pix_city"] } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return {
    pixKey: map.pix_key || "taquaraltofutsal@gmail.com",
    pixHolder: map.pix_holder || "Taquaralto Futsal",
    pixCity: map.pix_city || "Palmas",
  };
}

export async function restoreOrderStock(orderId: string) {
  const items = await prisma.orderItem.findMany({
    where: { orderId, productId: { not: null } },
  });
  if (!items.length) return;
  await prisma.$transaction(
    items.map((item) =>
      prisma.product.update({
        where: { id: item.productId! },
        data: { stock: { increment: item.quantity } },
      })
    )
  );
}
