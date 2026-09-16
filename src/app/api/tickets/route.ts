import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTicketCode } from "@/lib/club";
import { getPixProvider } from "@/lib/payments";

const schema = z.object({
  matchId: z.string().min(1),
  buyerName: z.string().min(2),
  buyerEmail: z.union([z.string().email(), z.literal("")]).optional(),
  buyerPhone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = schema.parse(await req.json());

    const match = await prisma.match.findFirst({
      where: {
        id: body.matchId,
        active: true,
        ticketsOnSale: true,
        ticketMode: "ONLINE",
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Jogo não disponível para compra online." },
        { status: 404 }
      );
    }

    const amountCents = match.ticketPriceCents ?? 0;
    const code = generateTicketCode();

    if (amountCents <= 0) {
      const ticket = await prisma.ticket.create({
        data: {
          matchId: match.id,
          userId: session?.user?.id || null,
          buyerName: body.buyerName,
          buyerEmail: body.buyerEmail || session?.user?.email || null,
          buyerPhone: body.buyerPhone || null,
          code,
          status: "PAID",
          amountCents: 0,
          paidAt: new Date(),
          confirmedAt: new Date(),
        },
      });
      return NextResponse.json({
        ok: true,
        ticketId: ticket.id,
        code: ticket.code,
        free: true,
      });
    }

    const settings = await prisma.setting.findMany({
      where: { key: { in: ["pix_key", "pix_holder", "pix_city"] } },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const description = `Ingresso ${match.opponent} - ${code}`;

    const charge = await getPixProvider().createCharge({
      amountCents,
      description,
      payerEmail: body.buyerEmail || session?.user?.email || undefined,
      payerName: body.buyerName,
      pixKey: map.pix_key || "taquaraltofutsal@gmail.com",
      pixHolder: map.pix_holder || "Taquaralto Futsal",
      pixCity: map.pix_city || "Palmas",
      txid: code.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25),
    });

    const ticket = await prisma.ticket.create({
      data: {
        matchId: match.id,
        userId: session?.user?.id || null,
        buyerName: body.buyerName,
        buyerEmail: body.buyerEmail || session?.user?.email || null,
        buyerPhone: body.buyerPhone || null,
        code,
        status: "PENDING",
        amountCents,
        pixPayload: charge.pixPayload,
        pixKey: charge.pixKey,
      },
    });

    return NextResponse.json({
      ok: true,
      ticketId: ticket.id,
      code: ticket.code,
      free: false,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao criar ingresso." },
      { status: 500 }
    );
  }
}
