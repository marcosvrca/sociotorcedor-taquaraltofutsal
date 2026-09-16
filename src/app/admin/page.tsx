import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [members, activeSubs, pendingPayments, plans] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.payment.count({ where: { status: "AWAITING_CONFIRMATION" } }),
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Painel admin</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <p className="text-xs uppercase text-tf-muted">Sócios</p>
          <p className="mt-2 font-display text-4xl text-white">{members}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase text-tf-muted">Assinaturas ativas</p>
          <p className="mt-2 font-display text-4xl text-white">{activeSubs}</p>
        </div>
        <div className="panel p-5">
          <p className="text-xs uppercase text-tf-muted">PIX a confirmar</p>
          <p className="mt-2 font-display text-4xl text-yellow-300">
            {pendingPayments}
          </p>
          {pendingPayments > 0 && (
            <Link
              href="/admin/pagamentos"
              className="mt-2 inline-block text-sm text-white underline"
            >
              Revisar agora
            </Link>
          )}
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="font-display text-2xl text-white">Planos</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {plans.map((p) => (
            <li
              key={p.id}
              className="flex justify-between border-b border-white/5 pb-2 text-white/90"
            >
              <span>
                {p.name} {p.active ? "" : "(inativo)"}
              </span>
              <span>{formatBRL(p.priceCents)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
