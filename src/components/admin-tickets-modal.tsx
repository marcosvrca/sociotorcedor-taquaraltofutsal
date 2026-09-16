"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBRL } from "@/lib/club";
import { TicketAdminActions } from "@/components/match-admin-form";

export type AdminTicketRow = {
  id: string;
  code: string;
  buyerName: string;
  buyerEmail: string | null;
  amountCents: number;
  status: string;
  displayStatus: string;
  receiptUrl: string | null;
  opponent: string;
  matchDateTime: string;
};

const statusLabel: Record<string, string> = {
  PENDING: "Aguardando PIX",
  AWAITING_CONFIRMATION: "Aguardando confirmação",
  PAID: "Pago / válido",
  USED: "Utilizado",
  CANCELLED: "Cancelado",
  REJECTED: "Recusado",
  EXPIRED: "Expirado",
};

export function AdminTicketsModal({
  tickets,
  count,
}: {
  tickets: AdminTicketRow[];
  count: number;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-secondary !py-2 !px-4 text-xs"
      >
        Ver ingressos{count > 0 ? ` (${count})` : ""}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-16 backdrop-blur-sm md:items-center md:pt-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="panel w-full max-w-5xl space-y-4 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tickets-modal-title"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="tickets-modal-title"
                  className="font-display text-3xl text-white"
                >
                  Ingressos
                </h2>
                <p className="mt-1 text-sm text-tf-muted">
                  Confirme pagamentos e acompanhe o status. Ingressos expiram no
                  dia seguinte ao jogo.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary !py-2 !px-4 text-xs"
                onClick={() => setOpen(false)}
              >
                Fechar
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#11161f] text-xs uppercase tracking-wide text-tf-muted">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Comprador</th>
                    <th className="px-4 py-3">Jogo</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-t border-white/10">
                      <td className="px-4 py-3 font-mono text-white">{t.code}</td>
                      <td className="px-4 py-3 text-white/85">
                        <div>{t.buyerName}</div>
                        <div className="text-xs text-tf-muted">{t.buyerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-white/85">
                        vs {t.opponent}
                        <div className="text-xs text-tf-muted">
                          {format(new Date(t.matchDateTime), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {formatBRL(t.amountCents)}
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {statusLabel[t.displayStatus] || t.displayStatus}
                        {t.receiptUrl && (
                          <a
                            href={t.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 block text-xs text-tf-blue hover:underline"
                          >
                            Ver comprovante
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <TicketAdminActions
                          ticketId={t.id}
                          status={t.displayStatus === "EXPIRED" ? "EXPIRED" : t.status}
                        />
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-tf-muted">
                        Nenhum ingresso recente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
