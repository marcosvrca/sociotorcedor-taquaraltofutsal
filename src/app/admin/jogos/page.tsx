import { prisma } from "@/lib/prisma";
import {
  MatchCreateForm,
  MatchEditForm,
  type MatchAdminData,
} from "@/components/match-admin-form";
import { AdminTicketsModal } from "@/components/admin-tickets-modal";
import { ticketDisplayStatus } from "@/lib/tickets";

export const dynamic = "force-dynamic";

export default async function AdminJogosPage() {
  const [matches, recentTickets] = await Promise.all([
    prisma.match.findMany({ orderBy: { dateTime: "asc" } }),
    prisma.ticket.findMany({
      where: {
        status: {
          in: ["AWAITING_CONFIRMATION", "PAID", "PENDING", "USED"],
        },
      },
      include: { match: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
  ]);

  const tickets = recentTickets.map((t) => ({
    id: t.id,
    code: t.code,
    buyerName: t.buyerName,
    buyerEmail: t.buyerEmail,
    amountCents: t.amountCents,
    status: t.status,
    displayStatus: ticketDisplayStatus(t.status, t.match.dateTime),
    receiptUrl: t.receiptUrl,
    opponent: t.match.opponent,
    matchDateTime: t.match.dateTime.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-white">Jogos</h1>
          <p className="mt-2 text-tf-muted">
            Cadastre próximos jogos, logo do adversário e o tipo de ingresso
            (online com QR ou físico via WhatsApp).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MatchCreateForm />
          <AdminTicketsModal tickets={tickets} count={tickets.length} />
        </div>
      </div>

      <div className="space-y-4">
        {matches.map((m) => {
          const data: MatchAdminData = {
            id: m.id,
            opponent: m.opponent,
            competition: m.competition,
            round: m.round,
            venue: m.venue,
            dateTime: m.dateTime.toISOString(),
            isHome: m.isHome,
            opponentLogoUrl: m.opponentLogoUrl,
            ticketMode: m.ticketMode,
            whatsappUrl: m.whatsappUrl,
            ticketPriceCents: m.ticketPriceCents,
            availableFor: m.availableFor,
            ticketsOnSale: m.ticketsOnSale,
            active: m.active,
          };
          return <MatchEditForm key={m.id} match={data} />;
        })}
        {matches.length === 0 && (
          <p className="text-sm text-tf-muted">Nenhum jogo cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
