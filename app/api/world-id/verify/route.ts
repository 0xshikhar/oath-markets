import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { IDKitResult } from "@worldcoin/idkit";
import { hashSignal } from "@worldcoin/idkit/hashing";
import { prisma } from "@/lib/prisma";
import { sameWalletAddress } from "@/lib/oath-access";
import {
  getWorldIdActionId,
  getWorldIdAppId,
  getWorldIdEnvironment,
  getWorldIdRpId,
} from "@/lib/world-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WorldIdVerifyInput = {
  walletAddress?: string;
  idkitResponse?: IDKitResult;
};

type WorldVerifyResult = {
  success?: boolean;
  nullifier?: string;
  results?: Array<{
    success?: boolean;
    nullifier?: string;
    code?: string;
    detail?: string;
  }>;
  action?: string;
  message?: string;
};

type VerifiedWorldIdUser = {
  walletAddress: string;
  worldIdVerified: boolean;
  worldIdNullifier: string | null;
};

function getSignalHash(result: IDKitResult) {
  if (!("responses" in result) || result.responses.length === 0) {
    return null;
  }

  const [firstResponse] = result.responses;

  if (firstResponse && "signal_hash" in firstResponse && firstResponse.signal_hash) {
    return firstResponse.signal_hash;
  }

  return null;
}

function getResultEnvironment(result: IDKitResult) {
  if ("environment" in result && typeof result.environment === "string") {
    return result.environment;
  }

  return null;
}

function getNullifier(payload: WorldVerifyResult, result: IDKitResult) {
  if (payload.nullifier) {
    return payload.nullifier;
  }

  const successfulResult = payload.results?.find((entry) => entry.success && entry.nullifier);
  if (successfulResult?.nullifier) {
    return successfulResult.nullifier;
  }

  if ("responses" in result && result.responses.length > 0) {
    const [firstResponse] = result.responses;
    if (firstResponse && "nullifier" in firstResponse && firstResponse.nullifier) {
      return firstResponse.nullifier;
    }
  }

  return null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as WorldIdVerifyInput;
  const walletAddress = body.walletAddress?.trim();
  const idkitResponse = body.idkitResponse;

  if (!walletAddress || !idkitResponse) {
    return NextResponse.json(
      { ok: false, error: "walletAddress and idkitResponse are required" },
      { status: 400 }
    );
  }

  const appId = getWorldIdAppId();
  const rpId = getWorldIdRpId();
  const action = getWorldIdActionId();
  const environment = getWorldIdEnvironment();

  if (!appId || !rpId || !action) {
    return NextResponse.json(
      { ok: false, error: "World ID is not configured" },
      { status: 503 }
    );
  }

  if ("session_id" in idkitResponse) {
    return NextResponse.json(
      { ok: false, error: "Session proofs are not supported for wallet verification" },
      { status: 400 }
    );
  }

  if (idkitResponse.action && idkitResponse.action !== action) {
    return NextResponse.json(
      { ok: false, error: "World ID action mismatch" },
      { status: 400 }
    );
  }

  const resultEnvironment = getResultEnvironment(idkitResponse);
  if (resultEnvironment && resultEnvironment !== environment) {
    return NextResponse.json(
      { ok: false, error: "World ID environment mismatch" },
      { status: 400 }
    );
  }

  const signalHash = getSignalHash(idkitResponse);
  const expectedSignalHash = hashSignal(walletAddress);

  if (signalHash && signalHash !== expectedSignalHash) {
    return NextResponse.json(
      { ok: false, error: "World ID signal mismatch" },
      { status: 400 }
    );
  }

  const response = await fetch(`https://developer.world.org/api/v4/verify/${rpId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(idkitResponse),
  });

  const payload = (await response.json()) as WorldVerifyResult;

  if (!response.ok || !payload.success) {
    return NextResponse.json(
      {
        ok: false,
        error: payload.message ?? "World ID verification failed",
        worldVerifyResponse: payload,
      },
      { status: response.status || 400 }
    );
  }

  const nullifier = getNullifier(payload, idkitResponse);
  if (!nullifier) {
    return NextResponse.json(
      { ok: false, error: "World ID verification did not return a nullifier" },
      { status: 500 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  const nullifierOwner = await prisma.user.findFirst({
    where: {
      worldIdNullifier: nullifier,
    },
    select: {
      walletAddress: true,
    },
  });

  if (nullifierOwner && !sameWalletAddress(nullifierOwner.walletAddress, walletAddress)) {
    return NextResponse.json(
      { ok: false, error: "This World ID has already been linked to another wallet" },
      { status: 409 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { walletAddress },
    select: {
      worldIdNullifier: true,
    },
  });

  if (existingUser?.worldIdNullifier && existingUser.worldIdNullifier !== nullifier) {
    return NextResponse.json(
      { ok: false, error: "This wallet already has a different World ID proof linked" },
      { status: 409 }
    );
  }

  let user: VerifiedWorldIdUser | undefined;
  try {
    user = await prisma.user.upsert({
      where: { walletAddress },
      create: {
        walletAddress,
        worldIdVerified: true,
        worldIdNullifier: nullifier,
      },
      update: {
        worldIdVerified: true,
        worldIdNullifier: nullifier,
      },
      select: {
        walletAddress: true,
        worldIdVerified: true,
        worldIdNullifier: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "This World ID has already been linked to another wallet" },
        { status: 409 }
      );
    }

    throw error;
  }

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "World ID verification failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    verified: user.worldIdVerified,
    nullifier: user.worldIdNullifier,
    walletAddress: user.walletAddress,
    appId,
    rpId,
    action,
    environment,
  });
}
