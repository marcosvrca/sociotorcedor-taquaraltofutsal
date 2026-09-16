import type { SubscriptionStatus } from "@prisma/client";

export type MembershipSnapshot = {
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
};

export function isMembershipValid(sub: MembershipSnapshot | null | undefined) {
  if (!sub || sub.status !== "ACTIVE") return false;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) return false;
  return true;
}

export function membershipStatusLabel(
  sub: MembershipSnapshot | null | undefined
) {
  if (!sub) return "Sem plano";
  if (isMembershipValid(sub)) return "Adimplente";
  if (sub.status === "ACTIVE" && sub.currentPeriodEnd) return "Vencido";
  if (sub.status === "PENDING") return "Aguardando pagamento";
  if (sub.status === "PAST_DUE") return "Em atraso";
  if (sub.status === "CANCELLED") return "Cancelado";
  return sub.status;
}

export function membershipBadgeClass(
  sub: MembershipSnapshot | null | undefined
) {
  if (isMembershipValid(sub)) return "badge-green";
  if (sub?.status === "PENDING") return "badge-yellow";
  return "badge-red";
}
