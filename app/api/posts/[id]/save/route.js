import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getSaveContext(request, postId) {
  const database = getDatabase();
  const user = await getCurrentUser(database, request);
  if (!user) {
    return { response: NextResponse.json({ success: false, error: "Sign in to save posts." }, { status: 401 }) };
  }

  const post = await database
    .prepare("SELECT id FROM posts WHERE id = ?")
    .bind(postId)
    .first();
  if (!post) {
    return { response: NextResponse.json({ success: false, error: "Post not found." }, { status: 404 }) };
  }
  return { database, user };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const context = await getSaveContext(request, id);
    if (context.response) {
      return context.response;
    }

    const savedPost = await context.database
      .prepare("SELECT 1 AS saved FROM saved_posts WHERE user_id = ? AND post_id = ?")
      .bind(context.user.id, id)
      .first();
    return NextResponse.json({ success: true, saved: Boolean(savedPost) });
  } catch (error) {
    console.error("Loading saved-post status failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load saved-post status." }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const context = await getSaveContext(request, id);
    if (context.response) {
      return context.response;
    }

    await context.database
      .prepare("INSERT OR IGNORE INTO saved_posts (user_id, post_id) VALUES (?, ?)")
      .bind(context.user.id, id)
      .run();
    return NextResponse.json({ success: true, saved: true });
  } catch (error) {
    console.error("Saving post failed:", error);
    return NextResponse.json({ success: false, error: "Unable to save this post." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const context = await getSaveContext(request, id);
    if (context.response) {
      return context.response;
    }

    await context.database
      .prepare("DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?")
      .bind(context.user.id, id)
      .run();
    return NextResponse.json({ success: true, saved: false });
  } catch (error) {
    console.error("Removing saved post failed:", error);
    return NextResponse.json({ success: false, error: "Unable to remove this saved post." }, { status: 500 });
  }
}
