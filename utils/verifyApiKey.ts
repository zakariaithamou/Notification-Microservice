import dbConnect from "@/lib/dbConnect";
import Department from "@/db/models/Department";
import crypto from "crypto"; // Use crypto instead of bcrypt

export const verifyApiKey = async (apiKey: string) => {
  await dbConnect();

  // Hash the incoming key exactly how it was hashed during creation
  const hashedIncomingKey = crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");

  const departments = await Department.find({});

  for (const dept of departments) {
    // Compare the two SHA-256 hex strings directly
    if (hashedIncomingKey === dept.apiKeyHash) {
      return dept;
    }
  }

  throw new Error("UNAUTHORIZED: Invalid API key");
};
