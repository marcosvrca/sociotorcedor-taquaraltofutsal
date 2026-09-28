import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/env";
import {
  cardPaymentUnavailableError,
  getCardProvider,
  getPixProvider,
  isMercadoPagoConfigured,
  MP_UNAVAILABLE_MESSAGE,
} from "@/lib/payments";
import {
  generateOrderCode,
  getPixSettings,
  parseSizes,
  restoreOrderStock,
  unitPriceCents,
} from "@/lib/store";

const schema = z.object({
  method: z.enum(["PIX", "CARD"]).default("PIX"),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2).max(20),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().max(300).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        size: z.string().nullable().optional(),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .min(1)
    .max(20),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Entre na sua conta para finalizar." }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const method = body.method;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Conta não encontrada." }, { status: 401 });
    }

    const member = user.subscription?.status === "ACTIVE";
    const lines: {
      productId: string;
      name: string;
      size: string | null;
      quantity: number;
      unitPriceCents: number;
    }[] = [];

    for (const item of body.items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, active: true },
      });
      if (!product) {
        return NextResponse.json(
          { error: "Um produto da sacola não está mais disponível." },
          { status: 400 }
        );
      }
      const sizes = parseSizes(product.sizes);
      const size = item.size?.trim().toUpperCase() || null;
      if (sizes.length && (!size || !sizes.includes(size))) {
        return NextResponse.json(
          { error: `Escolha o tamanho de ${product.name}.` },
          { status: 400 }
        );
      }
      if (!sizes.length && size) {
        return NextResponse.json(
          { error: `${product.name} não usa tamanho.` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente de ${product.name}.` },
          { status: 400 }
        );
      }
      lines.push({
        productId: product.id,
        name: product.name,
        size: sizes.length ? size : null,
        quantity: item.quantity,
        unitPriceCents: unitPriceCents(product, member),
      });
    }

    const amountCents = lines.reduce(
      (total, line) => total + line.unitPriceCents * line.quantity,
      0
    );
    const code = generateOrderCode();
    const pix = await getPixSettings();

    const order = await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const reserved = await tx.product.updateMany({
          where: { id: line.productId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (reserved.count !== 1) {
          throw new Error(`Estoque insuficiente de ${line.name}.`);
        }
      }

      return tx.order.create({
        data: {
          userId: user.id,
          code,
          status: "PENDING",
          amountCents,
          method,
          provider: method === "CARD" ? "MERCADO_PAGO" : "PIX_MANUAL",
          buyerName: user.name,
          buyerEmail: user.email,
          buyerPhone: body.phone || user.phone,
          address: body.address.trim(),
          city: body.city.trim(),
          state: body.state.trim().toUpperCase(),
          zipCode: body.zipCode?.trim() || null,
          notes: body.notes?.trim() || null,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              name: line.name,
              size: line.size,
              quantity: line.quantity,
              unitPriceCents: line.unitPriceCents,
            })),
          },
        },
      });
    });

    if (method === "CARD") {
      if (!isMercadoPagoConfigured()) {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        await restoreOrderStock(order.id);
        return NextResponse.json(cardPaymentUnavailableError(), { status: 503 });
      }

      const baseUrl = getAppUrl();
      try {
        const charge = await getCardProvider().createCharge({
          amountCents,
          description: `Loja ${code}`,
          payerEmail: user.email,
          payerName: user.name,
          pixKey: pix.pixKey,
          pixHolder: pix.pixHolder,
          pixCity: pix.pixCity,
          externalReference: `order:${order.id}`,
          backUrls: {
            success: `${baseUrl}/loja/pedido/${code}?mp=success`,
            failure: `${baseUrl}/loja/pedido/${code}?mp=failure`,
            pending: `${baseUrl}/loja/pedido/${code}?mp=pending`,
          },
          notificationUrl: `${baseUrl}/api/webhooks/mercadopago`,
        });

        await prisma.order.update({
          where: { id: order.id },
          data: {
            externalId: charge.externalId,
            checkoutUrl: charge.checkoutUrl,
          },
        });

        return NextResponse.json({
          ok: true,
          code,
          method: "CARD",
          checkoutUrl: charge.checkoutUrl,
        });
      } catch (err) {
        console.error(err);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        await restoreOrderStock(order.id);
        return NextResponse.json(
          { error: MP_UNAVAILABLE_MESSAGE, code: "MP_UNAVAILABLE", fallback: "PIX" },
          { status: 503 }
        );
      }
    }

    let charge;
    try {
      charge = await getPixProvider().createCharge({
        amountCents,
        description: `Loja ${code}`,
        payerEmail: user.email,
        payerName: user.name,
        pixKey: pix.pixKey,
        pixHolder: pix.pixHolder,
        pixCity: pix.pixCity,
        txid: code.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25),
      });
    } catch (err) {
      console.error(err);
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      await restoreOrderStock(order.id);
      return NextResponse.json(
        { error: "Não foi possível gerar o PIX. Tente de novo." },
        { status: 500 }
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        pixPayload: charge.pixPayload,
        pixKey: charge.pixKey,
        externalId: charge.externalId,
      },
    });

    return NextResponse.json({ ok: true, code, method: "PIX" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Erro ao criar pedido.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
