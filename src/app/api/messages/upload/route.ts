import { NextRequest, NextResponse } from "next/server";
import { getRequestUserContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
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

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `messages/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(fileName);

    return NextResponse.json({
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    });
  } catch (err: any) {
    console.error('[messages/upload]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
