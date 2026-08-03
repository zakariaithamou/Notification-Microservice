import crypto from "crypto";

export function generateApiKey() {
  const rawKey = `dept_live_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  return { rawKey, keyHash };
}
