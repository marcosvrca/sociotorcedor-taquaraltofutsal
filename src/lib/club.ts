export const club = {
  name: "Taquaralto Futsal",
  city: "Palmas",
  state: "TO",
  fullLocation: "Palmas, Tocantins",
  email: "taquaraltofutsal@gmail.com",
  instagram: "https://instagram.com/taquaraltofutsal",
  instagramHandle: "@taquaraltofutsal",
  youtube: "https://youtube.com/@taquaraltofutsal",
  youtubeHandle: "@taquaraltofutsal",
  programName: "Sócio Torcedor",
} as const;

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function generateMemberCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TF-${n}${Date.now().toString().slice(-3)}`;
}

export function generateTicketCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `IG-${n}${Date.now().toString().slice(-4)}`;
}
