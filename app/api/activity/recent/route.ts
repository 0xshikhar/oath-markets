import { NextResponse } from "next/server";
import { getGlobalActivity } from "@/lib/social-data";

export async function GET() {
  try {
    const events = await getGlobalActivity(10);
    return NextResponse.json({ ok: true, events });
  } catch (error) {
    console.error("Failed to fetch recent activity", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
