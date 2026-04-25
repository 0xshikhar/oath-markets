import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "oath-markets",
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
  });
}
