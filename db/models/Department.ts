import mongoose, { Schema, Document, Model } from "mongoose";

// 1. Define the TypeScript interface for a Filiere
export interface IFiliere {
  name: string;
  code: string;
}

// 2. the main interface
export interface ITrustedDevice {
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
}

export interface IOtp {
  codeHash?: string;
  expiresAt?: Date;
  attempts: number;
}
export interface IDepartment extends Document {
  name: string;
  apiKeyHash: string;
  allowedChannels: ("email" | "sms" | "push" | "whatsapp")[];
  contactEmail: string;
  passwordHash: string;
  passwordExpiresAt?: Date;
  active: boolean;

  programType: "licence_master" | "prepa_ingenieur";
  filieres: {
    licence: IFiliere[];
    master: IFiliere[];
    ingenieur: IFiliere[];
  };
  trustedDevices: ITrustedDevice[];
  otp: IOtp;

  createdAt: Date;
}

// 3. Sub-Schema for the Filiere
const FiliereSchema = new Schema<IFiliere>(
  {
    name: {
      type: String,
      required: [true, "Filiere name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Filiere code is required"],
      uppercase: true,
      trim: true,
    },
  },
  { _id: false },
);

const TrustedDeviceSchema = new Schema<ITrustedDevice>(
  {
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String },
  },
  { _id: false },
);

const OtpSchema = new Schema<IOtp>(
  {
    codeHash: { type: String },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 },
  },
  { _id: false },
);

// 4. The Mongoose Schema
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
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    passwordExpiresAt: {
      type: Date,
    },
    allowedChannels: {
      type: [String],
      enum: ["email", "sms", "push", "whatsapp"],
      default: ["email"],
    },
    contactEmail: {
      type: String,
      required: [true, "Contact email is required"],
      unique: true,
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

    // Program routing logic
    programType: {
      type: String,
      enum: ["licence_master", "prepa_ingenieur"],
      required: [true, "Please select a program structure"],
    },

    //  The nested filieres structured by cycle
    filieres: {
      licence: { type: [FiliereSchema], default: [] },
      master: { type: [FiliereSchema], default: [] },
      ingenieur: { type: [FiliereSchema], default: [] },
    },
    trustedDevices: {
      type: [TrustedDeviceSchema],
      default: [],
    },
    otp: {
      type: OtpSchema,
      default: () => ({ attempts: 0 }),
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

// Exporting the Model
const Department: Model<IDepartment> =
  mongoose.models.Department ||
  mongoose.model<IDepartment>("Department", DepartmentSchema);

export default Department;
