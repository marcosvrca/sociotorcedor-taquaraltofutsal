import type { Payment } from "@prisma/client";
import type {
  CreateChargeInput,
  CreateChargeResult,
  PaymentProvider,
} from "./types";
import { MP_UNAVAILABLE_MESSAGE } from "./types";
import { getAppUrl } from "@/lib/env";

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MP_ACCESS_TOKEN?.trim());
}

type MpPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
  error?: string;
};

/**
 * Checkout Pro (cartão e demais meios no ambiente do Mercado Pago).
 * Requer MP_ACCESS_TOKEN. Sem token, lança erro com mensagem amigável.
 */
export class MercadoPagoProvider implements PaymentProvider {
  readonly name = "MERCADO_PAGO" as const;

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    const token = process.env.MP_ACCESS_TOKEN?.trim();
    if (!token) {
      throw new Error(MP_UNAVAILABLE_MESSAGE);
    }

    const unitPrice = Number((input.amountCents / 100).toFixed(2));
    const baseUrl = input.backUrls?.success
      ? new URL(input.backUrls.success).origin
      : getAppUrl();

    const body: Record<string, unknown> = {
      items: [
        {
          title: input.description.slice(0, 250),
          quantity: 1,
          currency_id: "BRL",
          unit_price: unitPrice,
        },
      ],
      payer: {
        email: input.payerEmail,
        name: input.payerName,
      },
      external_reference: input.externalReference,
      statement_descriptor: "TAQUARALTO FUTSAL",
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }],
        installments: 12,
      },
    };

    // back_urls só com HTTPS público (MP rejeita localhost/http)
    const success = input.backUrls?.success || `${baseUrl}/area/pagamentos?mp=success`;
    if (success.startsWith("https://")) {
      body.back_urls = {
        success,
        failure: input.backUrls?.failure || `${baseUrl}/area/pagamentos?mp=failure`,
        pending: input.backUrls?.pending || `${baseUrl}/area/pagamentos?mp=pending`,
      };
      body.auto_return = "approved";
    }

    if (input.notificationUrl?.startsWith("https://")) {
      body.notification_url = input.notificationUrl;
    }

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as MpPreferenceResponse;

    if (!res.ok || !data.id) {
      console.error("Mercado Pago preference error:", data);
      throw new Error(MP_UNAVAILABLE_MESSAGE);
    }

    const checkoutUrl =
      process.env.MP_USE_SANDBOX === "true"
        ? data.sandbox_init_point || data.init_point
        : data.init_point || data.sandbox_init_point;

    if (!checkoutUrl) {
      throw new Error(MP_UNAVAILABLE_MESSAGE);
    }

    return {
      provider: "MERCADO_PAGO",
      externalId: data.id,
      checkoutUrl,
      status: "PENDING",
    };
  }

  async getStatus(payment: Payment): Promise<Payment["status"]> {
    const token = process.env.MP_ACCESS_TOKEN?.trim();
    if (!token || !payment.externalId) return payment.status;

    // Preferência não é o payment id; webhook/consulta usa payment id do MP
    if (!/^\d+$/.test(payment.externalId)) {
      return payment.status;
    }

    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${payment.externalId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return payment.status;
    const data = (await res.json()) as { status?: string };
    if (data.status === "approved") return "PAID";
    if (data.status === "rejected" || data.status === "cancelled") {
      return "REJECTED";
    }
    if (data.status === "pending" || data.status === "in_process") {
      return "AWAITING_CONFIRMATION";
    }
    return payment.status;
  }

  async confirmManual(_payment: Payment): Promise<Payment["status"]> {
    void _payment;
    throw new Error(
      "Confirmação manual não se aplica ao Mercado Pago — use webhooks."
    );
  }
}
