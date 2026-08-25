import { appError } from "@/lib/errors";

/**
 * Derives a stable id from a service name at CREATE time only. Never called
 * again after creation — the returned id becomes Service.id permanently
 * (see mutations.ts). Lowercases, strips diacritics, replaces runs of
 * non-alphanumerics with a single hyphen, trims leading/trailing hyphens.
 */
export function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "") // strip combining diacritical marks (e.g. "é" -> "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) {
    throw appError("INVALID_INPUT", `"name" must contain at least one letter or number.`);
  }
  return slug;
}
