import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { CheckoutForm } from "@/components/checkout-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMercadoPagoConfigured } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/loja/checkout");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });
  if (!user) redirect("/login?callbackUrl=/loja/checkout");

  return (
    <div className="min-h-screen">
      <div className="hero-grid relative pb-8 pt-[calc(8.5rem+env(safe-area-inset-top))] court-lines sm:pt-40">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h1 className="font-display text-5xl text-white sm:text-6xl">Checkout</h1>
          <p className="mt-2 text-tf-muted">Pedido de {user.name}</p>
        </div>
      </div>
      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <CheckoutForm
          member={user.subscription?.status === "ACTIVE"}
          cardAvailable={isMercadoPagoConfigured()}
          defaults={{
            address: user.address || "",
            city: user.city || "Palmas",
            state: user.state || "TO",
            zipCode: user.zipCode || "",
            phone: user.phone || "",
          }}
        />
      </section>
      <SiteFooter />
    </div>
  );
}
