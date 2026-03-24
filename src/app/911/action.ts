"use server";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function verifyEmergencyPassphrase(passphrase: string) {
  if (process.env.DISABLE_EMERGENCY_ACCESS === "true") {
    notFound();
  }

  if (passphrase !== process.env.EMERGENCY_PASSPHRASE) {
    return { error: "Invalid passphrase." };
  }

  // Create session valid for 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const { data, error } = await supabaseAdmin
    .from("emergency_sessions")
    .insert({ expires_at: expiresAt.toISOString() })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to create emergency session", error);
    return { error: "System error: could not create session." };
  }

  // Set cookies for 10 minutes
  const cookieStore = await cookies();
  cookieStore.set("emergency_token", data.id, {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  
  cookieStore.set("emergency_expires", encodeURIComponent(expiresAt.toISOString()), {
    expires: expiresAt,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/eb/dash");
}
