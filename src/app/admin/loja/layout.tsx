import { StoreAdminNav } from "@/components/store-admin-nav";

export default function LojaAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tf-red">
          Módulo
        </p>
        <h1 className="font-display text-4xl text-white">Loja do clube</h1>
      </div>
      <StoreAdminNav />
      {children}
    </div>
  );
}
