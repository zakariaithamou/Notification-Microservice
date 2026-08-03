import mongoose from "mongoose";
import Template from "@/db/models/Template";

export interface CreateTemplateInput {
  name: string;
  channel: "email" | "sms" | "push" | "whatsapp";
  subject?: string;
  body: string;
  templateType?: "single" | "diffusion";
}

export const createTemplateService = async (
  data: CreateTemplateInput,
  departmentId: string,
) => {
  const { name, channel, subject, body } = data;

  // 1. Validation
  if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new Error("VALIDATION_ERROR: A valid department ID is required.");
  }

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    throw new Error(
      "VALIDATION_ERROR: Template name is required (min 2 characters).",
    );
  }

  const validChannels = ["email", "sms", "push", "whatsapp"];
  if (!channel || !validChannels.includes(channel)) {
    throw new Error(
      "VALIDATION_ERROR: Invalid channel. Must be email, sms, push, or whatsapp.",
    );
  }

  if (!body || typeof body !== "string" || body.trim().length < 5) {
    throw new Error(
      "VALIDATION_ERROR: Template body is required (min 5 characters).",
    );
  }

  const trimmedName = name.trim();

  // 3. Check for Duplicates (Prevent exact same name + channel for the same department)
  const existingTemplate = await Template.findOne({
    departmentId,
    name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    channel,
  });

  if (existingTemplate) {
    throw new Error(
      "DUPLICATE_ERROR: A template with this name and channel already exists for this department.",
    );
  }

  // 4. Save to MongoDB
  const newTemplate = await Template.create({
    departmentId,
    name: trimmedName,
    channel,
    subject: subject ? subject.trim() : undefined,
    body: body.trim(),
  });

  return newTemplate;
};

export const getAllTemplatesService = async (departmentId: string) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new Error("VALIDATION_ERROR: Invalid department ID format.");
  }

  const templates = await Template.find({ departmentId }).sort({
    createdAt: -1,
  });
  return templates;
};

export const getTemplateByIdService = async (
  id: string,
  departmentId: string,
) => {
  // 1. Check if the ID is a valid MongoDB format
  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    !mongoose.Types.ObjectId.isValid(departmentId)
  ) {
    throw new Error("VALIDATION_ERROR: Invalid ID format.");
  }

  // 2. Search for the template
  const template = await Template.findOne({ _id: id, departmentId });

  // 3. Throw a 404 error if it doesn't exist
  if (!template) {
    throw new Error("NOT_FOUND_ERROR: Template not found.");
  }

  return template;
};
