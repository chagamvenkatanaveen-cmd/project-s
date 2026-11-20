import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { toggleLike } from "@/lib/communityStore";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  try {
    const database = getDatabase();
    const user = await getCurrentUser(database, req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to like posts." }, { status: 401 });
    }

    const { id } = await params;
    const result = await toggleLike(database, id, user.id);

    if (result === null) {
      return NextResponse.json({ success: false, error: "Post not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Toggling post like failed:", error);
    return NextResponse.json({ success: false, error: "Unable to update the post like." }, { status: 500 });
  }
}

