import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { extractTextFromDocumentUrl } from "@/lib/document-text";

export async function GET(req: NextRequest) {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });

  const url = req.nextUrl.searchParams.get("url");
  const mime = req.nextUrl.searchParams.get("mime") || "application/pdf";

  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

  try {
    const text = await extractTextFromDocumentUrl(url, mime);
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("[documents/extract-text] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
