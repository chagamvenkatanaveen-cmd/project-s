import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getDatabaseAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const database = await getDatabaseAsync();
    const { configured, user } = await getCurrentAdmin(database, request);

    if (!configured) {
      return NextResponse.json(
        { success: false, error: "Admin login is not configured." },
        { status: 503 },
      );
    }
    if (!user) {
      return NextResponse.json({ success: false, error: "Admin sign-in is required." }, { status: 401 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Admin session lookup failed:", error);
    return NextResponse.json({ success: false, error: "Unable to verify the admin session." }, { status: 500 });
  }
}
