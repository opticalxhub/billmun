"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function verifyDevTestPassphrase(passphrase: string) {
  if (passphrase !== process.env.DEV_TEST_PASSPHRASE) {
    return { error: "Invalid dev test passphrase." };
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Set cookie for 24 hours
  cookies().set("dev_test_unlocked", "true", {
    expires: expiresAt,
    httpOnly: false, // Accessible by client side as requested (localStorage backup/check)
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/dev/test");
}
