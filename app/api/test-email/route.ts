import { NextResponse } from "next/server";
// Adjust the import paths based on your folder structure
import { processAndSendEmail } from "@/services/notification.service";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { notificationId, to, subject, html } = body;

    // Validate inputs
    if (!notificationId || !to || !subject) {
      return NextResponse.json(
        { error: "Missing notificationId, to, or subject" },
        { status: 400 },
      );
    }

    // Ensure the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json(
        { error: "Invalid notificationId format" },
        { status: 400 },
      );
    }

    const payload = { to, subject, html };

    // Call our service layer
    const result = await processAndSendEmail(notificationId, payload);

    if (!result.success) {
      return NextResponse.json(
        { message: "Delivery failed", details: result },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { message: "Delivery successful", details: result },
      { status: 200 },
    );
  } catch (error) {
    console.error("Test API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
