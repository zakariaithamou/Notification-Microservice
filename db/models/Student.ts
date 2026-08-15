import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  departmentId: mongoose.Types.ObjectId; // Links to the school/department
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  annee: number;
  filiere?: string;
  cycle: "preparatoire" | "ingenieur" | "licence" | "master";
  createdAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    annee: { type: Number, required: true, index: true },
    filiere: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
    },
    cycle: {
      type: String,
      enum: ["preparatoire", "ingenieur", "licence", "master"],
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Student ||
  mongoose.model<IStudent>("Student", StudentSchema);
