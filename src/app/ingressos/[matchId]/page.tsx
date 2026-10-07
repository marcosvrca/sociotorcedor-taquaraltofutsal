import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { club, formatBRL } from "@/lib/club";
import { getMemberOffer } from "@/lib/member-offer";
import { applyPercent } from "@/lib/pricing";
import { TicketPurchaseForm } from "@/components/ticket-purchase-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ matchId: string }> };

export default async function ComprarIngressoPage({ params }: Props) {
  const { matchId } = await params;
  const session = await getServerSession(authOptions);
  const offer = await getMemberOffer(session?.user?.id);

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      active: true,
      ticketsOnSale: true,
      ticketMode: "ONLINE",
    },
  });

  if (!match) notFound();

  if (match.ticketMode === "PHYSICAL" && match.whatsappUrl) {
    redirect(match.whatsappUrl);
  }

  const listPriceCents = match.ticketPriceCents ?? 0;
  const priceCents = applyPercent(listPriceCents, offer.ticketDiscountPercent);
  const plans = await prisma.plan.findMany({
    where: { active: true, ticketDiscountPercent: { gt: 0 } },
    orderBy: { sortOrder: "asc" },
    select: { name: true, ticketDiscountPercent: true },
  });

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <Link href="/#jogos" className="text-sm text-tf-muted hover:text-white">
          ← Voltar aos jogos
        </Link>
        <div className="flex items-center gap-4">
          <Image
            src="/brand/logo.png"
            alt={club.name}
            width={48}
            height={66}
            className="h-14 w-auto"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-tf-muted">
              Ingresso digital
            </p>
            <h1 className="font-display text-3xl text-white">
              {club.name} x {match.opponent}
            </h1>
            <p className="text-sm text-tf-muted">
              {format(match.dateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {match.venue ? ` · ${match.venue}` : ""}
            </p>
            <p className="mt-1 text-white">{formatBRL(priceCents)}</p>
            {offer.member && priceCents < listPriceCents && (
              <p className="text-sm text-green-400">
                Plano {offer.planName}: {offer.ticketDiscountPercent}% de desconto
              </p>
            )}
          </div>
        </div>

        <TicketPurchaseForm
          matchId={match.id}
          opponent={match.opponent}
          priceCents={priceCents}
          listPriceCents={listPriceCents}
          memberPlanName={offer.member ? offer.planName : null}
          planPrices={plans.map((plan) => ({
            name: plan.name,
            percent: plan.ticketDiscountPercent,
            priceCents: applyPercent(listPriceCents, plan.ticketDiscountPercent),
          }))}
          defaultName={session?.user?.name || ""}
          defaultEmail={session?.user?.email || ""}
        />
      </div>
    </main>
  );
}
