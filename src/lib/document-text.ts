const MAX_BYTES = 12 * 1024 * 1024;

/**
 * Extract plain text from an uploaded document URL (PDF or text-like) for AI analysis.
 * pdf-parse is loaded only for PDFs (dynamic import) so Next.js build does not execute its module init.
 */
export async function extractTextFromDocumentUrl(
  fileUrl: string,
  mimeType: string,
): Promise<string> {
  const res = await fetch(fileUrl, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Could not download document (${res.status}).`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    throw new Error("Document is too large for AI analysis (max 12MB).");
  }

  const mt = (mimeType || res.headers.get("content-type") || "").toLowerCase();
  const url = fileUrl.toLowerCase();

  if (mt.includes("pdf") || url.includes(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buf);
    const text = (data.text || "").trim();
    if (!text) throw new Error("Could not read text from this PDF. Paste the text instead.");
    return text;
  }

  if (mt.includes("text") || mt.includes("json") || mt.includes("markdown") || url.endsWith(".txt")) {
    return buf.toString("utf8").trim();
  }

  throw new Error(
    "This file type cannot be read automatically. Paste your position paper text, or upload a PDF or plain text file.",
  );
}
