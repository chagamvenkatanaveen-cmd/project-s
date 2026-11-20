import { NextResponse } from "next/server";
import { getLiveCricketScores } from "@/lib/cricbuzzScraper";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLiveCricketScores();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

