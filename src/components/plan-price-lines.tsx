import { formatBRL } from "@/lib/club";
import { applyPercent } from "@/lib/pricing";

type PlanDiscount = {
  name: string;
  productDiscountPercent: number;
};

export function PlanPriceLines({
  priceCents,
  plans,
  prominent = false,
}: {
  priceCents: number;
  plans: PlanDiscount[];
  prominent?: boolean;
}) {
  if (priceCents <= 0) {
    return <p className="text-sm text-tf-muted">Preço em definição</p>;
  }

  const discounted = plans.filter((plan) => plan.productDiscountPercent > 0);

  return (
    <div>
      <p className={prominent ? "font-display text-4xl text-white" : "text-white"}>
        {formatBRL(priceCents)}
      </p>
      {discounted.map((plan) => (
        <p key={plan.name} className="text-sm text-green-400">
          {plan.name}: {formatBRL(applyPercent(priceCents, plan.productDiscountPercent))} (
          {plan.productDiscountPercent}%)
        </p>
      ))}
    </div>
  );
}
