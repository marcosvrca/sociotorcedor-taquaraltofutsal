import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { club, formatBRL } from "@/lib/club";
import { getAppUrl } from "@/lib/env";
import { TicketPaymentPanel } from "@/components/ticket-payment-panel";
import { TicketQr } from "@/components/ticket-qr";
import {
  getTicketExpiresAt,
  isTicketExpired,
  isTicketValidForEntry,
  ticketDisplayStatus,
} from "@/lib/tickets";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

const statusCopy: Record<string, { title: string; text: string; ok: boolean }> = {
  PENDING: {
    title: "Aguardando pagamento",
    text: "Pague via PIX e envie o comprovante para liberar o ingresso.",
    ok: false,
  },
  AWAITING_CONFIRMATION: {
    title: "Em análise",
    text: "Comprovante recebido. O clube vai confirmar em breve.",
    ok: false,
  },
  PAID: {
    title: "Ingresso válido",
    text: "Apresente o QR Code na entrada do ginásio.",
    ok: true,
  },
  USED: {
    title: "Já utilizado",
    text: "Este ingresso já foi marcado na entrada.",
    ok: false,
  },
  REJECTED: {
    title: "Pagamento recusado",
    text: "Entre em contato com o clube para mais informações.",
    ok: false,
  },
  CANCELLED: {
    title: "Cancelado",
    text: "Este ingresso foi cancelado.",
    ok: false,
  },
  EXPIRED: {
    title: "Ingresso expirado",
    text: "A validade encerrou no dia seguinte ao jogo. Não pode ser reutilizado.",
    ok: false,
  },
};

export default async function IngressoPage({ params }: Props) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw).trim().toUpperCase();

  const ticket = await prisma.ticket.findFirst({
    where: { OR: [{ code }, { code: raw.trim() }] },
    include: { match: true },
  });

  if (!ticket) notFound();

  const baseUrl = getAppUrl();
  const verifyUrl = `${baseUrl}/verificar-ingresso/${ticket.code}`;
  const display = ticketDisplayStatus(ticket.status, ticket.match.dateTime);
  const copy = statusCopy[display] || statusCopy.PENDING;
  const showQr =
    isTicketValidForEntry(ticket.status, ticket.match.dateTime) ||
    ticket.status === "USED" ||
    (ticket.status === "PAID" && isTicketExpired(ticket.match.dateTime));
  const validUntil = new Date(
    getTicketExpiresAt(ticket.match.dateTime).getTime() - 1
  );

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <Link href="/#jogos" className="text-sm text-tf-muted hover:text-white">
          ← Jogos
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
              Meu ingresso
            </p>
            <h1 className="font-display text-3xl text-white">
              vs {ticket.match.opponent}
            </h1>
            <p className="font-mono text-sm text-tf-muted">{ticket.code}</p>
          </div>
        </div>

        <div
          className={`panel space-y-3 p-6 ${
            copy.ok ? "border-green-500/30" : "border-white/10"
          }`}
        >
          <p className="font-display text-2xl text-white">{copy.title}</p>
          <p className="text-sm text-tf-muted">{copy.text}</p>
          <dl className="grid grid-cols-2 gap-3 pt-2 text-sm">
            <div>
              <dt className="text-tf-muted">Comprador</dt>
              <dd className="text-white">{ticket.buyerName}</dd>
            </div>
            <div>
              <dt className="text-tf-muted">Valor</dt>
              <dd className="text-white">{formatBRL(ticket.amountCents)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-tf-muted">Data do jogo</dt>
              <dd className="text-white">
                {format(ticket.match.dateTime, "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
                {ticket.match.venue ? ` · ${ticket.match.venue}` : ""}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-tf-muted">Válido até</dt>
              <dd className="text-white">
                {format(validUntil, "dd/MM/yyyy", { locale: ptBR })}
              </dd>
            </div>
          </dl>
        </div>

        {ticket.status === "PENDING" && (
          <TicketPaymentPanel
            ticketId={ticket.id}
            code={ticket.code}
            pixKey={ticket.pixKey}
            pixPayload={ticket.pixPayload}
            amountLabel={formatBRL(ticket.amountCents)}
            verifyUrl={verifyUrl}
          />
        )}

        {showQr && (
          <div className="panel space-y-4 p-6 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-tf-muted">
              QR de verificação
            </p>
            <TicketQr value={verifyUrl} size={180} />
            <p className="font-mono text-sm text-white">{ticket.code}</p>
            <a
              href={verifyUrl}
              className="text-xs text-tf-blue hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Abrir página de verificação
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
