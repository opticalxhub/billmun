import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { getRequestUserContext } from "@/lib/auth-context";

export async function POST(req: NextRequest) {
  const { context, error, status } = await getRequestUserContext();
  if (!context) return NextResponse.json({ error }, { status: status || 500 });
  if (!["MEDIA", "PRESS", "EXECUTIVE_BOARD", "SECRETARY_GENERAL", "DEPUTY_SECRETARY_GENERAL"].includes(context.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing file" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > 500 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 500MB)" }, { status: 400 });
  }

  const utapi = new UTApi();
  const uploaded = await utapi.uploadFiles(file);
  if (uploaded.error || !uploaded.data?.ufsUrl) {
    return NextResponse.json({ error: uploaded.error?.message || "Upload failed" }, { status: 500 });
  }

  return NextResponse.json({
    url: uploaded.data.ufsUrl,
    name: uploaded.data.name || file.name,
    size: uploaded.data.size || file.size,
    type: uploaded.data.type || file.type,
  });
}
