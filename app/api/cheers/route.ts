import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const commitmentId = searchParams.get("commitmentId");

  if (!commitmentId) {
    return NextResponse.json({ ok: false, error: "Missing commitmentId" }, { status: 400 });
  }

  try {
    const cheers = await prisma.cheer.findMany({
      where: { commitmentId },
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
            walletAddress: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ ok: true, cheers });
  } catch (error) {
    console.error("Failed to fetch cheers:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { commitmentId, authorWallet, message } = body;

    if (!commitmentId || !authorWallet || !message) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: authorWallet },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const cheer = await prisma.cheer.create({
      data: {
        commitmentId,
        authorId: user.id,
        message,
      },
      include: {
        author: {
          select: {
            username: true,
            avatarUrl: true,
            walletAddress: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, cheer });
  } catch (error) {
    console.error("Failed to create cheer:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
