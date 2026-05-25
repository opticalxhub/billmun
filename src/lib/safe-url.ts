/** Avoid crashing the root layout when NEXT_PUBLIC_APP_URL is missing or invalid. */
export function safeAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return "https://portal.nxtmun.com";
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "https://portal.nxtmun.com";
    return u.origin;
  } catch {
    return "https://portal.nxtmun.com";
  }
}

export function safeMetadataBaseUrl(): URL {
  return new URL(safeAppOrigin());
}

