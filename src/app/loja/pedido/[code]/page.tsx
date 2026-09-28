import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { OrderPaymentPanel } from "@/components/order-payment-panel";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";
import { orderStatusLabel } from "@/lib/store";
import { resolvePixPayload } from "@/lib/payments/pix-manual";

export const dynamic = "force-dynamic";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { code } = await params;
  if (!session?.user) {
    redirect(`/login?callbackUrl=/loja/pedido/${code}`);
  }

  const order = await prisma.order.findUnique({
    where: { code },
    include: { items: true },
  });
  if (!order || (order.userId !== session.user.id && session.user.role !== "ADMIN")) {
    notFound();
  }

  let pixPayload = order.pixPayload;
  if (order.status === "PENDING" && order.method === "PIX" && !pixPayload) {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["pix_key", "pix_holder", "pix_city"] } },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    pixPayload = resolvePixPayload({
      amountCents: order.amountCents,
      description: `Loja ${order.code}`,
      pixKey: order.pixKey || map.pix_key,
      pixHolder: map.pix_holder,
      pixCity: map.pix_city,
      txid: order.code,
    });
  }

  return (
    <div className="min-h-screen">
      <div className="hero-grid relative pb-8 pt-[calc(8.5rem+env(safe-area-inset-top))] court-lines sm:pt-40">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-tf-muted">{order.code}</p>
          <h1 className="mt-2 font-display text-5xl text-white">Pedido</h1>
          <p className="mt-2 text-tf-muted">{orderStatusLabel(order.status)}</p>
        </div>
      </div>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-2 md:px-6">
        <div className="panel space-y-3 p-5">
          <h2 className="font-display text-2xl text-white">Itens</h2>
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-sm text-white/90">
              <span>
                {item.quantity}× {item.name}
                {item.size ? ` (${item.size})` : ""}
              </span>
              <span>{formatBRL(item.unitPriceCents * item.quantity)}</span>
            </div>
          ))}
          <p className="font-display text-3xl text-white">{formatBRL(order.amountCents)}</p>
          <div className="border-t border-white/10 pt-3 text-sm text-tf-muted">
            <p>{order.address}</p>
            <p>
              {order.city} - {order.state}
              {order.zipCode ? ` · ${order.zipCode}` : ""}
            </p>
          </div>
          <Link href="/area/pedidos" className="inline-block text-sm text-white underline">
            Ver meus pedidos
          </Link>
        </div>
        {order.status === "PENDING" && order.method === "PIX" ? (
          <OrderPaymentPanel
            orderId={order.id}
            code={order.code}
            pixKey={order.pixKey}
            pixPayload={pixPayload}
            amountLabel={formatBRL(order.amountCents)}
          />
        ) : (
          <div className="panel p-5 text-sm text-tf-muted">
            {order.status === "AWAITING_CONFIRMATION" &&
              "Recebemos o comprovante. O clube confirma o pagamento em seguida."}
            {order.status === "PAID" &&
              "Pagamento confirmado. O clube separa o pedido para entrega ou retirada."}
            {order.status === "FULFILLED" && "Pedido entregue."}
            {order.status === "REJECTED" &&
              "Pagamento recusado. O estoque foi devolvido. Fale com o clube se precisar refazer o pedido."}
            {order.status === "CANCELLED" && "Pedido cancelado."}
            {order.checkoutUrl && order.status === "PENDING" && (
              <a href={order.checkoutUrl} className="btn btn-primary mt-4">
                Continuar no Mercado Pago
              </a>
            )}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
