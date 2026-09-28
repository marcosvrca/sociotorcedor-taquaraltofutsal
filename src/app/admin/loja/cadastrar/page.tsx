import { ProductCreateForm } from "@/components/product-admin-form";

export default function AdminCadastrarProdutoPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl text-white">Cadastrar produto</h2>
        <p className="mt-1 text-sm text-tf-muted">
          Depois de salvar, o item aparece na lista de produtos.
        </p>
      </div>
      <ProductCreateForm />
    </div>
  );
}
