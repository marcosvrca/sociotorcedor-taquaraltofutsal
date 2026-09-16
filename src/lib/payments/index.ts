import { PixManualProvider } from "./pix-manual";
import { MercadoPagoProvider, isMercadoPagoConfigured } from "./mercado-pago";
import type { PaymentProvider } from "./types";
import { MP_UNAVAILABLE_MESSAGE } from "./types";

export type {
  PaymentProvider,
  CreateChargeInput,
  CreateChargeResult,
} from "./types";
export { PixManualProvider } from "./pix-manual";
export { MercadoPagoProvider, isMercadoPagoConfigured } from "./mercado-pago";
export { MP_UNAVAILABLE_MESSAGE } from "./types";

export function getPixProvider(): PaymentProvider {
  return new PixManualProvider();
}

export function getCardProvider(): PaymentProvider {
  return new MercadoPagoProvider();
}

/** @deprecated Prefer getPixProvider / getCardProvider */
export function getPaymentProvider(): PaymentProvider {
  const mode = (process.env.PAYMENT_PROVIDER || "PIX_MANUAL").toUpperCase();
  if (mode === "MERCADO_PAGO" && isMercadoPagoConfigured()) {
    return new MercadoPagoProvider();
  }
  return new PixManualProvider();
}

export function cardPaymentUnavailableError() {
  return {
    error: MP_UNAVAILABLE_MESSAGE,
    code: "MP_UNAVAILABLE" as const,
    fallback: "PIX" as const,
  };
}
