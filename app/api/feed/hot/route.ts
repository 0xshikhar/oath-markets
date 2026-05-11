import { NextResponse } from "next/server";
import { getHotCommitments } from "@/lib/social-data";

export async function GET() {
  try {
    const commitments = await getHotCommitments(5);
    return NextResponse.json({ ok: true, commitments });
  } catch (error) {
    console.error("Hot commitments error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch hot commitments" },
      { status: 500 }
    );
  }
}
