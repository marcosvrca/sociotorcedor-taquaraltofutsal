import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminOrderCard } from "@/components/admin-order-card";

export const dynamic = "force-dynamic";

export default async function AdminPagamentosLojaPage() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PENDING", "AWAITING_CONFIRMATION"] } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const withReceipt = orders.filter((order) => order.status === "AWAITING_CONFIRMATION");
  const waitingPix = orders.filter((order) => order.status === "PENDING");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl text-white">Pagamentos pendentes</h2>
        <p className="mt-1 text-sm text-tf-muted">
          {withReceipt.length} com comprovante para conferir · {waitingPix.length} ainda
          sem pagamento.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-2xl text-white">Comprovante enviado</h3>
        {withReceipt.length === 0 ? (
          <p className="text-sm text-tf-muted">Nenhum comprovante aguardando.</p>
        ) : (
          withReceipt.map((order) => <AdminOrderCard key={order.id} order={order} />)
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-2xl text-white">Aguardando PIX</h3>
        {waitingPix.length === 0 ? (
          <p className="text-sm text-tf-muted">Nenhum pedido esperando pagamento.</p>
        ) : (
          waitingPix.map((order) => <AdminOrderCard key={order.id} order={order} />)
        )}
      </section>

      <Link href="/admin/loja/compras" className="inline-block text-sm text-white underline">
        Ver todas as compras
      </Link>
    </div>
  );
}