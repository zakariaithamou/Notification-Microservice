import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth/session";

export async function POST() {
  await destroyAdminSession();
  return NextResponse.json({ success: true, message: "Logged out" });
}
