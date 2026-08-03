import mongoose, { Schema, Document, Model, Types } from "mongoose";

//defining the interface for the Template document

export interface ITemplate extends Document {
  name: string;
  channel: "email" | "sms" | "push" | "whatsapp";
  subject?: string;
  body: string;
  templateType: "single" | "diffusion";
  departmentId: Types.ObjectId;
  createdAt: Date;
}

const TemplateSchema: Schema<ITemplate> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    channel: {
      type: String,
      required: [true, "Notification channel is required"],
      enum: ["email", "sms", "push", "whatsapp"],
    },

    subject: {
      type: String,
      trim: true,
    },
    body: {
      type: String,
      required: [true, "Template body is required"],
    },

    templateType: {
      type: String,
      enum: ["single", "diffusion"],
      required: [true, "Template type is required"],
      default: "single",
    },

    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department ID is required to own this template "],
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

const Template: Model<ITemplate> =
  mongoose.models.Template ||
  mongoose.model<ITemplate>("Template", TemplateSchema);

export default Template;
