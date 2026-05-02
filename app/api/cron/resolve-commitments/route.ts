import { NextResponse } from "next/server";
import { resolveCommitmentsOnChain } from "@/lib/oath-resolve";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (request.headers.get("x-vercel-cron") === "1") {
    return true;
  }
  if (!secret) {
    return false;
  }

  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim() ||
    request.headers.get("x-cron-secret")?.trim() ||
    request.headers.get("x-webhook-secret")?.trim();

  return header === secret;
}

async function handleResolve(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  let slug = url.searchParams.get("slug")?.trim() || undefined;

  if (request.method === "POST") {
    try {
      const body = (await request.json()) as { slug?: string };
      slug = body.slug?.trim() || slug;
    } catch {
      // ignore malformed body and fall back to query params
    }
  }

  const summary = await resolveCommitmentsOnChain({ slug });

  return NextResponse.json({
    ok: true,
    ...summary,
  });
}

export async function GET(request: Request) {
  return handleResolve(request);
}

export async function POST(request: Request) {
  return handleResolve(request);
}
