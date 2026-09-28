import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";

export const dynamic = "force-dynamic";

export default async function AdminSociosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;

  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
                { memberCode: { contains: q } },
              ],
            }
          : {},
        status
          ? { subscription: { status: status as "ACTIVE" | "PENDING" | "PAST_DUE" | "CANCELLED" } }
          : {},
      ],
    },
    include: {
      subscription: { include: { plan: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Sócios</h1>
      <form className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar nome, e-mail ou matrícula"
          className="field sm:max-w-md"
        />
        <select name="status" defaultValue={status || ""} className="field sm:max-w-xs">
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="PENDING">Pendente</option>
          <option value="PAST_DUE">Em atraso</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <button type="submit" className="btn btn-blue !py-2">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto panel">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-tf-muted">
            <tr>
              <th className="p-3">Sócio</th>
              <th className="p-3">Matrícula</th>
              <th className="p-3">Plano</th>
              <th className="p-3">Status</th>
              <th className="p-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-white/5 text-white/90">
                <td className="p-3">
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-tf-muted">{m.email}</p>
                </td>
                <td className="p-3 font-mono text-xs">{m.memberCode}</td>
                <td className="p-3">{m.subscription?.plan.name || "—"}</td>
                <td className="p-3">
                  <span className="badge badge-blue">
                    {m.subscription?.status || "SEM PLANO"}
                  </span>
                </td>
                <td className="p-3">
                  {m.subscription
                    ? formatBRL(m.subscription.plan.priceCents)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!members.length && (
          <p className="p-6 text-sm text-tf-muted">Nenhum sócio encontrado.</p>
        )}
      </div>
    </div>
  );
}
