import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { getRequestUserContext } from "@/lib/auth-context";

export async function POST(req: NextRequest) {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG/PNG/WEBP/PDF allowed" }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });
  }

  const utapi = new UTApi();
  const uploaded = await utapi.uploadFiles(file);
  if (uploaded.error || !uploaded.data?.ufsUrl) {
    return NextResponse.json({ error: uploaded.error?.message || "Upload failed" }, { status: 500 });
  }

  return NextResponse.json({
    file_url: uploaded.data.ufsUrl,
    file_name: uploaded.data.name || file.name,
    file_size: uploaded.data.size || file.size,
    mime_type: uploaded.data.type || file.type,
  });
}
