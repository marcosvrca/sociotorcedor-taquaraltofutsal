import { prisma } from "@/lib/prisma";
import { isMembershipValid } from "@/lib/membership";

export type MemberOffer = {
  member: boolean;
  planName: string | null;
  productDiscountPercent: number;
  ticketDiscountPercent: number;
  partnerDiscountPercent: number;
};

const emptyOffer: MemberOffer = {
  member: false,
  planName: null,
  productDiscountPercent: 0,
  ticketDiscountPercent: 0,
  partnerDiscountPercent: 0,
};

export async function getMemberOffer(
  userId: string | null | undefined
): Promise<MemberOffer> {
  if (!userId) return emptyOffer;
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });
  if (!sub || !isMembershipValid(sub)) return emptyOffer;
  return {
    member: true,
    planName: sub.plan.name,
    productDiscountPercent: sub.plan.productDiscountPercent,
    ticketDiscountPercent: sub.plan.ticketDiscountPercent,
    partnerDiscountPercent: sub.plan.partnerDiscountPercent,
  };
}
