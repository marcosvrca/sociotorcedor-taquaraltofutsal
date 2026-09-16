import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";
import {
  membershipBadgeClass,
  membershipStatusLabel,
} from "@/lib/membership";

export const dynamic = "force-dynamic";

export default async function AreaDashboardPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: {
        include: {
          plan: true,
          payments: { orderBy: { createdAt: "desc" }, take: 3 },
        },
      },
    },
  });

  const sub = user?.subscription;
  const statusLabel = membershipStatusLabel(sub);
  const badge = membershipBadgeClass(sub);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-white">
          Olá, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-tf-muted">
          Matrícula {user?.memberCode} · acompanhe seu plano e pagamentos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-wider text-tf-muted">Plano</p>
          <p className="mt-2 font-display text-3xl text-white">
            {sub?.plan.name || "—"}
          </p>
          {sub && (
            <p className="mt-1 text-sm text-tf-muted">
              {formatBRL(sub.plan.priceCents)}/mês
            </p>
          )}
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-wider text-tf-muted">Status</p>
          <p className="mt-3">
            <span className={`badge ${badge}`}>{statusLabel}</span>
          </p>
          {sub?.currentPeriodEnd && (
            <p className="mt-3 text-sm text-tf-muted">
              Vigência até{" "}
              {format(sub.currentPeriodEnd, "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase tracking-wider text-tf-muted">Atalhos</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/area/pagamentos" className="text-white hover:text-tf-red">
              Atualizar pagamentos →
            </Link>
            <Link href="/area/cadastro" className="text-white hover:text-tf-red">
              Editar cadastro →
            </Link>
            <Link href="/area/carteirinha" className="text-white hover:text-tf-red">
              Ver carteirinha →
            </Link>
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="font-display text-2xl text-white">Últimos pagamentos</h2>
        <div className="mt-4 space-y-3">
          {sub?.payments.length ? (
            sub.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border-b border-white/5 pb-3 text-sm last:border-0"
              >
                <div>
                  <p className="text-white">{p.description || "Mensalidade"}</p>
                  <p className="text-tf-muted">
                    {format(p.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">
                    {formatBRL(p.amountCents)}
                  </p>
                  <p className="text-xs uppercase text-tf-muted">{p.status}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-tf-muted">Nenhum pagamento ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
