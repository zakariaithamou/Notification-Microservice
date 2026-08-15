import { NextResponse } from "next/server";
import { processNotificationQueue } from "@/services/notification.service";
import dbConnect from "@/lib/dbConnect";
import { handleErrorResponse } from "@/utils/apiResponse";

// This ensures Next.js runs this route dynamically and never caches the result
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();

    // Fire the queue processor
    const results = await processNotificationQueue();

    return NextResponse.json(
      {
        success: true,
        message: "Worker execution complete",
        data: results,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
