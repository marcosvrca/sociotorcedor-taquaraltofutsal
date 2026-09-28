import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";
import { AdminPaymentActions } from "@/components/admin-payment-actions";
import { PixQr } from "@/components/pix-qr";
import { resolvePixPayload } from "@/lib/payments/pix-manual";
import { paymentStatusLabel } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

export default async function AdminPagamentosPage() {
  const [payments, settings] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          include: {
            user: true,
            plan: true,
          },
        },
      },
    }),
    prisma.setting.findMany({
      where: { key: { in: ["pix_key", "pix_holder", "pix_city"] } },
    }),
  ]);
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Pagamentos</h1>
      <p className="text-tf-muted">
        Confirme PIX com comprovante ou acompanhe pagamentos via Mercado Pago.
      </p>

      <div className="space-y-4">
        {payments.map((p) => (
          <div key={p.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">
                  {p.subscription.user.name}
                </p>
                <p className="text-sm text-tf-muted">
                  {p.subscription.user.email} · {p.subscription.plan.name} ·{" "}
                  {p.method}
                </p>
                <p className="mt-1 text-xs text-tf-muted">
                  {format(p.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
                {p.receiptUrl && (
                  <a
                    href={p.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-tf-blue underline"
                  >
                    Abrir comprovante PIX
                  </a>
                )}
              </div>
              <div className="text-right">
                <p className="font-display text-2xl text-white">
                  {formatBRL(p.amountCents)}
                </p>
                <span
                  className={`badge ${
                    p.status === "PAID"
                      ? "badge-green"
                      : p.status === "AWAITING_CONFIRMATION"
                        ? "badge-yellow"
                        : p.status === "REJECTED"
                          ? "badge-red"
                          : "badge-blue"
                  }`}
                >
                  {paymentStatusLabel(p.status)}
                </span>
              </div>
            </div>
            {p.provider === "PIX_MANUAL" &&
              (p.status === "AWAITING_CONFIRMATION" ||
                p.status === "PENDING") && (
                <div className="mt-4 space-y-4">
                  {(() => {
                    const payload = resolvePixPayload({
                      pixPayload: p.pixPayload,
                      amountCents: p.amountCents,
                      description: p.description,
                      pixKey: p.pixKey || map.pix_key,
                      pixHolder: map.pix_holder,
                      pixCity: map.pix_city,
                      txid: p.id,
                    });
                    return payload ? <PixQr value={payload} /> : null;
                  })()}
                  <AdminPaymentActions paymentId={p.id} />
                </div>
              )}
          </div>
        ))}
        {!payments.length && (
          <p className="text-sm text-tf-muted">Nenhum pagamento registrado.</p>
        )}
      </div>
    </div>
  );
}
