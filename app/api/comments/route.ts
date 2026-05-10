import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canViewCommitment } from "@/lib/oath-access";

type CommentInput = {
  commitmentSlug?: string;
  walletAddress?: string;
  content?: string;
  parentCommentId?: string;
};

type CommentAccessRecord = {
  id: string;
  slug: string;
  isPublic: boolean;
  maker: {
    walletAddress: string;
  };
};

async function loadCommentAccess(slug: string) {
  return (await prisma.commitment.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      isPublic: true,
      maker: {
        select: {
          walletAddress: true,
        },
      },
    },
  })) as CommentAccessRecord | null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CommentInput;
  const slug = body.commitmentSlug?.trim();
  const walletAddress = body.walletAddress?.trim();
  const content = body.content?.trim();
  const parentCommentId = body.parentCommentId?.trim();

  if (!slug || !walletAddress || !content) {
    return NextResponse.json(
      {
        ok: false,
        error: "commitmentSlug, walletAddress, and content are required",
      },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  const commitment = await loadCommentAccess(slug);
  if (!commitment) {
    return NextResponse.json({ ok: false, error: "Commitment not found" }, { status: 404 });
  }

  if (
    !canViewCommitment(
      {
        isPublic: commitment.isPublic,
        makerWalletAddress: commitment.maker.walletAddress,
      },
      walletAddress
    )
  ) {
    return NextResponse.json({ ok: false, error: "Commitment not found" }, { status: 404 });
  }

  if (parentCommentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentCommentId },
      select: {
        id: true,
        commitmentId: true,
      },
    });

    if (!parentComment || parentComment.commitmentId !== commitment.id) {
      return NextResponse.json(
        { ok: false, error: "Reply target not found" },
        { status: 404 }
      );
    }
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
      ...(parentCommentId
        ? {
            parentComment: {
              connect: { id: parentCommentId },
            },
          }
        : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
