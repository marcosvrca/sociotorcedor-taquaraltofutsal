import type { Payment } from "@prisma/client";
import type {
  CreateChargeInput,
  CreateChargeResult,
  PaymentProvider,
} from "./types";

function onlyAlnumSpace(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim();
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/** CRC16-CCITT (0xFFFF) usado no BR Code PIX. */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Gera payload EMV (BR Code) estático/dinâmico com valor —
 * legível por apps bancários no copia-e-cola / QR Code.
 */
export function buildPixEmvPayload(input: CreateChargeInput): string {
  const key = input.pixKey.trim();
  const name = onlyAlnumSpace(input.pixHolder).slice(0, 25) || "TAQUARALTO FUTSAL";
  const city = onlyAlnumSpace(input.pixCity || "PALMAS").slice(0, 15) || "PALMAS";
  const amount = (input.amountCents / 100).toFixed(2);
  const txid = onlyAlnumSpace(input.txid || `TF${Date.now()}`)
    .replace(/\s+/g, "")
    .slice(0, 25) || "***";

  let merchantAccount = tlv("00", "br.gov.bcb.pix") + tlv("01", key);
  const desc = input.description?.trim();
  if (desc) {
    const cleanDesc = onlyAlnumSpace(desc).slice(0, 72);
    if (cleanDesc) merchantAccount += tlv("02", cleanDesc);
  }

  let payload = "";
  payload += tlv("00", "01"); // Payload Format Indicator
  payload += tlv("26", merchantAccount);
  payload += tlv("52", "0000"); // MCC
  payload += tlv("53", "986"); // BRL
  payload += tlv("54", amount);
  payload += tlv("58", "BR");
  payload += tlv("59", name);
  payload += tlv("60", city);
  payload += tlv("62", tlv("05", txid));
  payload += "6304";
  payload += crc16(payload);
  return payload;
}

export function resolvePixPayload(input: {
  pixPayload?: string | null;
  amountCents: number;
  description?: string | null;
  pixKey?: string | null;
  pixHolder?: string | null;
  pixCity?: string | null;
  txid?: string | null;
}) {
  if (input.pixPayload) return input.pixPayload;
  const pixKey = input.pixKey?.trim();
  if (!pixKey || input.amountCents <= 0) return null;
  return buildPixEmvPayload({
    amountCents: input.amountCents,
    description: input.description || "Pagamento Taquaralto Futsal",
    pixKey,
    pixHolder: input.pixHolder || "Taquaralto Futsal",
    pixCity: input.pixCity || "Palmas",
    txid: input.txid || undefined,
  });
}

export class PixManualProvider implements PaymentProvider {
  readonly name = "PIX_MANUAL" as const;

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    return {
      provider: "PIX_MANUAL",
      pixKey: input.pixKey,
      pixPayload: buildPixEmvPayload(input),
      status: "PENDING",
      externalId: `pix_${Date.now()}`,
    };
  }

  async getStatus(payment: Payment) {
    return payment.status;
  }

  async confirmManual(_payment: Payment) {
    void _payment;
    return "PAID" as const;
  }
}
