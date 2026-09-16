import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/env";
import { MembershipCard } from "@/components/membership-card";
import {
  isMembershipValid,
  membershipStatusLabel,
} from "@/lib/membership";

export const dynamic = "force-dynamic";

export default async function CarteirinhaPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: { include: { plan: true } } },
  });

  const baseUrl = getAppUrl();
  const memberCode = user?.memberCode || "TF-0000";
  const valid = isMembershipValid(user?.subscription);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="font-display text-4xl text-white">Carteirinha digital</h1>
      <p className="text-tf-muted">
        Apresente esta tela nos jogos e pontos parceiros. Use o QR Code para
        conferir se o sócio está em dia com o clube.
      </p>

      <MembershipCard
        data={{
          name: user?.name || "Sócio",
          memberCode,
          planName: user?.subscription?.plan.name || "—",
          photoUrl: user?.photoUrl || null,
          valid,
          statusLabel: membershipStatusLabel(user?.subscription),
          periodEnd: user?.subscription?.currentPeriodEnd?.toISOString() || null,
          verifyUrl: `${baseUrl}/verificar/${encodeURIComponent(memberCode)}`,
        }}
      />
    </div>
  );
}
