import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { restoreOrderStock } from "@/lib/store";

type MpPayment = {
  id?: number;
  status?: string;
  external_reference?: string;
};

async function fetchMpPayment(paymentId: string) {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  if (!token) return null;
  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return null;
  return (await res.json()) as MpPayment;
}

async function applyOrderStatus(orderId: string, mp: MpPayment) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (
    order.status === "PAID" ||
    order.status === "FULFILLED" ||
    order.status === "CANCELLED" ||
    order.status === "REJECTED"
  ) {
    return;
  }

  if (mp.status === "approved") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: order.paidAt || new Date(),
        confirmedAt: new Date(),
        externalId: String(mp.id || order.externalId),
      },
    });
    return;
  }

  if (mp.status === "rejected" || mp.status === "cancelled") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "REJECTED",
        externalId: String(mp.id || order.externalId),
      },
    });
    await restoreOrderStock(order.id);
    return;
  }

  if (mp.status === "pending" || mp.status === "in_process") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "AWAITING_CONFIRMATION",
        externalId: String(mp.id || order.externalId),
      },
    });
  }
}

async function applyMpStatus(mp: MpPayment) {
  if (!mp.external_reference) return;
  if (mp.external_reference.startsWith("order:")) {
    await applyOrderStatus(mp.external_reference.slice("order:".length), mp);
    return;
  }

  const payment = await prisma.payment.findUnique({
    where: { id: mp.external_reference },
  });
  if (!payment) return;

  if (mp.status === "approved") {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
          confirmedAt: new Date(),
          externalId: String(mp.id || payment.externalId),
        },
      }),
      prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: "ACTIVE", currentPeriodEnd: periodEnd },
      }),
    ]);
    return;
  }

  if (mp.status === "rejected" || mp.status === "cancelled") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REJECTED", externalId: String(mp.id || payment.externalId) },
    });
  } else if (mp.status === "pending" || mp.status === "in_process") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "AWAITING_CONFIRMATION",
        externalId: String(mp.id || payment.externalId),
      },
    });
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const id =
      url.searchParams.get("id") || url.searchParams.get("data.id");

    let body: { type?: string; data?: { id?: string }; action?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const paymentId =
      id ||
      body.data?.id ||
      (topic === "payment" ? url.searchParams.get("id") : null);

    if (paymentId && (topic === "payment" || body.type === "payment" || body.action?.includes("payment") || !topic)) {
      const mp = await fetchMpPayment(String(paymentId));
      if (mp) await applyMpStatus(mp);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("MP webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
