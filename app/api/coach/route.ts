import { NextResponse } from "next/server";
import { CoachTrigger, MessageRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CoachInput = {
  commitmentSlug?: string;
  walletAddress?: string;
  content?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CoachInput;
  const slug = body.commitmentSlug?.trim();
  const walletAddress = body.walletAddress?.trim();
  const content = body.content?.trim();

  if (!slug || !walletAddress || !content) {
    return NextResponse.json(
      { ok: false, error: "commitmentSlug, walletAddress, and content are required" },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({
      ok: true,
      coachMessage: {
        role: "USER",
        content,
        reply: "Got it. The coach will react to this in the next release.",
      },
    });
  }

  const commitment = await prisma.commitment.findUnique({ where: { slug } });
  if (!commitment) {
    return NextResponse.json({ ok: false, error: "Commitment not found" }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: { walletAddress },
    create: { walletAddress },
    update: {},
  });

  await prisma.coachMessage.create({
    data: {
      commitmentId: commitment.id,
      userId: user.id,
      role: MessageRole.USER,
      trigger: CoachTrigger.DAILY_CHECKIN,
      content,
    },
  });

  return NextResponse.json({
    ok: true,
    coachMessage: {
      role: "USER",
      content,
      reply: "Coach reply queued.",
    },
  });
}
