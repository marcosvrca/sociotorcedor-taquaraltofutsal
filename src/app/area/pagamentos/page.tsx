import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";
import { PaymentActions } from "@/components/payment-actions";
import { PixQr } from "@/components/pix-qr";
import { resolvePixPayload } from "@/lib/payments/pix-manual";
import { paymentStatusLabel } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mp?: string }>;
}) {
  const session = await requireSession();
  const { mp } = await searchParams;
  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: {
      plan: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  const settings = await prisma.setting.findMany({
    where: { key: { in: ["pix_key", "pix_holder", "pix_city"] } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-white">Pagamentos</h1>
        <p className="mt-1 text-tf-muted">
          Pague a mensalidade via PIX com comprovante.
        </p>
      </div>

      {mp === "success" && (
        <div className="rounded-md border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-200">
          Pagamento aprovado no Mercado Pago. Em instantes o status será
          atualizado.
        </div>
      )}
      {mp === "pending" && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          Pagamento em análise no Mercado Pago.
        </div>
      )}
      {mp === "failure" && (
        <div className="rounded-md border border-tf-red/40 bg-tf-red/10 p-4 text-sm text-red-200">
          Não foi possível concluir o pagamento no cartão. Tente novamente ou
          pague via PIX.
        </div>
      )}

      {sub ? (
        <>
          <div className="panel p-5">
            <p className="text-xs uppercase tracking-wider text-tf-muted">
              Plano atual
            </p>
            <p className="mt-1 font-display text-3xl text-white">
              {sub.plan.name} · {formatBRL(sub.plan.priceCents)}/mês
            </p>
            <PaymentActions
              hasOpenPayment={sub.payments.some(
                (p) =>
                  p.status === "PENDING" || p.status === "AWAITING_CONFIRMATION"
              )}
            />
          </div>

          <div className="space-y-4">
            {sub.payments.map((p) => {
              const pixCode =
                p.method !== "CARD" &&
                (p.status === "PENDING" || p.status === "AWAITING_CONFIRMATION")
                  ? resolvePixPayload({
                      pixPayload: p.pixPayload,
                      amountCents: p.amountCents,
                      description: p.description,
                      pixKey: p.pixKey || map.pix_key,
                      pixHolder: map.pix_holder,
                      pixCity: map.pix_city,
                      txid: p.id,
                    })
                  : null;

              return (
              <div key={p.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {p.description || "Mensalidade"}
                    </p>
                    <p className="text-sm text-tf-muted">
                      {p.method} ·{" "}
                      {format(p.createdAt, "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
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

                {p.method === "CARD" &&
                  p.status === "PENDING" &&
                  p.checkoutUrl && (
                    <div className="mt-4">
                      <a
                        href={p.checkoutUrl}
                        className="btn btn-primary !py-2 inline-flex"
                      >
                        Abrir checkout Mercado Pago
                      </a>
                    </div>
                  )}

                {p.method !== "CARD" &&
                  (p.status === "PENDING" ||
                    p.status === "AWAITING_CONFIRMATION") && (
                    <div className="mt-4 space-y-3 rounded-md border border-white/10 bg-black/30 p-4 text-sm">
                      <p>
                        <span className="text-tf-muted">Chave PIX: </span>
                        <span className="font-mono text-white">
                          {p.pixKey || map.pix_key}
                        </span>
                      </p>
                      <p>
                        <span className="text-tf-muted">Titular: </span>
                        <span className="text-white">
                          {map.pix_holder || "Taquaralto Futsal"}
                        </span>
                      </p>
                      {pixCode && <PixQr value={pixCode} />}
                      {pixCode && (
                        <div>
                          <p className="mb-1 text-tf-muted">Copia e cola</p>
                          <code className="block break-all rounded bg-black/50 p-3 text-xs text-white/90">
                            {pixCode}
                          </code>
                        </div>
                      )}
                      {p.receiptUrl && (
                        <p>
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-tf-blue underline"
                          >
                            Ver comprovante enviado
                          </a>
                        </p>
                      )}
                      {p.status === "PENDING" && (
                        <PaymentActions paymentId={p.id} mode="markPaid" />
                      )}
                      {p.status === "AWAITING_CONFIRMATION" && (
                        <p className="text-yellow-300">
                          Comprovante recebido. Aguardando confirmação do clube.
                        </p>
                      )}
                    </div>
                  )}
              </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="panel p-6 text-tf-muted">
          Você ainda não possui assinatura. Escolha um plano na página de{" "}
          <a href="/planos" className="text-white underline">
            planos
          </a>
          .
        </div>
      )}
    </div>
  );
}
