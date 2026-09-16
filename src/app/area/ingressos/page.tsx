import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = {
  PENDING: "Aguardando PIX",
  AWAITING_CONFIRMATION: "Em análise",
  PAID: "Válido",
  USED: "Utilizado",
  CANCELLED: "Cancelado",
  REJECTED: "Recusado",
};

export default async function AreaIngressosPage() {
  const session = await requireSession();

  const tickets = await prisma.ticket.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { buyerEmail: session.user.email || undefined },
      ],
    },
    include: { match: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-white">Meus ingressos</h1>
        <p className="mt-2 text-tf-muted">
          Ingressos digitais comprados no site. Apresente o QR na entrada.
        </p>
      </div>

      <div className="space-y-3">
        {tickets.map((t) => (
          <Link
            key={t.id}
            href={`/ingresso/${t.code}`}
            className="panel flex flex-wrap items-center justify-between gap-3 p-5 transition hover:border-white/25"
          >
            <div>
              <p className="font-display text-xl text-white">
                vs {t.match.opponent}
              </p>
              <p className="text-sm text-tf-muted">
                {format(t.match.dateTime, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                {" · "}
                {formatBRL(t.amountCents)}
              </p>
              <p className="mt-1 font-mono text-xs text-white/60">{t.code}</p>
            </div>
            <span className="badge badge-blue">{labels[t.status] || t.status}</span>
          </Link>
        ))}
        {tickets.length === 0 && (
          <p className="text-tf-muted">
            Você ainda não comprou ingressos. Veja os{" "}
            <Link href="/#jogos" className="text-tf-blue hover:underline">
              próximos jogos
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
