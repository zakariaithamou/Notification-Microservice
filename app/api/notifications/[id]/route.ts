import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/utils/verifyApiKey";
import { getNotificationByIdService } from "@/services/notification.service";
import { handleErrorResponse } from "@/utils/apiResponse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authenticate the department
    const apiKey = req.headers.get("x-api-key") as string;
    const department = await verifyApiKey(apiKey);

    // 2. Unwrap the params for Next.js 15+
    const resolvedParams = await params;
    const notificationId = resolvedParams.id;

    // 3. Call the service layer, passing BOTH the ID and the Department ID
    const notification = await getNotificationByIdService(
      notificationId,
      String(department._id),
    );

    return NextResponse.json(
      {
        success: true,
        data: notification,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
