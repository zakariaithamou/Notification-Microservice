import mongoose, { Schema, Document } from "mongoose";

export interface IStudent extends Document {
  departmentId: mongoose.Types.ObjectId; // Links to the school/department
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  promo: number;
  filiere: string;
  cycle: "preparatoire" | "ingenieur";
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
    promo: { type: Number, required: true, index: true },
    filiere: { type: String, required: true },
    cycle: {
      type: String,
      enum: ["preparatoire", "ingenieur"],
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Student ||
  mongoose.model<IStudent>("Student", StudentSchema);
