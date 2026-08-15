import mongoose from "mongoose";
import Template from "@/db/models/Template";

export interface CreateTemplateInput {
  name: string;
  channel: "email" | "sms" | "push" | "whatsapp";
  subject?: string;
  body: string;
  templateType?: "single" | "diffusion";
}
export interface UpdateTemplateInput {
  name?: string;
  channel?: "email" | "sms" | "push" | "whatsapp";
  subject?: string;
  body?: string;
  templateType?: "single" | "diffusion";
}

export const createTemplateService = async (
  data: CreateTemplateInput,
  departmentId: string,
) => {
  const { name, channel, subject, body, templateType } = data;

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
    templateType: templateType || "single", // Default to "single" if not provided
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

//update or delete template

export const updateTemplateService = async (
  id: string,
  departmentId: string,
  allowedChannels: string[],
  data: UpdateTemplateInput,
) => {
  // 1. Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    !mongoose.Types.ObjectId.isValid(departmentId)
  ) {
    throw new Error("VALIDATION_ERROR: Invalid ID format.");
  }

  // 2. Validate input fields if they are provided
  if (
    data.name !== undefined &&
    (typeof data.name !== "string" || data.name.trim().length < 2)
  ) {
    throw new Error(
      "VALIDATION_ERROR: Template name must be at least 2 characters.",
    );
  }

  // Check if the channel is in the department's allowed channels
  if (data.channel !== undefined) {
    if (!allowedChannels.includes(data.channel)) {
      throw new Error(
        `VALIDATION_ERROR: The channel '${data.channel}' is not authorized for this department.`,
      );
    }
  }

  if (
    data.body !== undefined &&
    (typeof data.body !== "string" || data.body.trim().length < 5)
  ) {
    throw new Error(
      "VALIDATION_ERROR: Template body must be at least 5 characters.",
    );
  }

  // data strings
  const updateData = { ...data };
  if (updateData.name) updateData.name = updateData.name.trim();
  if (updateData.subject) updateData.subject = updateData.subject.trim();
  if (updateData.body) updateData.body = updateData.body.trim();

  // 3. Update the template ensuring it belongs to this department
  const updatedTemplate = await Template.findOneAndUpdate(
    { _id: id, departmentId },
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!updatedTemplate) {
    throw new Error("NOT_FOUND_ERROR: Template not found or unauthorized.");
  }

  return updatedTemplate;
};

export const deleteTemplateService = async (
  id: string,
  departmentId: string,
) => {
  // 1. Validate IDs
  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    !mongoose.Types.ObjectId.isValid(departmentId)
  ) {
    throw new Error("VALIDATION_ERROR: Invalid ID format.");
  }

  // 2. Find and delete the template ensuring it belongs to this department
  const deletedTemplate = await Template.findOneAndDelete({
    _id: id,
    departmentId,
  });

  if (!deletedTemplate) {
    throw new Error("NOT_FOUND_ERROR: Template not found or unauthorized.");
  }

  return deletedTemplate;
};
