import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";

/**
 * Uploads persistentes.
 * - Local: ./uploads (ou UPLOAD_DIR)
 * - Railway: monte um Volume em /data e defina UPLOAD_DIR=/data/uploads
 * URLs públicas sempre via /api/uploads/...
 */
export function getUploadRoot(): string {
  if (process.env.UPLOAD_DIR?.trim()) {
    return path.resolve(process.env.UPLOAD_DIR.trim());
  }
  return path.join(process.cwd(), "uploads");
}

function assertSafeRelative(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("..") ||
    path.isAbsolute(normalized) ||
    normalized.includes("\0")
  ) {
    throw new Error("Caminho de upload inválido.");
  }
  return normalized;
}

export async function saveUpload(
  folder: "receipts" | "photos" | "opponents" | "products",
  filename: string,
  data: Buffer
): Promise<string> {
  const safeName = path.basename(filename);
  const relative = `${folder}/${safeName}`;
  const fullDir = path.join(getUploadRoot(), folder);
  await mkdir(fullDir, { recursive: true });
  await writeFile(path.join(fullDir, safeName), data);
  return `/api/uploads/${relative}`;
}

export async function deleteUpload(publicUrl: string | null | undefined) {
  if (!publicUrl?.startsWith("/api/uploads/")) return;
  const relative = assertSafeRelative(publicUrl.slice("/api/uploads/".length));
  const full = path.join(getUploadRoot(), relative);
  const root = getUploadRoot();
  if (!full.startsWith(root)) return;
  try {
    await unlink(full);
  } catch {
    // ignore missing
  }
}

export async function readUpload(
  relativePath: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const relative = assertSafeRelative(relativePath);
  const full = path.join(getUploadRoot(), relative);
  const root = getUploadRoot();
  if (!full.startsWith(root)) return null;

  try {
    const buffer = await readFile(full);
    return { buffer, contentType: contentTypeFor(relative) };
  } catch {
    return null;
  }
}

function contentTypeFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}
