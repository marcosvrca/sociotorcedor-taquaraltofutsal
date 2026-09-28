import { prisma } from "@/lib/prisma";
import { AdminOrderCard } from "@/components/admin-order-card";

export const dynamic = "force-dynamic";

export default async function AdminComprasPage() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl text-white">Compras</h2>
        <p className="mt-1 text-sm text-tf-muted">
          Todos os pedidos da loja. Confirme o pagamento ou marque a entrega.
        </p>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-tf-muted">Nenhuma compra ainda.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <AdminOrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
