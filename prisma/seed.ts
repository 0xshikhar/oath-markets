import { runRealDevnetSeed } from "../scripts/seed-devnet-real";

runRealDevnetSeed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
