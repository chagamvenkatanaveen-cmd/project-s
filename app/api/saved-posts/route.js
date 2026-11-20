import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { getPosts } from "@/lib/communityStore";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const database = getDatabase();
    const user = await getCurrentUser(database, request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to view saved posts." }, { status: 401 });
    }

    const posts = await getPosts(database, user.id, true);
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("Loading saved posts failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load saved posts." }, { status: 500 });
  }
}
