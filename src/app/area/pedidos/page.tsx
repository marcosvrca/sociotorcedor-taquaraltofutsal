import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";
import { orderStatusLabel } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MeusPedidosPage() {
  const session = await requireSession();
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-white">Meus pedidos</h1>
          <p className="mt-2 text-tf-muted">Compras na loja oficial do clube.</p>
        </div>
        <Link href="/loja" className="btn btn-secondary">
          Ir para a loja
        </Link>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-tf-muted">Você ainda não fez pedidos.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/loja/pedido/${order.code}`}
              className="panel block p-5 hover:border-white/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm text-tf-muted">{order.code}</p>
                  <p className="mt-1 text-white">
                    {order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-tf-muted">
                    {format(order.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{formatBRL(order.amountCents)}</p>
                  <p className="text-xs uppercase text-tf-muted">
                    {orderStatusLabel(order.status)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
