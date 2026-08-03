import mongoose from "mongoose";
import Department from "@/db/models/Department";
import { generateApiKey } from "@/utils/crypto";

export const createDepartmentService = async (data: unknown) => {
  const { name, contactEmail, allowedChannels } = data as {
    name: string;
    contactEmail: string;
    allowedChannels: ("email" | "sms" | "push" | "whatsapp")[];
  };

  // 1. Validation
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    throw new Error(
      "VALIDATION_ERROR: Department name is required (min 2 characters)",
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

  // 3. Generate API Key
  const { rawKey, keyHash } = generateApiKey();

  // 4. Save to MongoDB
  const newDepartment = await Department.create({
    name: trimmedName,
    apiKeyHash: keyHash,
    contactEmail: contactEmail || "",
    allowedChannels: allowedChannels || ["email"],
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
  }).select("-apiKeyHash");

  // 4. Throw a 404 error if it doesn't exist
  if (!department) {
    throw new Error("NOT_FOUND_ERROR: Department not found.");
  }

  return department;
};
