import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Order, OrderItem } from "@prisma/client";
import { formatBRL } from "@/lib/club";
import { orderStatusLabel } from "@/lib/store";
import { AdminOrderActions } from "@/components/admin-order-actions";
import { PixQr } from "@/components/pix-qr";
import { resolvePixPayload } from "@/lib/payments/pix-manual";

export function AdminOrderCard({
  order,
}: {
  order: Order & { items: OrderItem[] };
}) {
  const pixCode =
    order.method !== "CARD" &&
    (order.status === "PENDING" || order.status === "AWAITING_CONFIRMATION")
      ? resolvePixPayload({
          pixPayload: order.pixPayload,
          amountCents: order.amountCents,
          description: `Loja ${order.code}`,
          pixKey: order.pixKey,
          txid: order.code,
        })
      : null;

  return (
    <article className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-tf-muted">{order.code}</p>
          <p className="text-white">{order.buyerName}</p>
          <p className="text-sm text-tf-muted">{order.buyerEmail}</p>
          <p className="mt-2 text-sm text-white/80">
            {order.items
              .map(
                (item) =>
                  `${item.quantity}× ${item.name}${item.size ? ` (${item.size})` : ""}`
              )
              .join(", ")}
          </p>
          <p className="mt-1 text-sm text-tf-muted">
            {order.address}, {order.city} - {order.state}
          </p>
          <p className="mt-1 text-xs text-tf-muted">
            {format(order.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-white">{formatBRL(order.amountCents)}</p>
          <p className="text-xs uppercase text-tf-muted">
            {orderStatusLabel(order.status)} · {order.method}
          </p>
          {order.receiptUrl && (
            <a
              href={order.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-white underline"
            >
              Ver comprovante
            </a>
          )}
        </div>
      </div>
      {pixCode && (
        <div className="mt-4">
          <PixQr value={pixCode} />
        </div>
      )}
      <AdminOrderActions orderId={order.id} status={order.status} />
    </article>
  );
}
