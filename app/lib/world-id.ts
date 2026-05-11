import "server-only";

export type WorldIdEnvironment = "production" | "staging";

function readTrimmedEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

export function getWorldIdAppId() {
  return readTrimmedEnv("WORLDID_APP_ID", "NEXT_PUBLIC_WLD_APP_ID", "NEXT_PUBLIC_WORLDID_APP_ID");
}

export function getWorldIdRpId() {
  return readTrimmedEnv("WORLDID_RP_ID");
}

export function getWorldIdActionId() {
  return readTrimmedEnv("WORLDID_ACTION_ID");
}

export function getWorldIdSigningKeyHex() {
  return readTrimmedEnv("WORLDID_PRIVATE_KEY", "RP_SIGNING_KEY");
}

export function getWorldIdEnvironment(): WorldIdEnvironment {
  return process.env.NODE_ENV === "production" ? "production" : "staging";
}

export function getWorldIdRequestConfig() {
  const appId = getWorldIdAppId();
  const rpId = getWorldIdRpId();
  const action = getWorldIdActionId();
  const signingKeyHex = getWorldIdSigningKeyHex();

  if (!appId || !rpId || !action || !signingKeyHex) {
    return null;
  }

  return {
    appId,
    rpId,
    action,
    signingKeyHex,
    environment: getWorldIdEnvironment(),
  };
}
