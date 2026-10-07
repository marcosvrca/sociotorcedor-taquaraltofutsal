import { getServerSession } from "next-auth";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { CartView } from "@/components/cart-view";
import { authOptions } from "@/lib/auth";
import { getMemberOffer } from "@/lib/member-offer";

export const dynamic = "force-dynamic";

export default async function CarrinhoPage() {
  const session = await getServerSession(authOptions);
  const offer = await getMemberOffer(session?.user?.id);

  return (
    <div className="min-h-screen">
      <div className="hero-grid relative pb-8 pt-[calc(8.5rem+env(safe-area-inset-top))] court-lines sm:pt-40">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h1 className="font-display text-5xl text-white sm:text-6xl">Sacola</h1>
        </div>
      </div>
      <section className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <CartView
          member={offer.member}
          productDiscountPercent={offer.productDiscountPercent}
          planName={offer.planName}
        />
      </section>
      <SiteFooter />
    </div>
  );
}
