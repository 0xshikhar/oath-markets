import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SocialPrismaClient = typeof prisma & {
  follow: NonNullable<typeof prisma.follow>;
  user: NonNullable<typeof prisma.user>;
};

const socialPrisma = prisma as SocialPrismaClient;

type FollowInput = {
  followerWallet?: string;
  followingWallet?: string;
};

async function getFollowStats(followerId: string, followingId: string) {
  const [isFollowing, followerCount, followingCount] = await Promise.all([
    socialPrisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      select: { id: true },
    }),
    socialPrisma.follow.count({ where: { followingId } }),
    socialPrisma.follow.count({ where: { followerId } }),
  ]);

  return {
    isFollowing: Boolean(isFollowing),
    followerCount,
    followingCount,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const followerWallet = url.searchParams.get("followerWallet")?.trim();
  const followingWallet = url.searchParams.get("followingWallet")?.trim();

  if (!followerWallet || !followingWallet) {
    return NextResponse.json(
      {
        ok: false,
        error: "followerWallet and followingWallet are required",
      },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({
      ok: true,
      isFollowing: false,
      followerCount: 0,
      followingCount: 0,
    });
  }

  const [follower, following] = await Promise.all([
    socialPrisma.user.findUnique({
      where: { walletAddress: followerWallet },
      select: { id: true },
    }),
    socialPrisma.user.findUnique({
      where: { walletAddress: followingWallet },
      select: { id: true },
    }),
  ]);

  if (!follower || !following) {
    return NextResponse.json({
      ok: true,
      isFollowing: false,
      followerCount: 0,
      followingCount: 0,
    });
  }

  return NextResponse.json({
    ok: true,
    ...(await getFollowStats(follower.id, following.id)),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as FollowInput;
  const followerWallet = body.followerWallet?.trim();
  const followingWallet = body.followingWallet?.trim();

  if (!followerWallet || !followingWallet) {
    return NextResponse.json(
      {
        ok: false,
        error: "followerWallet and followingWallet are required",
      },
      { status: 400 }
    );
  }

  if (followerWallet === followingWallet) {
    return NextResponse.json(
      { ok: false, error: "You cannot follow yourself" },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({
      ok: true,
      isFollowing: true,
      followerCount: 0,
      followingCount: 0,
    });
  }

  const [follower, following] = await Promise.all([
    socialPrisma.user.upsert({
      where: { walletAddress: followerWallet },
      create: { walletAddress: followerWallet },
      update: {},
      select: { id: true },
    }),
    socialPrisma.user.upsert({
      where: { walletAddress: followingWallet },
      create: { walletAddress: followingWallet },
      update: {},
      select: { id: true },
    }),
  ]);

  await socialPrisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: follower.id,
        followingId: following.id,
      },
    },
    update: {},
    create: {
      followerId: follower.id,
      followingId: following.id,
    },
  });

  return NextResponse.json({
    ok: true,
    ...(await getFollowStats(follower.id, following.id)),
  });
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as FollowInput;
  const followerWallet = body.followerWallet?.trim();
  const followingWallet = body.followingWallet?.trim();

  if (!followerWallet || !followingWallet) {
    return NextResponse.json(
      {
        ok: false,
        error: "followerWallet and followingWallet are required",
      },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({
      ok: true,
      isFollowing: false,
      followerCount: 0,
      followingCount: 0,
    });
  }

  const [follower, following] = await Promise.all([
    socialPrisma.user.findUnique({
      where: { walletAddress: followerWallet },
      select: { id: true },
    }),
    socialPrisma.user.findUnique({
      where: { walletAddress: followingWallet },
      select: { id: true },
    }),
  ]);

  if (!follower || !following) {
    return NextResponse.json({
      ok: true,
      isFollowing: false,
      followerCount: 0,
      followingCount: 0,
    });
  }

  await socialPrisma.follow.deleteMany({
    where: {
      followerId: follower.id,
      followingId: following.id,
    },
  });

  return NextResponse.json({
    ok: true,
    ...(await getFollowStats(follower.id, following.id)),
  });
}
