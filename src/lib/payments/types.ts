import type {
  Payment,
  PaymentProviderType,
  PaymentStatus,
} from "@prisma/client";

export const MP_UNAVAILABLE_MESSAGE =
  "Infelizmente estamos com problemas com esta forma de pagamento, por favor faça o pagamento via pix";

export type CreateChargeInput = {
  amountCents: number;
  description: string;
  payerEmail?: string;
  payerName?: string;
  pixKey: string;
  pixHolder: string;
  /** Cidade do recebedor no BR Code (máx. 15). */
  pixCity?: string;
  /** Identificador da transação no campo 62.05 (máx. 25). */
  txid?: string;
  externalReference?: string;
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
  notificationUrl?: string;
};

export type CreateChargeResult = {
  provider: PaymentProviderType;
  externalId?: string;
  pixPayload?: string;
  pixKey?: string;
  checkoutUrl?: string;
  status: PaymentStatus;
};

export interface PaymentProvider {
  readonly name: PaymentProviderType;
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
  getStatus(payment: Payment): Promise<PaymentStatus>;
  confirmManual(payment: Payment): Promise<PaymentStatus>;
}
