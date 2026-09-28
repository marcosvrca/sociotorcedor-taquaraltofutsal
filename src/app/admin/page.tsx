import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";
import { KpiCard, RankList, RevenueChart, StatusChart } from "@/components/store-dashboard";

export const dynamic = "force-dynamic";

const SUB_STATUSES: SubscriptionStatus[] = ["ACTIVE", "PENDING", "PAST_DUE", "CANCELLED"];
const PAYMENT_STATUSES: PaymentStatus[] = [
  "AWAITING_CONFIRMATION",
  "PENDING",
  "PAID",
  "REJECTED",
  "CANCELLED",
];

function monthStart(offset: number) {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function changeHint(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? "Primeiro resultado deste mês" : "Sem movimento no mês anterior";
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent}% em relação ao mês anterior`;
}

function subscriptionLabel(status: SubscriptionStatus) {
  switch (status) {
    case "ACTIVE":
      return "Ativa";
    case "PENDING":
      return "Aguardando pagamento";
    case "PAST_DUE":
      return "Em atraso";
    case "CANCELLED":
      return "Cancelada";
  }
}

function paymentLabel(status: PaymentStatus) {
  switch (status) {
    case "PENDING":
      return "Aguardando PIX";
    case "AWAITING_CONFIRMATION":
      return "Comprovante enviado";
    case "PAID":
      return "Pago";
    case "REJECTED":
      return "Recusado";
    case "CANCELLED":
      return "Cancelado";
  }
}

export default async function AdminHomePage() {
  const now = new Date();
  const thisMonth = monthStart(0);
  const lastMonth = monthStart(-1);
  const chartStart = new Date();
  chartStart.setDate(chartStart.getDate() - 13);
  chartStart.setHours(0, 0, 0, 0);

  const [
    members,
    newMembers,
    activeSubs,
    paidAll,
    paidThisMonth,
    paidLastMonth,
    pendingPayments,
    plans,
    subGroups,
    paymentGroups,
    chartPayments,
    recentPayments,
    openTickets,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: thisMonth } } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amountCents: true },
      _count: true,
      _avg: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", createdAt: { gte: thisMonth } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", createdAt: { gte: lastMonth, lt: thisMonth } },
      _sum: { amountCents: true },
    }),
    prisma.payment.aggregate({
      where: { status: { in: ["PENDING", "AWAITING_CONFIRMATION"] } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.subscription.groupBy({
      by: ["planId", "status"],
      _count: true,
    }),
    prisma.payment.groupBy({
      by: ["status"],
      _count: true,
      _sum: { amountCents: true },
    }),
    prisma.payment.findMany({
      where: { status: "PAID", createdAt: { gte: chartStart } },
      select: { amountCents: true, paidAt: true, createdAt: true },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { subscription: { include: { user: true, plan: true } } },
    }),
    prisma.ticket.count({
      where: { status: { in: ["PENDING", "AWAITING_CONFIRMATION"] } },
    }),
  ]);

  const planById = new Map(plans.map((plan) => [plan.id, plan]));
  const subsByStatus = new Map<SubscriptionStatus, { count: number; cents: number }>();
  const subsByPlan = new Map<string, number>();
  for (const row of subGroups) {
    const plan = planById.get(row.planId);
    const cents = (plan?.priceCents ?? 0) * row._count;
    const current = subsByStatus.get(row.status) || { count: 0, cents: 0 };
    current.count += row._count;
    current.cents += cents;
    subsByStatus.set(row.status, current);
    if (row.status === "ACTIVE") {
      subsByPlan.set(row.planId, (subsByPlan.get(row.planId) || 0) + row._count);
    }
  }

  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(chartStart);
    date.setDate(chartStart.getDate() + index);
    return { key: dayKey(date), label: format(date, "dd/MM"), cents: 0 };
  });
  const byDay = new Map(days.map((day) => [day.key, day]));
  for (const payment of chartPayments) {
    const bucket = byDay.get(dayKey(payment.paidAt || payment.createdAt));
    if (bucket) bucket.cents += payment.amountCents;
  }

  const subRows = SUB_STATUSES.map((status) => {
    const row = subsByStatus.get(status);
    return {
      status,
      label: subscriptionLabel(status),
      count: row?.count ?? 0,
      cents: row?.cents ?? 0,
    };
  });

  const payMap = new Map(paymentGroups.map((row) => [row.status, row]));
  const paymentRows = PAYMENT_STATUSES.map((status) => {
    const row = payMap.get(status);
    return {
      status,
      label: paymentLabel(status),
      count: row?._count ?? 0,
      cents: row?._sum.amountCents ?? 0,
    };
  });

  const planRows = plans
    .map((plan) => {
      const count = subsByPlan.get(plan.id) || 0;
      return {
        label: plan.active ? plan.name : `${plan.name} (inativo)`,
        value: formatBRL(count * plan.priceCents),
        hint: `${count} ativo(s) · ${formatBRL(plan.priceCents)}/mês`,
        count,
      };
    })
    .sort((a, b) => b.count - a.count);

  const revenue = paidAll._sum.amountCents ?? 0;
  const monthRevenue = paidThisMonth._sum.amountCents ?? 0;
  const previousRevenue = paidLastMonth._sum.amountCents ?? 0;
  const average = Math.round(paidAll._avg.amountCents ?? 0);
  const pendingCount = pendingPayments._count;
  const recurring = subsByStatus.get("ACTIVE")?.cents ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-white">Visão geral</h1>
        <p className="mt-2 text-sm text-tf-muted">
          Sócio torcedor · atualizado em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Sócios"
          value={String(members)}
          hint={newMembers ? `${newMembers} cadastros neste mês` : "Nenhum cadastro neste mês"}
          href="/admin/socios"
        />
        <KpiCard
          label="Assinaturas ativas"
          value={String(activeSubs)}
          hint={`${formatBRL(recurring)} de mensalidade recorrente`}
          href="/admin/planos"
          tone="green"
        />
        <KpiCard
          label="Receita de mensalidades"
          value={formatBRL(revenue)}
          hint={changeHint(monthRevenue, previousRevenue)}
          tone="green"
        />
        <KpiCard
          label="PIX a confirmar"
          value={String(pendingCount)}
          hint={
            pendingCount
              ? `${formatBRL(pendingPayments._sum.amountCents ?? 0)} em aberto`
              : "Nenhuma cobrança pendente"
          }
          href="/admin/pagamentos"
          tone={pendingCount ? "yellow" : "white"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <RevenueChart
          days={days}
          title="Mensalidades"
          subtitle="Pagamentos confirmados nos últimos 14 dias"
        />
        <StatusChart
          title="Assinaturas"
          subtitle={`${activeSubs} ativas · ticket médio ${formatBRL(average)}`}
          rows={subRows}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusChart title="Cobranças" rows={paymentRows} />
        <RankList
          title="Planos"
          subtitle="Receita mensal das assinaturas ativas"
          rows={planRows}
          empty="Nenhum plano cadastrado."
        />
      </div>

      <div className="panel p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-white">Últimas cobranças</h2>
            <p className="text-sm text-tf-muted">Cinco mensalidades mais recentes</p>
          </div>
          <Link href="/admin/pagamentos" className="text-sm font-semibold text-white underline">
            Ver todas
          </Link>
        </div>
        {recentPayments.length === 0 ? (
          <p className="mt-4 text-sm text-tf-muted">Nenhuma cobrança ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-tf-muted">
                <tr>
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Sócio</th>
                  <th className="pb-2 font-medium">Plano</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => (
                  <tr key={payment.id} className="border-t border-white/5">
                    <td className="py-3 text-tf-muted">
                      {format(payment.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                    </td>
                    <td className="py-3 text-white">{payment.subscription.user.name}</td>
                    <td className="py-3 text-white">{payment.subscription.plan.name}</td>
                    <td className="py-3 text-white">{paymentLabel(payment.status)}</td>
                    <td className="py-3 text-right text-white">{formatBRL(payment.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/socios" className="panel p-4 text-sm text-white hover:border-white/25">
          Ver sócios →
        </Link>
        <Link href="/admin/pagamentos" className="panel p-4 text-sm text-white hover:border-white/25">
          Revisar pagamentos →
        </Link>
        <Link href="/admin/jogos" className="panel p-4 text-sm text-white hover:border-white/25">
          Ingressos{openTickets ? ` (${openTickets} em aberto)` : ""} →
        </Link>
        <Link href="/admin/loja" className="panel p-4 text-sm text-white hover:border-white/25">
          Painel da loja →
        </Link>
      </div>
    </div>
  );
}
