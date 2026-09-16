/** Evita open redirect no login (uso em client e server). */
export function safeCallbackUrl(url: string | null | undefined): string {
  if (!url) return "/area";
  if (!url.startsWith("/") || url.startsWith("//")) return "/area";
  if (url.includes("://")) return "/area";
  return url;
}
