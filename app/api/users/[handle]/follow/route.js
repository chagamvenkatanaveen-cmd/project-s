import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getFollowContext(request, handle) {
  const database = getDatabase();
  const user = await getCurrentUser(database, request);
  if (!user) {
    return { response: NextResponse.json({ success: false, error: "Sign in to follow users." }, { status: 401 }) };
  }

  const target = await database
    .prepare("SELECT id, handle, display_name AS name FROM users WHERE handle = ?")
    .bind(handle)
    .first();
  if (!target) {
    return { response: NextResponse.json({ success: false, error: "User not found." }, { status: 404 }) };
  }
  if (target.id === user.id) {
    return { response: NextResponse.json({ success: false, error: "You cannot follow yourself." }, { status: 400 }) };
  }
  return { database, user, target };
}

export async function GET(request, { params }) {
  try {
    const { handle } = await params;
    const context = await getFollowContext(request, handle);
    if (context.response) {
      return context.response;
    }

    const result = await context.database
      .prepare("SELECT 1 AS following FROM follows WHERE follower_id = ? AND followed_id = ?")
      .bind(context.user.id, context.target.id)
      .first();
    return NextResponse.json({ success: true, following: Boolean(result) });
  } catch (error) {
    console.error("Loading follow status failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load follow status." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { handle } = await params;
    const context = await getFollowContext(request, handle);
    if (context.response) {
      return context.response;
    }

    const { database, user, target } = context;
    const result = await database
      .prepare("INSERT OR IGNORE INTO follows (follower_id, followed_id) VALUES (?, ?)")
      .bind(user.id, target.id)
      .run();
    if (result.meta.changes) {
      await database
        .prepare(
          `INSERT INTO notifications (id, recipient_id, actor_id, type)
           VALUES (?, ?, ?, 'follow')`,
        )
        .bind(crypto.randomUUID(), target.id, user.id)
        .run();
    }

    return NextResponse.json({ success: true, following: true });
  } catch (error) {
    console.error("Following user failed:", error);
    return NextResponse.json({ success: false, error: "Unable to follow this user." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { handle } = await params;
    const context = await getFollowContext(request, handle);
    if (context.response) {
      return context.response;
    }

    const { database, user, target } = context;
    await database
      .prepare("DELETE FROM follows WHERE follower_id = ? AND followed_id = ?")
      .bind(user.id, target.id)
      .run();
    return NextResponse.json({ success: true, following: false });
  } catch (error) {
    console.error("Unfollowing user failed:", error);
    return NextResponse.json({ success: false, error: "Unable to unfollow this user." }, { status: 500 });
  }
}
