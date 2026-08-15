import mongoose from "mongoose";
import Department from "@/db/models/Department";
import { generateApiKey } from "@/utils/crypto";
import { hashPassword } from "@/utils/password";

export const createDepartmentService = async (data: unknown) => {
  const {
    name,
    contactEmail,
    allowedChannels,
    programType,
    filieres,
    plainTextPassword,
    passwordExpiresAt,
  } = data as {
    name: string;
    contactEmail: string;
    allowedChannels: ("email" | "sms" | "push" | "whatsapp")[];
    programType: "licence_master" | "prepa_ingenieur";
    plainTextPassword: string;
    passwordExpiresAt: Date;
    filieres?: {
      licence: { name: string; code: string }[];
      master: { name: string; code: string }[];
      ingenieur: { name: string; code: string }[];
    };
  };

  // 1. Validation
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    throw new Error(
      "VALIDATION_ERROR: Department name is required (min 2 characters)",
    );
  }
  //  Validate programType
  if (
    !programType ||
    !["licence_master", "prepa_ingenieur"].includes(programType)
  ) {
    throw new Error(
      "VALIDATION_ERROR: A valid Programme Structure (programType) is required.",
    );
  }

  const trimmedName = name.trim();

  // 2. Check for Duplicates
  const existingDept = await Department.findOne({
    name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
  });

  if (existingDept) {
    throw new Error(
      "DUPLICATE_ERROR: A department with this name already exists.",
    );
  }

  const hashedPassword = await hashPassword(plainTextPassword);
  // 3. Generate API Key
  const { rawKey, keyHash } = generateApiKey();

  // 4. Save to MongoDB
  const newDepartment = await Department.create({
    name: trimmedName,
    apiKeyHash: keyHash,
    contactEmail: contactEmail || "",
    passwordHash: hashedPassword,
    passwordExpiresAt: passwordExpiresAt,
    allowedChannels: allowedChannels || ["email"],
    programType,
    filieres: filieres || { licence: [], master: [], ingenieur: [] },
    active: true,
  });

  // Return both the department data and the rawKey so the route can send it to the client
  return { newDepartment, rawKey };
};

export const getAllDepartmentsService = async () => {
  // .select('-apiKeyHash') ensures we don't accidentally send sensitive hashes to the client
  // .sort({ createdAt: -1 }) puts the newest departments at the top of the list
  const departments = await Department.find({})
    .select("-apiKeyHash")
    .sort({ createdAt: -1 })
    .lean();

  return departments;
};

export const getDepartmentByIdService = async (
  id: string,
  authenticatedDeptId: string,
) => {
  // 1. Check if the ID is a valid MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("VALIDATION_ERROR: Invalid department ID format.");
  }

  // 2. BOLA SECURITY PATCH: Guarantee strict data isolation
  // We check if the ID requested in the URL matches the ID of the authenticated key
  if (id !== authenticatedDeptId) {
    throw new Error(
      "FORBIDDEN_ERROR: Access denied. You can only view your own department profile.",
    );
  }

  // 3. Search for the department using the authenticated ID
  const department = await Department.findOne({
    _id: authenticatedDeptId,
  }).select("-apiKeyHash -password -otpCode -otpExpiry -trustedDevices");

  // 4. Throw a 404 error if it doesn't exist
  if (!department) {
    throw new Error("NOT_FOUND_ERROR: Department not found.");
  }

  return department;
};

export const updateDepartmentService = async (
  id: string,
  updates: Partial<{
    contactEmail: string;
    allowedChannels: ("email" | "sms" | "push" | "whatsapp")[];
    active: boolean;
  }>,
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("VALIDATION_ERROR: Invalid department ID format.");
  }

  // name and _id can not be changed
  const allowedFields = ["contactEmail", "allowedChannels", "active"] as const;

  const safeUpdates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      safeUpdates[field] = updates[field];
    }
  }

  if (Object.keys(safeUpdates).length === 0) {
    throw new Error("VALIDATION_ERROR: No valid fields provided to update.");
  }

  const department = await Department.findByIdAndUpdate(id, safeUpdates, {
    new: true,
    runValidators: true,
  });

  if (!department) {
    throw new Error("NOT_FOUND_ERROR: Department not found.");
  }

  return department;
};
