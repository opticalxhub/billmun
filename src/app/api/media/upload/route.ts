import { NextRequest, NextResponse } from "next/server";
// Using custom upload implementation instead of uploadthing
import { getRequestUserContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
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

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const { data, error: uploadError } = await supabase.storage
    .from('media')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(fileName);

  return NextResponse.json({
    url: publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  });
  } catch (err: any) {
    console.error('[media/upload]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
