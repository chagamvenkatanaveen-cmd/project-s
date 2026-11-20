import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabaseAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const user = await getCurrentUser(await getDatabaseAsync(), request);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Session lookup failed:", error);
    return NextResponse.json({ success: false, error: "Unable to read the current session." }, { status: 500 });
  }
}
