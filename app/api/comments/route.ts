import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CommentInput = {
  commitmentSlug?: string;
  walletAddress?: string;
  content?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CommentInput;
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
      comment: {
        commitmentSlug: slug,
        walletAddress,
        content,
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

  await prisma.comment.create({
    data: {
      commitmentId: commitment.id,
      authorId: user.id,
      content,
    },
  });

  return NextResponse.json({ ok: true });
}
