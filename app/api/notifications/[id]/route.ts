import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getNotificationByIdService } from "@/services/notification.service";
import { handleErrorResponse } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: No session found" },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const notificationId = resolvedParams.id;

    const notification = await getNotificationByIdService(
      notificationId,
      session.departmentId,
    );

    //// console.log("BACKEND DATA CHECK:", JSON.stringify(notification.providerId, null, 2));

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
