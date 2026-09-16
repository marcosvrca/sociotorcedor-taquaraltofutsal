import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/storage";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function parseMatchForm(form: FormData) {
  const ticketMode = String(form.get("ticketMode") || "PHYSICAL");
  return {
    opponent: String(form.get("opponent") || "").trim(),
    competition: String(form.get("competition") || "").trim() || null,
    round: String(form.get("round") || "").trim() || null,
    venue: String(form.get("venue") || "").trim() || null,
    dateTime: String(form.get("dateTime") || ""),
    isHome: form.get("isHome") === "on",
    ticketMode: ticketMode === "ONLINE" ? ("ONLINE" as const) : ("PHYSICAL" as const),
    whatsappUrl: String(form.get("whatsappUrl") || "").trim() || null,
    ticketPriceReais: String(form.get("ticketPriceReais") || "").trim(),
    availableFor: String(form.get("availableFor") || "").trim() || null,
    ticketsOnSale: form.get("ticketsOnSale") === "on",
    active: form.get("active") === "on",
    logo: form.get("opponentLogo"),
  };
}

const fieldsSchema = z.object({
  opponent: z.string().min(2),
  competition: z.string().nullable(),
  round: z.string().nullable(),
  venue: z.string().nullable(),
  dateTime: z.string().min(1),
  isHome: z.boolean(),
  ticketMode: z.enum(["ONLINE", "PHYSICAL"]),
  whatsappUrl: z.string().nullable(),
  ticketPriceReais: z.string(),
  availableFor: z.string().nullable(),
  ticketsOnSale: z.boolean(),
  active: z.boolean(),
});

async function saveOpponentLogo(file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Logo deve ser JPG, PNG ou WEBP.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Logo deve ter no máximo 5 MB.");
  }
  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  return saveUpload(
    "opponents",
    `opp-${Date.now()}.${ext}`,
    Buffer.from(await file.arrayBuffer())
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const raw = parseMatchForm(form);
    const data = fieldsSchema.parse(raw);
    const dateTime = new Date(data.dateTime);
    if (Number.isNaN(dateTime.getTime())) {
      return NextResponse.json({ error: "Data/hora inválida." }, { status: 400 });
    }

    if (data.ticketMode === "PHYSICAL" && !data.whatsappUrl) {
      return NextResponse.json(
        { error: "Informe o link do WhatsApp para ingresso físico." },
        { status: 400 }
      );
    }

    let opponentLogoUrl: string | null = null;
    if (raw.logo instanceof File && raw.logo.size > 0) {
      opponentLogoUrl = await saveOpponentLogo(raw.logo);
    }

    const price =
      data.ticketMode === "ONLINE" && data.ticketPriceReais
        ? Math.round(Number(data.ticketPriceReais) * 100)
        : null;

    const match = await prisma.match.create({
      data: {
        opponent: data.opponent,
        competition: data.competition,
        round: data.round,
        venue: data.venue,
        dateTime,
        isHome: data.isHome,
        opponentLogoUrl,
        ticketMode: data.ticketMode,
        whatsappUrl: data.whatsappUrl,
        ticketPriceCents: Number.isFinite(price) ? price : null,
        availableFor: data.availableFor,
        ticketsOnSale: data.ticketsOnSale,
        active: data.active,
      },
    });

    return NextResponse.json({ ok: true, id: match.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
