import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile-form";
import { MemberPhotoUpload } from "@/components/member-photo-upload";

export const dynamic = "force-dynamic";

export default async function CadastroAreaPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-4xl text-white">Meu cadastro</h1>
      <p className="text-tf-muted">
        Atualize seus dados sempre que necessário. O e-mail é usado para login.
      </p>
      <MemberPhotoUpload photoUrl={user.photoUrl} name={user.name} />
      <ProfileForm
        user={{
          name: user.name,
          email: user.email,
          cpf: user.cpf || "",
          phone: user.phone || "",
          address: user.address || "",
          city: user.city || "Palmas",
          state: user.state || "TO",
          zipCode: user.zipCode || "",
        }}
      />
    </div>
  );
}
