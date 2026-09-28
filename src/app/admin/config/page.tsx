import { prisma } from "@/lib/prisma";
import { PixConfigForm } from "@/components/pix-config-form";

export const dynamic = "force-dynamic";

export default async function AdminConfigPage() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ["pix_key", "pix_holder", "pix_city"],
      },
    },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-4xl text-white">PIX</h1>
      <p className="text-tf-muted">
        Chave usada nas cobranças de mensalidade, ingressos e loja.
      </p>

      <PixConfigForm
        initial={{
          pix_key: map.pix_key || "",
          pix_holder: map.pix_holder || "",
          pix_city: map.pix_city || "Palmas",
        }}
      />
    </div>
  );
}
