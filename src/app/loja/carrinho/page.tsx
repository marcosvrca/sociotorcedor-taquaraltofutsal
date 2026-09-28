import { getServerSession } from "next-auth";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { CartView } from "@/components/cart-view";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CarrinhoPage() {
  const session = await getServerSession(authOptions);
  let member = false;
  if (session?.user) {
    const sub = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    member = sub?.status === "ACTIVE";
  }

  return (
    <div className="min-h-screen">
      <div className="hero-grid relative pb-8 pt-[calc(8.5rem+env(safe-area-inset-top))] court-lines sm:pt-40">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h1 className="font-display text-5xl text-white sm:text-6xl">Sacola</h1>
        </div>
      </div>
      <section className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <CartView member={member} />
      </section>
      <SiteFooter />
    </div>
  );
}
