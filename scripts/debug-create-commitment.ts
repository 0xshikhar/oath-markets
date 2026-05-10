import { prisma } from "../app/lib/prisma";

async function main() {
  const walletAddress =
    process.env.DEBUG_WALLET_ADDRESS?.trim() ||
    "vyH9abSgs8NypgbgotZ2jJzyReqHz8ntUiHnu7r2HRq";
  const title = "Test oath";
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const user = await prisma.user.upsert({
    where: { walletAddress },
    create: {
      walletAddress,
      timezone: "Asia/Kolkata",
      notifyTime: "09:00",
      worldIdVerified: false,
    },
    update: {
      timezone: "Asia/Kolkata",
      notifyTime: "09:00",
    },
  });

  const commitment = await prisma.commitment.create({
    data: {
      slug,
      title,
      description: "debug",
      category: "WORK",
      proofType: "TEXT",
      stakeAmountLamports: 100_000_000n,
      slashDestination: "TREASURY",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalDays: 7,
      requiredProofDays: 7,
      status: "ACTIVE",
      isPublic: true,
      makerId: user.id,
      proofCount: 0,
      onchainAddress: null,
      onchainTxSig: null,
    },
  });

  console.log({ slug: commitment.slug });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
