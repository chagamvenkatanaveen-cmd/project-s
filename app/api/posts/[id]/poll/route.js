import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { votePoll } from "@/lib/communityStore";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  try {
    const database = getDatabase();
    const user = await getCurrentUser(database, req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Sign in to vote in polls." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const optionId = typeof body?.optionId === "string" ? body.optionId : "";

    if (!optionId) {
      return NextResponse.json({ success: false, error: "optionId is required." }, { status: 400 });
    }

    const result = await votePoll(database, id, user.id, optionId);
    if (!result) {
      return NextResponse.json({ success: false, error: "Poll or option not found." }, { status: 404 });
    }
    if (result.alreadyVoted) {
      return NextResponse.json({ success: false, error: "You have already voted in this poll." }, { status: 409 });
    }

    return NextResponse.json({ success: true, poll: result.poll });
  } catch (error) {
    console.error("Recording poll vote failed:", error);
    return NextResponse.json({ success: false, error: "Unable to record the poll vote." }, { status: 500 });
  }
}

