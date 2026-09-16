import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { club } from "@/lib/club";
import {
  getTicketExpiresAt,
  isTicketExpired,
  isTicketValidForEntry,
} from "@/lib/tickets";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

export default async function VerificarIngressoPage({ params }: Props) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode).trim();

  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [{ code }, { code: code.toUpperCase() }],
    },
    include: { match: true },
  });

  const used = ticket?.status === "USED";
  const expired =
    ticket != null &&
    ticket.status === "PAID" &&
    isTicketExpired(ticket.match.dateTime);
  const valid =
    ticket != null && isTicketValidForEntry(ticket.status, ticket.match.dateTime);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-tf-blue/30 via-transparent to-tf-red/25" />
      <div className="relative mx-auto max-w-md space-y-6">
        <div className="flex items-center gap-4">
          <Image
            src="/brand/logo.png"
            alt={club.name}
            width={56}
            height={76}
            className="h-16 w-auto"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-tf-muted">
              Verificação de ingresso
            </p>
            <h1 className="font-display text-3xl text-white">{club.name}</h1>
          </div>
        </div>

        <div className="panel space-y-5 p-6">
          {!ticket ? (
            <>
              <p className="font-display text-2xl text-tf-red">Não encontrado</p>
              <p className="text-tf-muted">
                Nenhum ingresso com o código{" "}
                <span className="font-mono text-white">{code}</span>.
              </p>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs uppercase tracking-wider text-tf-muted">
                  Portador
                </p>
                <p className="font-display text-2xl text-white">{ticket.buyerName}</p>
                <p className="font-mono text-sm text-tf-muted">{ticket.code}</p>
              </div>

              <div
                className={`rounded-lg border px-4 py-4 ${
                  valid
                    ? "border-green-500/40 bg-green-500/10"
                    : used || expired
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-tf-red/40 bg-tf-red/10"
                }`}
              >
                <p className="text-xs uppercase tracking-wider text-white/70">
                  Situação
                </p>
                <p className="mt-1 font-display text-3xl text-white">
                  {valid
                    ? "Válido"
                    : used
                      ? "Já utilizado"
                      : expired
                        ? "Expirado"
                        : "Inválido"}
                </p>
                <p className="mt-3 text-sm text-white/80">
                  {valid
                    ? "Ingresso pago e liberado para entrada."
                    : used
                      ? "Este QR já foi usado na portaria."
                      : expired
                        ? "Validade encerrada no dia seguinte ao jogo."
                        : "Ingresso ainda não confirmado ou cancelado."}
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <dt className="text-tf-muted">Jogo</dt>
                  <dd className="text-white">
                    {club.name} x {ticket.match.opponent}
                  </dd>
                </div>
                <div>
                  <dt className="text-tf-muted">Data</dt>
                  <dd className="text-white">
                    {format(ticket.match.dateTime, "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-tf-muted">Válido até</dt>
                  <dd className="text-white">
                    {format(
                      new Date(getTicketExpiresAt(ticket.match.dateTime).getTime() - 1),
                      "dd/MM/yyyy",
                      { locale: ptBR }
                    )}
                  </dd>
                </div>
                {ticket.match.venue && (
                  <div>
                    <dt className="text-tf-muted">Local</dt>
                    <dd className="text-white">{ticket.match.venue}</dd>
                  </div>
                )}
              </dl>
            </>
          )}
        </div>

        <p className="text-center text-xs text-tf-muted">
          {club.programName} · {club.fullLocation}
        </p>
      </div>
    </main>
  );
}
