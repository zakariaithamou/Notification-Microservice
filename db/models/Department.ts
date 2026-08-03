import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  apiKeyHash: string;
  allowedChannels: ("email" | "sms" | "push" | "whatsapp")[];
  contactEmail: string;
  active: boolean;
  createdAt: Date;
}

// The Mongoose Schema

const DepartmentSchema: Schema<IDepartment> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
    },
    apiKeyHash: {
      type: String,
      required: [true, "API Key Hash is required"],
      unique: true,
    },
    allowedChannels: {
      type: [String],
      enum: ["email", "sms", "push", "whatsapp"],
      default: ["email"],
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\s*[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}\s*$/,
        "Please fill a valid email address",
      ],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

//Exporting the Model Safely for Next.js

const Department: Model<IDepartment> =
  mongoose.models.Department ||
  mongoose.model<IDepartment>("Department", DepartmentSchema);

export default Department;
