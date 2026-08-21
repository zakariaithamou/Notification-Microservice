import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

export async function GET() {
  try {
    await dbConnect();

    const isConnected = mongoose.connection.readyState === 1;

    if (isConnected) {
      return NextResponse.json({ status: "connected" }, { status: 200 });
    } else {
      return NextResponse.json({ status: "disconnected" }, { status: 503 });
    }
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to connect to database" },
      { status: 500 },
    );
  }
}
