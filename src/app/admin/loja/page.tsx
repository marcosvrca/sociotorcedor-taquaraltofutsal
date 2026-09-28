import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";
import { orderStatusLabel } from "@/lib/store";
import { KpiCard, RankList, RevenueChart, StatusChart } from "@/components/store-dashboard";

export const dynamic = "force-dynamic";

const PAID = ["PAID", "FULFILLED"] as const;
const PENDING = ["PENDING", "AWAITING_CONFIRMATION"] as const;
const LOW_STOCK = 5;
const STATUSES: OrderStatus[] = [
  "AWAITING_CONFIRMATION",
  "PENDING",
  "PAID",
  "FULFILLED",
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

export default async function AdminLojaPage() {
  const now = new Date();
  const thisMonth = monthStart(0);
  const lastMonth = monthStart(-1);
  const chartStart = new Date();
  chartStart.setDate(chartStart.getDate() - 13);
  chartStart.setHours(0, 0, 0, 0);

  const [
    paidAll,
    paidThisMonth,
    paidLastMonth,
    pendingAgg,
    productCount,
    activeProducts,
    lowStockProducts,
    statusGroups,
    paidItems,
    recentOrders,
    chartOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: [...PAID] } },
      _sum: { amountCents: true },
      _count: true,
      _avg: { amountCents: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: [...PAID] }, createdAt: { gte: thisMonth } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: {
        status: { in: [...PAID] },
        createdAt: { gte: lastMonth, lt: thisMonth },
      },
      _sum: { amountCents: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: [...PENDING] } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({
      where: { stock: { lte: LOW_STOCK } },
      orderBy: { stock: "asc" },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
      _sum: { amountCents: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { status: { in: [...PAID] } } },
      select: { name: true, quantity: true, unitPriceCents: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
    prisma.order.findMany({
      where: { status: { in: [...PAID] }, createdAt: { gte: chartStart } },
      select: { amountCents: true, paidAt: true, createdAt: true },
    }),
  ]);

  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(chartStart);
    date.setDate(chartStart.getDate() + index);
    return { key: dayKey(date), label: format(date, "dd/MM"), cents: 0 };
  });
  const byDay = new Map(days.map((day) => [day.key, day]));
  for (const order of chartOrders) {
    const bucket = byDay.get(dayKey(order.paidAt || order.createdAt));
    if (bucket) bucket.cents += order.amountCents;
  }

  const statusMap = new Map(statusGroups.map((row) => [row.status, row]));
  const statusRows = STATUSES.map((status) => {
    const row = statusMap.get(status);
    return {
      status,
      label: orderStatusLabel(status),
      count: row?._count ?? 0,
      cents: row?._sum.amountCents ?? 0,
    };
  });

  const productTotals = new Map<string, { quantity: number; cents: number }>();
  for (const item of paidItems) {
    const current = productTotals.get(item.name) || { quantity: 0, cents: 0 };
    current.quantity += item.quantity;
    current.cents += item.quantity * item.unitPriceCents;
    productTotals.set(item.name, current);
  }
  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1].cents - a[1].cents)
    .slice(0, 5)
    .map(([name, totals]) => ({
      label: name,
      value: formatBRL(totals.cents),
      hint: `${totals.quantity} un.`,
    }));

  const revenue = paidAll._sum.amountCents ?? 0;
  const paidCount = paidAll._count;
  const average = Math.round(paidAll._avg.amountCents ?? 0);
  const monthRevenue = paidThisMonth._sum.amountCents ?? 0;
  const previousRevenue = paidLastMonth._sum.amountCents ?? 0;
  const pendingCount = pendingAgg._count;
  const pendingCents = pendingAgg._sum.amountCents ?? 0;
  const toDeliver = statusMap.get("PAID")?._count ?? 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-tf-muted">
        Atualizado em {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} ·{" "}
        {activeProducts} de {productCount} produtos à venda
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Faturamento"
          value={formatBRL(revenue)}
          hint={changeHint(monthRevenue, previousRevenue)}
          tone="green"
        />
        <KpiCard
          label="Pedidos pagos"
          value={String(paidCount)}
          hint={`${paidThisMonth._count} neste mês · ${toDeliver} para entregar`}
          href="/admin/loja/compras"
        />
        <KpiCard
          label="Ticket médio"
          value={formatBRL(average)}
          hint={`${formatBRL(monthRevenue)} faturados neste mês`}
        />
        <KpiCard
          label="Pagamentos pendentes"
          value={String(pendingCount)}
          hint={pendingCount ? `${formatBRL(pendingCents)} em aberto` : "Nada aguardando"}
          href="/admin/loja/pagamentos"
          tone={pendingCount ? "yellow" : "white"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <RevenueChart days={days} />
        <StatusChart rows={statusRows} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankList
          title="Produtos mais vendidos"
          subtitle="Receita de pedidos pagos e entregues"
          rows={topProducts}
          empty="Ainda não há vendas confirmadas."
        />
        <RankList
          title="Estoque em atenção"
          subtitle={`Até ${LOW_STOCK} unidades`}
          rows={lowStockProducts.map((product) => ({
            label: product.name,
            value: String(product.stock),
            hint: product.stock <= 0 ? "Esgotado" : "Baixo",
          }))}
          empty="Nenhum item com estoque baixo."
        />
      </div>

      <div className="panel p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-white">Últimas compras</h2>
            <p className="text-sm text-tf-muted">Cinco pedidos mais recentes</p>
          </div>
          <Link href="/admin/loja/compras" className="text-sm font-semibold text-white underline">
            Ver todas
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="mt-4 text-sm text-tf-muted">Nenhuma compra ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-tf-muted">
                <tr>
                  <th className="pb-2 font-medium">Pedido</th>
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium">Itens</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-white/5">
                    <td className="py-3 font-mono text-xs text-white">{order.code}</td>
                    <td className="py-3 text-white">{order.buyerName}</td>
                    <td className="py-3 text-tf-muted">
                      {order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}
                    </td>
                    <td className="py-3 text-white">{orderStatusLabel(order.status)}</td>
                    <td className="py-3 text-right text-white">{formatBRL(order.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/loja/produtos" className="panel p-4 text-sm text-white hover:border-white/25">
          Ver produtos →
        </Link>
        <Link href="/admin/loja/estoque" className="panel p-4 text-sm text-white hover:border-white/25">
          Ajustar estoque →
        </Link>
        <Link href="/admin/loja/cadastrar" className="panel p-4 text-sm text-white hover:border-white/25">
          Cadastrar produto →
        </Link>
      </div>
    </div>
  );
}
