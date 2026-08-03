import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/utils/verifyApiKey";
import {
  createNotificationService,
  getAllNotificationsService,
} from "@/services/notification.service";
import { handleErrorResponse } from "@/utils/apiResponse";

export async function POST(req: NextRequest) {
  try {
    // 2. Grab the key (middleware already guaranteed it exists)
    const apiKey = req.headers.get("x-api-key") as string;

    // 3. Verify it in MongoDB
    const department = await verifyApiKey(apiKey);

    // 4. Parse the body
    const body = await req.json();

    // 5. Call the service, attaching the department ID!
    const newNotification = await createNotificationService({
      ...body,
      departmentId: String(department._id),
    });
    return NextResponse.json(
      {
        success: true,
        message: "Notification request queued successfully.",
        data: newNotification,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key") as string;
    const department = await verifyApiKey(apiKey);

    // 2. Pass their verified department ID directly to the service.
    // We completely ignore the URL search parameters so they can't spoof another ID!
    const notifications = await getAllNotificationsService(
      String(department._id),
    );

    return NextResponse.json(
      {
        success: true,
        data: notifications,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
