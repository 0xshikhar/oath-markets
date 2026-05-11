import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("walletAddress");

  if (!walletAddress) {
    return NextResponse.json({ ok: false, error: "Wallet address required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        commitments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        beliefs: {
          include: {
            commitment: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            commitments: true,
            beliefs: true,
            followers: true,
            following: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Convert BigInt to string for JSON serialization
    const serializedUser = JSON.parse(JSON.stringify(user, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    console.log(`[Profile API] Successfully fetched profile for ${walletAddress}`);
    return NextResponse.json({ ok: true, user: serializedUser });
  } catch (error) {
    console.error(`[Profile API] Error fetching profile for ${walletAddress}:`, error);
    return NextResponse.json({ ok: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let requestWalletAddress: string | undefined;
  try {
    const body = await request.json();
    const { walletAddress, username, bio, avatarUrl } = body;
    requestWalletAddress = walletAddress;

    if (!walletAddress) {
      return NextResponse.json({ ok: false, error: "Wallet address required" }, { status: 400 });
    }

    // Basic validation for username
    if (username && !/^[a-zA-Z0-9_.]{3,20}$/.test(username)) {
      return NextResponse.json({ 
        ok: false, 
        error: "Username must be 3-20 characters and only contain letters, numbers, dots, or underscores." 
      }, { status: 400 });
    }

    console.log(`[Profile API] Upserting profile for ${walletAddress}...`);
    const updatedUser = await prisma.user.upsert({
      where: { walletAddress },
      create: {
        walletAddress,
        username: username || null,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
      },
      update: {
        username: username || undefined,
        bio: bio || undefined,
        avatarUrl: avatarUrl || undefined,
      },
      include: {
        commitments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        beliefs: {
          include: {
            commitment: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            commitments: true,
            beliefs: true,
            followers: true,
            following: true,
          }
        }
      }
    });

    // Convert BigInt to string for JSON serialization
    const serializedUser = JSON.parse(JSON.stringify(updatedUser, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    console.log(`[Profile API] Successfully updated profile for ${walletAddress}`);
    return NextResponse.json({ ok: true, user: serializedUser });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.error(`[Profile API] Error updating profile for ${requestWalletAddress}:`, err);
    if (err.code === 'P2002') {
      return NextResponse.json({ ok: false, error: "Username already taken" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Failed to update profile" }, { status: 500 });
  }
}
