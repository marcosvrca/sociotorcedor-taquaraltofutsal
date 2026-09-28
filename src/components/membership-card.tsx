"use client";

import { useCallback, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { club } from "@/lib/club";

export type MembershipCardData = {
  name: string;
  memberCode: string;
  planName: string;
  photoUrl: string | null;
  valid: boolean;
  statusLabel: string;
  periodEnd: string | null;
  verifyUrl: string;
};

export function MembershipCard({ data }: { data: MembershipCardData }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const [error, setError] = useState("");

  const capture = useCallback(async () => {
    if (!cardRef.current) throw new Error("Carteirinha indisponível.");
    return toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0a0c10",
    });
  }, []);

  async function downloadPng() {
    setBusy("png");
    setError("");
    try {
      const dataUrl = await capture();
      const link = document.createElement("a");
      link.download = `carteirinha-${data.memberCode}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("Não foi possível gerar o PNG. Tente novamente.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    setBusy("pdf");
    setError("");
    try {
      const dataUrl = await capture();
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Falha ao carregar imagem."));
        img.src = dataUrl;
      });

      const pdf = new jsPDF({
        orientation: img.width >= img.height ? "landscape" : "portrait",
        unit: "px",
        format: [img.width, img.height],
        hotfixes: ["px_scaling"],
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
      pdf.save(`carteirinha-${data.memberCode}.pdf`);
    } catch {
      setError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-tf-blue via-tf-ink to-tf-red p-5 shadow-2xl sm:p-6"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-tf-red/20" />

        <div className="relative flex items-start justify-between gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt={club.name}
            width={70}
            height={95}
            className="h-16 w-auto drop-shadow sm:h-20"
          />
          <div className="min-w-0 text-right">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/70 sm:text-xs sm:tracking-[0.22em]">
              {club.programName}
            </p>
            <p className="break-words font-display text-lg leading-none text-white sm:text-2xl">
              {club.name}
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex gap-3 sm:gap-4">
          <div className="h-28 w-24 shrink-0 overflow-hidden rounded-lg border-2 border-white/40 bg-black/30 sm:h-32 sm:w-28">
            {data.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.photoUrl}
                alt={data.name}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] uppercase tracking-wide text-white/50">
                Sem foto
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-white/70 sm:text-xs">
              Sócio
            </p>
            <p className="break-words font-display text-xl leading-tight text-white sm:text-3xl">
              {data.name}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-white/60">Matrícula</p>
                <p className="font-mono text-white">{data.memberCode}</p>
              </div>
              <div>
                <p className="text-white/60">Plano</p>
                <p className="truncate text-white">{data.planName}</p>
              </div>
            </div>
            {data.periodEnd && (
              <p className="mt-2 text-xs text-white/70">
                Vigência até{" "}
                {format(new Date(data.periodEnd), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-5 flex items-end justify-between gap-3">
          <span
            className={`badge ${data.valid ? "badge-green" : "badge-yellow"}`}
          >
            {data.valid ? "Válido" : data.statusLabel}
          </span>
          <div className="rounded-md bg-white p-2 shadow">
            <QRCodeSVG
              value={data.verifyUrl}
              size={72}
              level="M"
              includeMargin={false}
              aria-label={`QR Code de verificação ${data.memberCode}`}
            />
          </div>
        </div>

        <p className="relative mt-3 text-[10px] text-white/50">
          Escaneie o QR para validar a situação do sócio com o clube.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-primary !py-2.5 !px-4 text-sm"
          onClick={downloadPng}
          disabled={!!busy}
        >
          {busy === "png" ? "Gerando PNG..." : "Baixar PNG"}
        </button>
        <button
          type="button"
          className="btn btn-secondary !py-2.5 !px-4 text-sm"
          onClick={downloadPdf}
          disabled={!!busy}
        >
          {busy === "pdf" ? "Gerando PDF..." : "Baixar PDF"}
        </button>
      </div>
      {error && <p className="text-sm text-tf-red">{error}</p>}
      {!data.photoUrl && (
        <p className="text-sm text-tf-muted">
          Adicione sua foto em{" "}
          <a href="/area/cadastro" className="text-white underline">
            Meu cadastro
          </a>{" "}
          para completar a carteirinha.
        </p>
      )}
    </div>
  );
}
