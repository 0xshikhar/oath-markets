import { PrismaClient } from "@prisma/client";

type ModelDelegate = {
  findMany?: (...args: unknown[]) => Promise<unknown>;
  findUnique?: (...args: unknown[]) => Promise<unknown>;
  upsert?: (...args: unknown[]) => Promise<unknown>;
};

type AppPrismaClient = PrismaClient & Partial<
  Record<
    "reaction" | "proof" | "commitment" | "user" | "follow" | "belief" | "comment" | "coachMessage",
    ModelDelegate
  >
>;

const globalForPrisma = globalThis as unknown as {
  prisma?: AppPrismaClient;
};

const requiredDelegates = [
  "reaction",
  "proof",
  "commitment",
  "user",
  "follow",
  "belief",
  "comment",
  "coachMessage",
] as const;

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  }) as AppPrismaClient;
}

function hasRequiredDelegates(client: AppPrismaClient) {
  return requiredDelegates.every(
    (delegate) => typeof client[delegate]?.findMany === "function"
  );
}

export const prisma = (() => {
  const cached = globalForPrisma.prisma;
  const client = cached && hasRequiredDelegates(cached) ? cached : createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
})();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
