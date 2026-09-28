"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export type MatchAdminData = {
  id: string;
  opponent: string;
  competition: string | null;
  round: string | null;
  venue: string | null;
  dateTime: string;
  isHome: boolean;
  opponentLogoUrl: string | null;
  ticketMode: "ONLINE" | "PHYSICAL";
  whatsappUrl: string | null;
  ticketPriceCents: number | null;
  availableFor: string | null;
  ticketsOnSale: boolean;
  active: boolean;
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function MatchFields({
  match,
  prefix = "",
}: {
  match?: MatchAdminData;
  prefix?: string;
}) {
  const [mode, setMode] = useState<"ONLINE" | "PHYSICAL">(
    match?.ticketMode || "PHYSICAL"
  );

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <label className="label">Adversário</label>
        <input
          name={`${prefix}opponent`}
          defaultValue={match?.opponent}
          className="field"
          required
        />
      </div>
      <div>
        <label className="label">Data e hora</label>
        <input
          name={`${prefix}dateTime`}
          type="datetime-local"
          defaultValue={match ? toLocalInput(match.dateTime) : ""}
          className="field"
          required
        />
      </div>
      <div>
        <label className="label">Competição</label>
        <input
          name={`${prefix}competition`}
          defaultValue={match?.competition || ""}
          className="field"
          placeholder="Ex.: Liga Tocantinense"
        />
      </div>
      <div>
        <label className="label">Fase / rodada</label>
        <input
          name={`${prefix}round`}
          defaultValue={match?.round || ""}
          className="field"
          placeholder="Ex.: semifinal"
        />
      </div>
      <div>
        <label className="label">Local</label>
        <input
          name={`${prefix}venue`}
          defaultValue={match?.venue || ""}
          className="field"
          placeholder="Ex.: Ginásio de Taquaralto"
        />
      </div>
      <div>
        <label className="label">Logo do adversário (opcional)</label>
        <input
          name={`${prefix}opponentLogo`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="field !py-2"
        />
        {match?.opponentLogoUrl && (
          <label className="mt-2 flex items-center gap-2 text-xs text-tf-muted">
            <input type="checkbox" name={`${prefix}clearLogo`} />
            Remover logo atual
          </label>
        )}
      </div>
      <div className="md:col-span-2">
        <label className="label">Disponível para</label>
        <textarea
          name={`${prefix}availableFor`}
          defaultValue={match?.availableFor || ""}
          className="field min-h-16"
          placeholder="Ex.: Sócio Torcedor&#10;Público geral"
        />
      </div>
      <div>
        <label className="label">Tipo de ingresso</label>
        <select
          name={`${prefix}ticketMode`}
          className="field"
          value={mode}
          onChange={(e) => setMode(e.target.value as "ONLINE" | "PHYSICAL")}
        >
          <option value="PHYSICAL">Físico (WhatsApp)</option>
          <option value="ONLINE">Online (QR Code)</option>
        </select>
      </div>
      {mode === "PHYSICAL" ? (
        <div>
          <label className="label">Link WhatsApp</label>
          <input
            name={`${prefix}whatsappUrl`}
            defaultValue={match?.whatsappUrl || ""}
            className="field"
            placeholder="https://wa.me/5563..."
            required
          />
        </div>
      ) : (
        <div>
          <label className="label">Preço do ingresso (R$)</label>
          <input
            name={`${prefix}ticketPriceReais`}
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              match?.ticketPriceCents != null
                ? (match.ticketPriceCents / 100).toFixed(2)
                : "0"
            }
            className="field"
            required
          />
        </div>
      )}
      <div className="flex flex-wrap items-end gap-4 pb-2 text-sm text-white md:col-span-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name={`${prefix}isHome`}
            defaultChecked={match?.isHome ?? true}
          />
          Mandante (Taquaralto em casa)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name={`${prefix}ticketsOnSale`}
            defaultChecked={match?.ticketsOnSale ?? true}
          />
          Ingressos à venda
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name={`${prefix}active`}
            defaultChecked={match?.active ?? true}
          />
          Exibir no site
        </label>
      </div>
    </div>
  );
}

export function MatchCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const res = await fetch("/api/admin/matches", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Erro ao criar.");
      return;
    }
    setOpen(false);
    setMessage("");
    router.refresh();
  }

  return (
    <>
      <button type="button" className="btn btn-primary !py-2" onClick={() => setOpen(true)}>
        Cadastrar jogo
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-16 backdrop-blur-sm md:items-center md:pt-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="panel w-full max-w-3xl space-y-4 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Cadastrar jogo"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl text-white">Cadastrar jogo</h2>
              <button
                type="button"
                className="text-sm text-tf-muted hover:text-white"
                onClick={() => setOpen(false)}
              >
                Fechar
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4" encType="multipart/form-data">
              <MatchFields />
              {message && <p className="text-sm text-tf-red">{message}</p>}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : "Cadastrar jogo"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function MatchEditForm({ match }: { match: MatchAdminData }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError(false);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/matches/${match.id}`, {
      method: "PUT",
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(true);
      setMessage(data.error || "Erro ao salvar.");
      return;
    }
    setMessage("Salvo.");
    router.refresh();
  }

  async function onDelete() {
    if (!confirm("Excluir este jogo e os ingressos vinculados?")) return;
    setLoading(true);
    setMessage("");
    setError(false);
    const res = await fetch(`/api/admin/matches/${match.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(true);
      setMessage(data.error || "Não foi possível excluir.");
      return;
    }
    router.refresh();
  }

  async function onReactivateTickets() {
    if (
      !confirm(
        "Reativar prazo dos ingressos deste jogo?\n\nUse após adiar a data: os ingressos pagos voltam a valer até o dia seguinte à nova data."
      )
    ) {
      return;
    }
    setLoading(true);
    setMessage("");
    setError(false);
    const res = await fetch(
      `/api/admin/matches/${match.id}/reactivate-tickets`,
      { method: "POST" }
    );
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(true);
      setMessage(data.error || "Erro ao reativar.");
      return;
    }
    setMessage(
      `Prazo reativado (${data.reactivated ?? 0} ingresso(s)). Confira a data do jogo.`
    );
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5" encType="multipart/form-data">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-2xl text-white">
          vs {match.opponent}
        </h2>
        <span className="text-xs uppercase text-tf-muted">
          {match.ticketMode === "ONLINE" ? "Online + QR" : "Físico / WhatsApp"}
        </span>
      </div>
      <MatchFields match={match} />
      <p className="text-xs text-tf-muted">
        Ingressos digitais expiram automaticamente no dia seguinte ao jogo. Se
        adiar, salve a nova data e use &quot;Reativar ingressos&quot;.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary !py-2" disabled={loading}>
          {loading ? "Salvando..." : "Salvar jogo"}
        </button>
        <button
          type="button"
          className="btn btn-blue !py-2"
          onClick={onReactivateTickets}
          disabled={loading}
        >
          Reativar ingressos
        </button>
        <button
          type="button"
          className="btn btn-secondary !py-2"
          onClick={onDelete}
          disabled={loading}
        >
          Excluir
        </button>
        {message && (
          <span className={`text-sm ${error ? "text-tf-red" : "text-green-400"}`}>{message}</span>
        )}
      </div>
    </form>
  );
}

export function TicketAdminActions({
  ticketId,
  status,
}: {
  ticketId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action: "confirm" | "reject" | "use") {
    setLoading(true);
    await fetch(`/api/admin/tickets/${ticketId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "AWAITING_CONFIRMATION" && (
        <>
          <button
            type="button"
            className="btn btn-primary !px-3 !py-1 text-xs"
            disabled={loading}
            onClick={() => act("confirm")}
          >
            Confirmar
          </button>
          <button
            type="button"
            className="btn btn-secondary !px-3 !py-1 text-xs"
            disabled={loading}
            onClick={() => act("reject")}
          >
            Recusar
          </button>
        </>
      )}
      {status === "PAID" && (
        <button
          type="button"
          className="btn btn-blue !px-3 !py-1 text-xs"
          disabled={loading}
          onClick={() => act("use")}
        >
          Marcar usado
        </button>
      )}
      {status === "EXPIRED" && (
        <span className="text-xs text-tf-muted">Expirado — reative no jogo</span>
      )}
    </div>
  );
}
