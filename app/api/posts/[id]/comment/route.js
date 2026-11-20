import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { addComment } from "@/lib/communityStore";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  try {
    const database = getDatabase();
    const user = await getCurrentUser(database, req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to comment." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text || text.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Comment text must be between 1 and 2,000 characters." },
        { status: 400 },
      );
    }

    const comment = await addComment(database, id, user, text);
    if (!comment) {
      return NextResponse.json({ success: false, error: "Post not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error("Creating comment failed:", error);
    return NextResponse.json({ success: false, error: "Unable to add the comment." }, { status: 500 });
  }
}

