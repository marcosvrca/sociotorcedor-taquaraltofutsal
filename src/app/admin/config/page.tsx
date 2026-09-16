import { prisma } from "@/lib/prisma";
import { PixConfigForm } from "@/components/pix-config-form";
import { isMercadoPagoConfigured } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ["pix_key", "pix_holder", "pix_city", "payment_provider"],
      },
    },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const mpOk = isMercadoPagoConfigured();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-4xl text-white">PIX / Config</h1>
      <p className="text-tf-muted">
        Chave PIX para cobranças manuais. Cartão usa o token do Mercado Pago no
        arquivo <code className="text-white">.env</code>.
      </p>

      <div
        className={`panel p-4 text-sm ${
          mpOk
            ? "border-green-500/30 text-green-200"
            : "border-yellow-500/30 text-yellow-200"
        }`}
      >
        <p className="font-semibold">
          Mercado Pago (cartão): {mpOk ? "configurado" : "não configurado"}
        </p>
        <p className="mt-1 opacity-90">
          {mpOk
            ? "O botão “Pagar com cartão” redireciona ao Checkout Pro."
            : "Sem MP_ACCESS_TOKEN o sistema exibe a mensagem pedindo pagamento via PIX."}
        </p>
        <p className="mt-2 text-xs opacity-80">
          Defina no .env: MP_ACCESS_TOKEN e, opcionalmente, MP_PUBLIC_KEY /
          MP_USE_SANDBOX=true
        </p>
      </div>

      <PixConfigForm
        initial={{
          pix_key: map.pix_key || "",
          pix_holder: map.pix_holder || "",
          pix_city: map.pix_city || "Palmas",
          payment_provider: mpOk ? "MERCADO_PAGO + PIX" : "PIX_MANUAL",
        }}
      />
    </div>
  );
}
