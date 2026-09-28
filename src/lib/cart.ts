export type CartLine = {
  productId: string;
  name: string;
  size: string | null;
  quantity: number;
  priceCents: number;
  memberPriceCents: number | null;
  imageUrl: string | null;
};

const KEY = "tf-loja-cart";

export function cartLineKey(line: Pick<CartLine, "productId" | "size">) {
  return `${line.productId}:${line.size || ""}`;
}

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line) => line.productId && line.quantity > 0 && line.name
    );
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("tf-cart"));
}

export function clearCart() {
  writeCart([]);
}

export function addToCart(line: CartLine) {
  const lines = readCart();
  const key = cartLineKey(line);
  const existing = lines.find((item) => cartLineKey(item) === key);
  if (existing) {
    existing.quantity += line.quantity;
    existing.priceCents = line.priceCents;
    existing.memberPriceCents = line.memberPriceCents;
    existing.name = line.name;
    existing.imageUrl = line.imageUrl;
  } else {
    lines.push(line);
  }
  writeCart(lines);
}

export function cartCount(lines = readCart()) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function linePrice(
  line: Pick<CartLine, "priceCents" | "memberPriceCents">,
  member: boolean
) {
  if (member && line.memberPriceCents != null) return line.memberPriceCents;
  return line.priceCents;
}
