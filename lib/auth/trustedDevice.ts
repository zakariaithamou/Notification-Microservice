// lib/auth/trustedDevice.ts
import crypto from "crypto";
import { ITrustedDevice } from "@/db/models/Department";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function generateDeviceToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

export function createTrustedDeviceEntry(
  tokenHash: string,
  userAgent?: string,
): ITrustedDevice {
  const now = new Date();
  return {
    tokenHash,
    createdAt: now,
    expiresAt: new Date(now.getTime() + THIRTY_DAYS_MS),
    userAgent,
  };
}

export function pruneExpiredDevices(
  devices: ITrustedDevice[],
): ITrustedDevice[] {
  const now = new Date();
  return devices.filter((d) => d.expiresAt > now);
}

export function isDeviceTrusted(
  devices: ITrustedDevice[],
  tokenHash: string,
): boolean {
  const now = new Date();
  return devices.some((d) => d.tokenHash === tokenHash && d.expiresAt > now);
}
