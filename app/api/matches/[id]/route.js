import { NextResponse } from "next/server";
import { getMatchScorecard } from "@/lib/cricbuzzScraper";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const data = await getMatchScorecard(id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

