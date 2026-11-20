import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { getDatabaseAsync } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
  try {
    const database = await getDatabaseAsync();
    const { configured, user } = await getCurrentAdmin(database, request);
    if (!configured) {
      return NextResponse.json({ success: false, error: "Admin login is not configured." }, { status: 503 });
    }
    if (!user) {
      return NextResponse.json({ success: false, error: "Admin sign-in is required." }, { status: 401 });
    }

    const { id } = await params;
    const result = await database
      .prepare("DELETE FROM support_conversations WHERE id = ?")
      .bind(id)
      .run();

    if (!result.meta?.changes) {
      return NextResponse.json({ success: false, error: "Support conversation not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deleting support conversation failed:", error);
    return NextResponse.json({ success: false, error: "Unable to delete the support conversation." }, { status: 500 });
  }
}
