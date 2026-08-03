import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; // Adjust to '../../../lib/dbConnect' if you don't have the @ path alias configured
import mongoose from "mongoose";

export async function GET() {
  try {
    // 1. Call the dbConnect helper
    await dbConnect();

    // 2. Verify the connection state
    // Mongoose readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const isConnected = mongoose.connection.readyState === 1;

    // 3. Return the exact JSON response requested
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
