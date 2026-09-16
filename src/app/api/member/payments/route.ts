import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { method?: string };
  const method = (body.method || "PIX").toUpperCase() === "CARD" ? "CARD" : "PIX";

  const sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true, payments: true },
  });
  if (!sub) {
    return NextResponse.json(
      { error: "Assinatura não encontrada." },
      { status: 404 }
    );
  }

  const open = sub.payments.find(
    (p) => p.status === "PENDING" || p.status === "AWAITING_CONFIRMATION"
  );
  if (open) {
    return NextResponse.json(
      { error: "Já existe uma cobrança em aberto." },
      { status: 400 }
    );
  }

  const settings = await prisma.setting.findMany({
    where: { key: { in: ["pix_key", "pix_holder", "pix_city"] } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const description = `Mensalidade ${sub.plan.name} - Socio Torcedor`;
  const baseUrl = getAppUrl();
  const pixKey = map.pix_key || "taquaraltofutsal@gmail.com";
  const pixHolder = map.pix_holder || "Taquaralto Futsal";
  const pixCity = map.pix_city || "Palmas";

  const due = new Date();
  due.setDate(due.getDate() + 3);

  if (method === "CARD") {
    if (!isMercadoPagoConfigured()) {
      return NextResponse.json(cardPaymentUnavailableError(), { status: 503 });
    }

    const payment = await prisma.payment.create({
      data: {
        subscriptionId: sub.id,
        amountCents: sub.plan.priceCents,
        status: "PENDING",
        provider: "MERCADO_PAGO",
        method: "CARD",
        description: `Mensalidade ${sub.plan.name} (Cartão)`,
        dueDate: due,
      },
    });

    try {
      const charge = await getCardProvider().createCharge({
        amountCents: sub.plan.priceCents,
        description,
        payerEmail: session.user.email || undefined,
        payerName: session.user.name || undefined,
        pixKey,
        pixHolder,
        pixCity,
        externalReference: payment.id,
        backUrls: {
          success: `${baseUrl}/area/pagamentos?mp=success&paymentId=${payment.id}`,
          failure: `${baseUrl}/area/pagamentos?mp=failure&paymentId=${payment.id}`,
          pending: `${baseUrl}/area/pagamentos?mp=pending&paymentId=${payment.id}`,
        },
        notificationUrl: `${baseUrl}/api/webhooks/mercadopago`,
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalId: charge.externalId,
          checkoutUrl: charge.checkoutUrl,
        },
      });

      return NextResponse.json({
        ok: true,
        paymentId: payment.id,
        method: "CARD",
        checkoutUrl: charge.checkoutUrl,
      });
    } catch (err) {
      console.error(err);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json(
        {
          error: MP_UNAVAILABLE_MESSAGE,
          code: "MP_UNAVAILABLE",
          fallback: "PIX",
        },
        { status: 503 }
      );
    }
  }

  const charge = await getPixProvider().createCharge({
    amountCents: sub.plan.priceCents,
    description,
    payerEmail: session.user.email || undefined,
    payerName: session.user.name || undefined,
    pixKey,
    pixHolder,
    pixCity,
  });

  const payment = await prisma.payment.create({
    data: {
      subscriptionId: sub.id,
      amountCents: sub.plan.priceCents,
      status: "PENDING",
      provider: "PIX_MANUAL",
      method: "PIX",
      externalId: charge.externalId,
      pixPayload: charge.pixPayload,
      pixKey: charge.pixKey,
      description: `Mensalidade ${sub.plan.name} (PIX)`,
      dueDate: due,
    },
  });

  return NextResponse.json({
    ok: true,
    paymentId: payment.id,
    method: "PIX",
  });
}
